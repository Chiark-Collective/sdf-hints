# ABOUTME: Service for loading pre-built scenario datasets (trenchfoot, SDF scenarios)
# ABOUTME: Provides access to bundled point clouds and meshes for testing/demo purposes

from __future__ import annotations

import logging
from dataclasses import dataclass
from importlib import resources
from pathlib import Path
from typing import TYPE_CHECKING

import laspy
import numpy as np
import pandas as pd
import trimesh

if TYPE_CHECKING:
    from numpy.typing import NDArray

logger = logging.getLogger(__name__)


@dataclass
class ScenarioInfo:
    """Metadata about an available scenario."""

    name: str
    description: str
    category: str  # "trenchfoot", "sdf", etc.
    preview_url: str | None = None
    point_count: int | None = None


@dataclass
class LoadedScenario:
    """A loaded scenario with point cloud and optional mesh."""

    name: str
    points: pd.DataFrame  # columns: x, y, z, and optionally nx, ny, nz
    mesh: trimesh.Trimesh | None
    bounds: tuple[NDArray[np.float64], NDArray[np.float64]]  # (min, max)
    metadata: dict


def list_trenchfoot_scenarios() -> list[ScenarioInfo]:
    """List available trenchfoot scenarios from the surface-scenarios package."""
    try:
        import survi_scenarios

        base = resources.files(survi_scenarios).joinpath("data/scenarios/trenchfoot")

        scenarios = []
        for item in base.iterdir():
            if item.is_dir() and item.name.startswith("S"):
                # Read scene.json for description
                scene_json = item.joinpath("scene.json")
                description = f"Trenchfoot scenario {item.name}"

                scenarios.append(
                    ScenarioInfo(
                        name=item.name,
                        description=description,
                        category="trenchfoot",
                        preview_url=None,  # Could serve preview images via API
                    )
                )

        # Sort by name
        scenarios.sort(key=lambda s: s.name)
        return scenarios

    except ImportError:
        logger.warning("survi_scenarios package not available")
        return []
    except Exception as e:
        logger.error(f"Error listing trenchfoot scenarios: {e}")
        return []


def list_sdf_scenarios() -> list[ScenarioInfo]:
    """List available SDF scenarios from the surface-scenarios package."""
    try:
        from survi_scenarios import list_sdf_scenarios as _list_sdf

        scenario_names = _list_sdf()
        return [
            ScenarioInfo(
                name=name,
                description=f"SDF scenario: {name.replace('_', ' ').title()}",
                category="sdf",
            )
            for name in scenario_names
        ]

    except ImportError:
        logger.warning("survi_scenarios package not available")
        return []
    except Exception as e:
        logger.error(f"Error listing SDF scenarios: {e}")
        return []


def load_trenchfoot_scenario(
    scenario_name: str,
    variant: str = "culled",
    resolution: float = 0.050,
) -> LoadedScenario:
    """
    Load a trenchfoot scenario by name.

    Args:
        scenario_name: Name of the scenario (e.g., "S01_straight_vwalls")
        variant: "culled" or "full" point cloud variant
        resolution: Point cloud resolution (default 0.050)

    Returns:
        LoadedScenario with point cloud DataFrame and mesh
    """
    import survi_scenarios

    base = resources.files(survi_scenarios).joinpath("data/scenarios/trenchfoot")
    scenario_dir = base.joinpath(scenario_name)

    if not scenario_dir.is_dir():
        raise ValueError(f"Scenario not found: {scenario_name}")

    # Load point cloud (LAS format)
    resolution_str = f"resolution{resolution:.3f}".replace(".", "p")
    las_path = scenario_dir.joinpath(f"point_clouds/{variant}/{resolution_str}.las")

    if not las_path.is_file():
        # Try to find any LAS file in the variant directory
        variant_dir = scenario_dir.joinpath(f"point_clouds/{variant}")
        las_files = list(variant_dir.iterdir()) if variant_dir.is_dir() else []
        las_files = [f for f in las_files if f.name.endswith(".las")]
        if las_files:
            las_path = las_files[0]
        else:
            raise ValueError(f"No point cloud found for {scenario_name}/{variant}")

    # Read LAS file
    with resources.as_file(las_path) as path:
        las = laspy.read(str(path))

    points_data = {
        "x": np.asarray(las.x, dtype=np.float64),
        "y": np.asarray(las.y, dtype=np.float64),
        "z": np.asarray(las.z, dtype=np.float64),
    }

    # Check for normals
    if hasattr(las, "NormalX") and hasattr(las, "NormalY") and hasattr(las, "NormalZ"):
        points_data["nx"] = np.asarray(las.NormalX, dtype=np.float64)
        points_data["ny"] = np.asarray(las.NormalY, dtype=np.float64)
        points_data["nz"] = np.asarray(las.NormalZ, dtype=np.float64)

    points_df = pd.DataFrame(points_data)

    # Load mesh
    mesh = None
    mesh_candidates = [
        scenario_dir.joinpath("meshes/trench_scene_culled.obj"),
        scenario_dir.joinpath("trench_scene.obj"),
        scenario_dir.joinpath("meshes/trench_scene.obj"),
    ]

    for mesh_path in mesh_candidates:
        if mesh_path.is_file():
            try:
                with resources.as_file(mesh_path) as path:
                    loaded = trimesh.load(str(path))
                    if isinstance(loaded, trimesh.Scene):
                        # Concatenate all geometries
                        meshes = [g for g in loaded.geometry.values() if isinstance(g, trimesh.Trimesh)]
                        if meshes:
                            mesh = trimesh.util.concatenate(meshes)
                    else:
                        mesh = loaded
                    break
            except Exception as e:
                logger.warning(f"Failed to load mesh {mesh_path}: {e}")

    # Compute bounds
    coords = points_df[["x", "y", "z"]].values
    bounds = (coords.min(axis=0), coords.max(axis=0))

    # Load metadata
    metadata = {
        "scenario": scenario_name,
        "variant": variant,
        "point_count": len(points_df),
        "has_normals": "nx" in points_df.columns,
        "has_mesh": mesh is not None,
    }

    # Try to load scene.json
    scene_json_path = scenario_dir.joinpath("scene.json")
    if scene_json_path.is_file():
        import json

        with resources.as_file(scene_json_path) as path:
            with open(path) as f:
                metadata["scene_spec"] = json.load(f)

    return LoadedScenario(
        name=scenario_name,
        points=points_df,
        mesh=mesh,
        bounds=bounds,
        metadata=metadata,
    )


def load_sdf_scenario(scenario_name: str) -> LoadedScenario:
    """
    Load an SDF scenario by name.

    Args:
        scenario_name: Name of the scenario (e.g., "torus_compact")

    Returns:
        LoadedScenario with point cloud DataFrame and mesh
    """
    from survi_scenarios import load_sdf_scenario as _load_sdf

    surface = _load_sdf(scenario_name)

    # Convert to DataFrame
    points_df = surface.surface_df.copy()

    # Ensure required columns exist
    if "x" not in points_df.columns:
        raise ValueError(f"SDF scenario {scenario_name} missing coordinate columns")

    # Load mesh if available
    mesh = surface.mesh if hasattr(surface, "mesh") and surface.mesh is not None else None

    # Compute bounds
    coords = points_df[["x", "y", "z"]].values
    bounds = (coords.min(axis=0), coords.max(axis=0))

    metadata = {
        "scenario": scenario_name,
        "category": "sdf",
        "point_count": len(points_df),
        "has_normals": "nx" in points_df.columns,
        "has_mesh": mesh is not None,
    }

    return LoadedScenario(
        name=scenario_name,
        points=points_df,
        mesh=mesh,
        bounds=bounds,
        metadata=metadata,
    )
