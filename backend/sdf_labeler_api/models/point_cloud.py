# ABOUTME: Point cloud related Pydantic models
# ABOUTME: Defines upload responses, statistics, and tile metadata

from pydantic import BaseModel, Field


class PointCloudUploadResponse(BaseModel):
    """Response after uploading and processing a point cloud."""

    id: str = Field(..., description="Point cloud identifier")
    filename: str = Field(..., description="Original filename")
    point_count: int = Field(..., description="Total number of points")
    has_normals: bool = Field(..., description="Whether normals are present/computed")
    bounds_low: tuple[float, float, float] = Field(..., description="Minimum bounds (x, y, z)")
    bounds_high: tuple[float, float, float] = Field(..., description="Maximum bounds (x, y, z)")
    format: str = Field(..., description="Detected file format")


class PointCloudStats(BaseModel):
    """Statistics about a loaded point cloud."""

    point_count: int
    has_normals: bool
    bounds_low: tuple[float, float, float]
    bounds_high: tuple[float, float, float]
    centroid: tuple[float, float, float]
    estimated_density: float = Field(..., description="Points per cubic unit")

    # Octree info
    octree_depth: int
    octree_node_count: int
    lod_levels: int


class OctreeNodeInfo(BaseModel):
    """Information about a single octree node."""

    node_id: str = Field(..., description="Node identifier (e.g., 'r0123')")
    level: int = Field(..., description="Depth in octree (0 = root)")
    bounds_low: tuple[float, float, float]
    bounds_high: tuple[float, float, float]
    point_count: int = Field(..., description="Points in this node")
    children: list[str] = Field(default_factory=list, description="Child node IDs")


class OctreeMetadata(BaseModel):
    """Complete octree metadata for LOD streaming."""

    root_id: str = Field(default="r", description="Root node ID")
    bounds_low: tuple[float, float, float]
    bounds_high: tuple[float, float, float]
    total_points: int
    max_depth: int
    node_count: int
    nodes: dict[str, OctreeNodeInfo] = Field(
        default_factory=dict, description="All nodes indexed by ID"
    )


class TileData(BaseModel):
    """Point data for a single octree tile."""

    node_id: str
    point_count: int
    # Positions as flat array [x0, y0, z0, x1, y1, z1, ...]
    positions: list[float]
    # Normals as flat array (optional)
    normals: list[float] | None = None
    # Labels as array (0=unlabeled, 1=solid, 2=empty)
    labels: list[int] | None = None
