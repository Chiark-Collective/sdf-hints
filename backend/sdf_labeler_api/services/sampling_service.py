# ABOUTME: Training sample generation service
# ABOUTME: Converts constraints to survi-compatible training data

from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from sdf_labeler_api.models.constraints import (
    BoxConstraint,
    ConstraintSet,
    HalfspaceConstraint,
    PaintedRegionConstraint,
    SeedPropagationConstraint,
    SignConvention,
    SphereConstraint,
)
from sdf_labeler_api.models.project import Project
from sdf_labeler_api.models.samples import (
    ExportConfig,
    SampleGenerationRequest,
    SamplePreview,
    TrainingSample,
    TrainingSampleSet,
)


class SamplingService:
    """Service for generating training samples from constraints."""

    def preview(self, project_id: str, request: SampleGenerationRequest) -> SamplePreview:
        """Preview sample distribution before generation."""
        from sdf_labeler_api.config import settings
        from sdf_labeler_api.services.constraint_service import ConstraintService
        from sdf_labeler_api.services.project_service import ProjectService

        project_service = ProjectService(settings.data_dir)
        constraint_service = ConstraintService()

        project = project_service.get(project_id)
        if project is None:
            raise ValueError("Project not found")

        constraints = constraint_service.list_all(project_id)

        # Estimate sample counts based on ratios
        total = request.total_samples
        surface_ratio = project.config.surface_anchor_ratio
        far_ratio = project.config.far_field_ratio
        near_ratio = 1.0 - surface_ratio - far_ratio

        surface_count = int(total * surface_ratio) if request.include_surface else 0
        far_count = int(total * far_ratio)
        near_count = int(total * near_ratio)

        # Count constraint samples
        constraint_count = self._count_constraint_samples(
            constraints, request.samples_per_primitive
        )

        return SamplePreview(
            surface_anchor_count=surface_count,
            near_band_count=near_count,
            far_field_count=far_count,
            constraint_sample_count=constraint_count,
            total_count=surface_count + near_count + far_count + constraint_count,
            preview_samples=[],  # TODO: Generate actual preview
        )

    def generate(self, project_id: str, request: SampleGenerationRequest) -> TrainingSampleSet:
        """Generate training samples from constraints."""
        from sdf_labeler_api.config import settings
        from sdf_labeler_api.services.constraint_service import ConstraintService
        from sdf_labeler_api.services.project_service import ProjectService

        project_service = ProjectService(settings.data_dir)
        constraint_service = ConstraintService()

        project = project_service.get(project_id)
        if project is None:
            raise ValueError("Project not found")

        constraints = constraint_service.list_all(project_id)

        # Load point cloud
        xyz, normals = self._load_pointcloud(project_id, settings.data_dir)

        # Generate samples from constraints
        samples = self._generate_from_constraints(
            xyz=xyz,
            normals=normals,
            constraints=constraints,
            project=project,
            request=request,
        )

        # Save samples
        self._save_samples(project_id, samples, settings.data_dir)

        # Build response
        source_breakdown = {}
        for s in samples:
            source_breakdown[s.source] = source_breakdown.get(s.source, 0) + 1

        return TrainingSampleSet(
            samples=samples,
            sample_count=len(samples),
            source_breakdown=source_breakdown,
        )

    def export_parquet(self, project_id: str) -> Path | None:
        """Export samples as Parquet file."""
        from sdf_labeler_api.config import settings

        samples_path = settings.data_dir / "projects" / project_id / "samples.parquet"
        if not samples_path.exists():
            return None
        return samples_path

    def export_config(self, project_id: str, project: Project) -> ExportConfig:
        """Export SDFTaskSpec-compatible configuration."""
        from sdf_labeler_api.config import settings
        from sdf_labeler_api.services.constraint_service import ConstraintService

        constraint_service = ConstraintService()
        constraints = constraint_service.list_all(project_id)

        # Count samples
        samples_path = settings.data_dir / "projects" / project_id / "samples.parquet"
        sample_count = 0
        if samples_path.exists():
            df = pd.read_parquet(samples_path)
            sample_count = len(df)

        return ExportConfig(
            bounds_low=project.bounds_low or (0, 0, 0),
            bounds_high=project.bounds_high or (1, 1, 1),
            tsdf_trunc=project.config.tsdf_trunc,
            near_band=project.config.near_band,
            tangential_jitter=project.config.tangential_jitter,
            far_field_ratio=project.config.far_field_ratio,
            surface_anchor_ratio=project.config.surface_anchor_ratio,
            knn=project.config.knn_neighbors,
            orientation=project.config.normal_orientation,
            project_id=project.id,
            project_name=project.name,
            sample_count=sample_count,
            constraint_count=len(constraints.constraints),
        )

    def _load_pointcloud(
        self, project_id: str, data_dir: Path
    ) -> tuple[np.ndarray, np.ndarray | None]:
        """Load point cloud for a project."""
        points_path = data_dir / "projects" / project_id / "pointcloud" / "points.npz"
        if not points_path.exists():
            raise ValueError("No point cloud uploaded")

        data = np.load(points_path)
        xyz = data["xyz"]
        normals = data["normals"] if data["normals"].size > 0 else None
        return xyz, normals

    def _count_constraint_samples(
        self, constraints: ConstraintSet, samples_per_primitive: int = 100
    ) -> int:
        """Estimate sample count from constraints."""
        count = 0
        for c in constraints.constraints:
            if isinstance(c, PaintedRegionConstraint):
                count += len(c.point_indices)
            elif isinstance(c, SeedPropagationConstraint):
                count += len(c.propagated_indices)
            elif isinstance(c, (BoxConstraint, SphereConstraint, HalfspaceConstraint)):
                count += samples_per_primitive
        return count

    def _generate_from_constraints(
        self,
        xyz: np.ndarray,
        normals: np.ndarray | None,
        constraints: ConstraintSet,
        project: Project,
        request: SampleGenerationRequest,
    ) -> list[TrainingSample]:
        """Generate samples from all constraints."""
        rng = np.random.default_rng(request.seed)
        samples = []

        n_samples = request.samples_per_primitive

        for constraint in constraints.constraints:
            if isinstance(constraint, BoxConstraint):
                samples.extend(
                    self._sample_box(constraint, rng, project.config.near_band, n_samples)
                )
            elif isinstance(constraint, SphereConstraint):
                samples.extend(
                    self._sample_sphere(constraint, rng, project.config.near_band, n_samples)
                )
            elif isinstance(constraint, HalfspaceConstraint):
                samples.extend(
                    self._sample_halfspace(
                        constraint, xyz, rng, project.config.near_band, n_samples
                    )
                )
            elif isinstance(constraint, PaintedRegionConstraint):
                samples.extend(
                    self._sample_painted(constraint, xyz, normals)
                )
            elif isinstance(constraint, SeedPropagationConstraint):
                samples.extend(
                    self._sample_propagated(constraint, xyz, normals)
                )

        return samples

    def _sample_box(
        self,
        constraint: BoxConstraint,
        rng: np.random.Generator,
        near_band: float,
        n_samples: int,
    ) -> list[TrainingSample]:
        """Generate samples from a box constraint."""
        samples = []
        center = np.array(constraint.center)
        half = np.array(constraint.half_extents)
        for _ in range(n_samples):
            # Random point near box surface
            face = rng.integers(0, 6)
            point = center + rng.uniform(-1, 1, 3) * half

            # Clamp to face
            axis = face // 2
            sign = 1 if face % 2 else -1
            point[axis] = center[axis] + sign * half[axis]

            # Offset based on sign convention
            # EMPTY (outside) = positive SDF, SOLID (inside) = negative SDF
            offset = near_band if constraint.sign == SignConvention.EMPTY else -near_band
            normal = np.zeros(3)
            normal[axis] = sign
            point = point + offset * normal

            # phi directly uses offset: EMPTY=+near_band, SOLID=-near_band
            phi = offset

            samples.append(
                TrainingSample(
                    x=float(point[0]),
                    y=float(point[1]),
                    z=float(point[2]),
                    phi=phi,
                    nx=float(normal[0]),
                    ny=float(normal[1]),
                    nz=float(normal[2]),
                    weight=constraint.weight,
                    source=f"box_{constraint.sign.value}",
                    is_surface=False,
                    is_free=constraint.sign == SignConvention.EMPTY,
                )
            )

        return samples

    def _sample_sphere(
        self,
        constraint: SphereConstraint,
        rng: np.random.Generator,
        near_band: float,
        n_samples: int,
    ) -> list[TrainingSample]:
        """Generate samples from a sphere constraint."""
        samples = []
        center = np.array(constraint.center)
        radius = constraint.radius
        for _ in range(n_samples):
            # Random direction
            direction = rng.standard_normal(3)
            direction /= np.linalg.norm(direction)

            # Point on sphere surface
            point = center + radius * direction

            # Offset based on sign
            # EMPTY (outside) = positive SDF, SOLID (inside) = negative SDF
            offset = near_band if constraint.sign == SignConvention.EMPTY else -near_band
            point = point + offset * direction
            phi = offset

            samples.append(
                TrainingSample(
                    x=float(point[0]),
                    y=float(point[1]),
                    z=float(point[2]),
                    phi=phi,
                    nx=float(direction[0]),
                    ny=float(direction[1]),
                    nz=float(direction[2]),
                    weight=constraint.weight,
                    source=f"sphere_{constraint.sign.value}",
                    is_surface=False,
                    is_free=constraint.sign == SignConvention.EMPTY,
                )
            )

        return samples

    def _sample_halfspace(
        self,
        constraint: HalfspaceConstraint,
        xyz: np.ndarray,
        rng: np.random.Generator,
        near_band: float,
        n_samples: int,
    ) -> list[TrainingSample]:
        """Generate samples from a halfspace constraint."""
        samples = []
        point = np.array(constraint.point)
        normal = np.array(constraint.normal)
        normal /= np.linalg.norm(normal)

        # Sample points in the halfspace region
        bounds_low = xyz.min(axis=0)
        bounds_high = xyz.max(axis=0)
        for _ in range(n_samples):
            # Random point in bounds
            sample_point = rng.uniform(bounds_low, bounds_high)

            # Compute signed distance to plane
            dist = np.dot(sample_point - point, normal)

            # Determine phi based on sign convention
            if constraint.sign == SignConvention.EMPTY:
                phi = abs(dist) + near_band  # Positive (outside)
            else:
                phi = -(abs(dist) + near_band)  # Negative (inside)

            samples.append(
                TrainingSample(
                    x=float(sample_point[0]),
                    y=float(sample_point[1]),
                    z=float(sample_point[2]),
                    phi=phi,
                    nx=float(normal[0]),
                    ny=float(normal[1]),
                    nz=float(normal[2]),
                    weight=constraint.weight,
                    source=f"halfspace_{constraint.sign.value}",
                    is_surface=False,
                    is_free=constraint.sign == SignConvention.EMPTY,
                )
            )

        return samples

    def _sample_painted(
        self,
        constraint: PaintedRegionConstraint,
        xyz: np.ndarray,
        normals: np.ndarray | None,
    ) -> list[TrainingSample]:
        """Generate samples from painted region."""
        samples = []

        for idx in constraint.point_indices:
            if idx >= len(xyz):
                continue

            point = xyz[idx]
            normal = normals[idx] if normals is not None else [0, 0, 1]

            # Surface points have phi=0
            phi = 0.0 if constraint.sign == SignConvention.SURFACE else (
                -0.01 if constraint.sign == SignConvention.SOLID else 0.01
            )

            samples.append(
                TrainingSample(
                    x=float(point[0]),
                    y=float(point[1]),
                    z=float(point[2]),
                    phi=phi,
                    nx=float(normal[0]),
                    ny=float(normal[1]),
                    nz=float(normal[2]),
                    weight=constraint.weight,
                    source=f"painted_{constraint.sign.value}",
                    is_surface=constraint.sign == SignConvention.SURFACE,
                    is_free=constraint.sign == SignConvention.EMPTY,
                )
            )

        return samples

    def _sample_propagated(
        self,
        constraint: SeedPropagationConstraint,
        xyz: np.ndarray,
        normals: np.ndarray | None,
    ) -> list[TrainingSample]:
        """Generate samples from propagated seed."""
        samples = []

        for i, idx in enumerate(constraint.propagated_indices):
            if idx >= len(xyz):
                continue

            point = xyz[idx]
            normal = normals[idx] if normals is not None else [0, 0, 1]
            confidence = constraint.confidences[i] if i < len(constraint.confidences) else 1.0

            phi = 0.0 if constraint.sign == SignConvention.SURFACE else (
                -0.01 if constraint.sign == SignConvention.SOLID else 0.01
            )

            samples.append(
                TrainingSample(
                    x=float(point[0]),
                    y=float(point[1]),
                    z=float(point[2]),
                    phi=phi,
                    nx=float(normal[0]),
                    ny=float(normal[1]),
                    nz=float(normal[2]),
                    weight=constraint.weight * confidence,
                    source=f"propagated_{constraint.sign.value}",
                    is_surface=constraint.sign == SignConvention.SURFACE,
                    is_free=constraint.sign == SignConvention.EMPTY,
                )
            )

        return samples

    def _save_samples(
        self, project_id: str, samples: list[TrainingSample], data_dir: Path
    ) -> None:
        """Save samples to Parquet file."""
        if not samples:
            return

        df = pd.DataFrame([s.model_dump() for s in samples])
        path = data_dir / "projects" / project_id / "samples.parquet"
        df.to_parquet(path)

    def get_samples_for_visualization(
        self, project_id: str, limit: int = 10000, subsample: bool = True
    ) -> "SampleVisualizationResponse":
        """
        Get samples for 3D visualization.

        Args:
            project_id: Project ID
            limit: Maximum samples to return
            subsample: Whether to randomly subsample if count > limit

        Returns:
            SampleVisualizationResponse with minimal sample data for rendering
        """
        from sdf_labeler_api.config import settings
        from sdf_labeler_api.models.samples import SamplePoint, SampleVisualizationResponse

        samples_path = settings.data_dir / "projects" / project_id / "samples.parquet"
        if not samples_path.exists():
            return SampleVisualizationResponse(
                samples=[],
                total_count=0,
                returned_count=0,
                phi_min=0.0,
                phi_max=0.0,
            )

        df = pd.read_parquet(samples_path, columns=["x", "y", "z", "phi"])
        total_count = len(df)

        # Compute phi stats before subsampling
        phi_min = float(df["phi"].min())
        phi_max = float(df["phi"].max())

        # Subsample if needed
        if subsample and total_count > limit:
            indices = np.random.default_rng(seed=42).choice(
                total_count, size=limit, replace=False
            )
            df = df.iloc[indices]

        # Convert to list of SamplePoint
        samples = [
            SamplePoint(x=row["x"], y=row["y"], z=row["z"], phi=row["phi"])
            for _, row in df.iterrows()
        ]

        return SampleVisualizationResponse(
            samples=samples,
            total_count=total_count,
            returned_count=len(samples),
            phi_min=phi_min,
            phi_max=phi_max,
        )
