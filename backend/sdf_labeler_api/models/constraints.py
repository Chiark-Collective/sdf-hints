# ABOUTME: Constraint models for SDF labeling
# ABOUTME: Defines geometric primitives and regions for inside/outside marking

from enum import Enum
from typing import Annotated, Literal, Union
import uuid

from pydantic import BaseModel, Field


class SignConvention(str, Enum):
    """Sign convention for SDF values.

    User-friendly terminology:
    - SOLID = negative SDF (inside material)
    - EMPTY = positive SDF (outside, free space)
    - SURFACE = zero SDF (on the boundary)
    """

    SOLID = "solid"  # Inside / negative SDF
    EMPTY = "empty"  # Outside / positive SDF
    SURFACE = "surface"  # On boundary / zero SDF


class BaseConstraint(BaseModel):
    """Base class for all constraint types."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str | None = Field(default=None, description="Optional user-friendly name")
    sign: SignConvention = Field(..., description="Label: solid (inside) or empty (outside)")
    weight: float = Field(default=1.0, ge=0.0, le=10.0, description="Sample weight")


class BoxConstraint(BaseConstraint):
    """Axis-aligned bounding box constraint."""

    type: Literal["box"] = "box"
    center: tuple[float, float, float] = Field(..., description="Box center (x, y, z)")
    half_extents: tuple[float, float, float] = Field(
        ..., description="Half-extents in each dimension"
    )


class SphereConstraint(BaseConstraint):
    """Spherical region constraint."""

    type: Literal["sphere"] = "sphere"
    center: tuple[float, float, float] = Field(..., description="Sphere center (x, y, z)")
    radius: float = Field(..., gt=0, description="Sphere radius")


class HalfspaceConstraint(BaseConstraint):
    """Half-space (infinite plane) constraint.

    Defines a plane and which side is labeled.
    The normal points toward the EMPTY (outside) side by convention.
    """

    type: Literal["halfspace"] = "halfspace"
    point: tuple[float, float, float] = Field(..., description="A point on the plane")
    normal: tuple[float, float, float] = Field(
        ..., description="Outward normal (points toward empty/outside)"
    )


class CylinderConstraint(BaseConstraint):
    """Cylindrical region constraint."""

    type: Literal["cylinder"] = "cylinder"
    center: tuple[float, float, float] = Field(..., description="Center of cylinder base")
    axis: tuple[float, float, float] = Field(default=(0, 0, 1), description="Cylinder axis")
    radius: float = Field(..., gt=0, description="Cylinder radius")
    height: float = Field(..., gt=0, description="Cylinder height")


class PaintedRegionConstraint(BaseConstraint):
    """User-painted region on the point cloud."""

    type: Literal["painted_region"] = "painted_region"
    point_indices: list[int] = Field(..., description="Indices of painted points")


class SeedPropagationConstraint(BaseConstraint):
    """Seed point with spatial propagation."""

    type: Literal["seed_propagation"] = "seed_propagation"
    seed_point: tuple[float, float, float] = Field(..., description="Seed location")
    seed_index: int | None = Field(default=None, description="Nearest point index")
    propagation_radius: float = Field(..., gt=0, description="Max propagation distance")
    propagation_method: Literal["euclidean", "geodesic"] = Field(
        default="euclidean", description="Distance metric for propagation"
    )
    # Results populated after propagation
    propagated_indices: list[int] = Field(
        default_factory=list, description="Points reached by propagation"
    )
    confidences: list[float] = Field(
        default_factory=list, description="Confidence per propagated point"
    )


class MLImportConstraint(BaseConstraint):
    """Constraint imported from ML model output."""

    type: Literal["ml_import"] = "ml_import"
    source_file: str = Field(..., description="Original import file name")
    source_class: str | int = Field(..., description="Original ML class/label")
    point_indices: list[int] = Field(..., description="Indices of labeled points")
    confidences: list[float] = Field(
        default_factory=list, description="Per-point confidence scores"
    )


# Union type for all constraints
Constraint = Annotated[
    Union[
        BoxConstraint,
        SphereConstraint,
        HalfspaceConstraint,
        CylinderConstraint,
        PaintedRegionConstraint,
        SeedPropagationConstraint,
        MLImportConstraint,
    ],
    Field(discriminator="type"),
]


class ConstraintSet(BaseModel):
    """Collection of all constraints for a project."""

    constraints: list[Constraint] = Field(default_factory=list)
    total: int = 0

    def __init__(self, **data):
        super().__init__(**data)
        self.total = len(self.constraints)
