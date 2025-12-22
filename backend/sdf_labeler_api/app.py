# ABOUTME: FastAPI application entry point for SDF Labeler API
# ABOUTME: Defines routes for project management, point cloud handling, and sample generation

from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

from sdf_labeler_api.config import settings
from sdf_labeler_api.models.constraints import Constraint, ConstraintSet
from sdf_labeler_api.models.project import (
    Project,
    ProjectConfig,
    ProjectCreate,
    ProjectList,
)
from sdf_labeler_api.models.point_cloud import (
    PointCloudStats,
    PointCloudUploadResponse,
)
from sdf_labeler_api.models.samples import (
    SampleGenerationRequest,
    SamplePreview,
    TrainingSampleSet,
)
from sdf_labeler_api.services.project_service import ProjectService
from sdf_labeler_api.services.pointcloud_service import PointCloudService
from sdf_labeler_api.services.constraint_service import ConstraintService
from sdf_labeler_api.services.sampling_service import SamplingService


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown."""
    # Startup: ensure data directory exists
    settings.ensure_data_dir()
    yield
    # Shutdown: cleanup if needed


app = FastAPI(
    title="SDF Labeler API",
    description="Backend API for interactive SDF training data generation",
    version="0.1.0",
    lifespan=lifespan,
)

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
project_service = ProjectService(settings.data_dir)
pointcloud_service = PointCloudService(settings)
constraint_service = ConstraintService()
sampling_service = SamplingService()


# =============================================================================
# Health Check
# =============================================================================


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": "0.1.0"}


# =============================================================================
# Project Management
# =============================================================================


@app.post("/v1/projects", response_model=Project)
async def create_project(project: ProjectCreate):
    """Create a new labeling project."""
    return project_service.create(project)


@app.get("/v1/projects", response_model=ProjectList)
async def list_projects():
    """List all projects."""
    projects = project_service.list_all()
    return ProjectList(projects=projects, total=len(projects))


@app.get("/v1/projects/{project_id}", response_model=Project)
async def get_project(project_id: str):
    """Get project details."""
    project = project_service.get(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@app.patch("/v1/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, config: ProjectConfig):
    """Update project configuration."""
    project = project_service.update_config(project_id, config)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@app.delete("/v1/projects/{project_id}")
async def delete_project(project_id: str):
    """Delete a project and all associated data."""
    success = project_service.delete(project_id)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"status": "deleted", "project_id": project_id}


# =============================================================================
# Point Cloud Management
# =============================================================================


@app.post("/v1/projects/{project_id}/pointcloud", response_model=PointCloudUploadResponse)
async def upload_pointcloud(
    project_id: str,
    file: UploadFile = File(...),
    estimate_normals: bool = True,
    normal_k: int = 16,
):
    """Upload and process a point cloud file.

    Supports: PLY, LAS/LAZ, CSV, Parquet, NPY, NPZ
    """
    project = project_service.get(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    try:
        result = await pointcloud_service.upload_and_process(
            project_id=project_id,
            file=file,
            estimate_normals=estimate_normals,
            normal_k=normal_k,
        )
        # Update project with point cloud reference
        project_service.set_pointcloud(project_id, result.id, result.bounds_low, result.bounds_high)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/v1/projects/{project_id}/pointcloud", response_model=PointCloudStats)
async def get_pointcloud_stats(project_id: str):
    """Get point cloud statistics."""
    project = project_service.get(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.point_cloud_id is None:
        raise HTTPException(status_code=404, detail="No point cloud uploaded")

    stats = pointcloud_service.get_stats(project_id)
    if stats is None:
        raise HTTPException(status_code=404, detail="Point cloud not found")
    return stats


@app.get("/v1/projects/{project_id}/pointcloud/tiles/{level}/{x}/{y}/{z}")
async def get_pointcloud_tile(
    project_id: str,
    level: int,
    x: int,
    y: int,
    z: int,
):
    """Get a specific octree tile for LOD rendering."""
    project = project_service.get(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    tile_data = pointcloud_service.get_tile(project_id, level, x, y, z)
    if tile_data is None:
        raise HTTPException(status_code=404, detail="Tile not found")

    return JSONResponse(content=tile_data)


@app.get("/v1/projects/{project_id}/pointcloud/metadata")
async def get_pointcloud_metadata(project_id: str):
    """Get octree metadata for LOD streaming."""
    project = project_service.get(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    metadata = pointcloud_service.get_octree_metadata(project_id)
    if metadata is None:
        raise HTTPException(status_code=404, detail="Point cloud not found")

    return metadata


# =============================================================================
# Constraint Management
# =============================================================================


@app.post("/v1/projects/{project_id}/constraints", response_model=Constraint)
async def add_constraint(project_id: str, constraint: Constraint):
    """Add a constraint to the project."""
    project = project_service.get(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    return constraint_service.add(project_id, constraint)


@app.get("/v1/projects/{project_id}/constraints", response_model=ConstraintSet)
async def list_constraints(project_id: str):
    """List all constraints in a project."""
    project = project_service.get(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    return constraint_service.list_all(project_id)


@app.delete("/v1/projects/{project_id}/constraints/{constraint_id}")
async def delete_constraint(project_id: str, constraint_id: str):
    """Delete a constraint."""
    success = constraint_service.delete(project_id, constraint_id)
    if not success:
        raise HTTPException(status_code=404, detail="Constraint not found")
    return {"status": "deleted", "constraint_id": constraint_id}


# =============================================================================
# Sample Generation
# =============================================================================


@app.post("/v1/projects/{project_id}/samples/preview", response_model=SamplePreview)
async def preview_samples(project_id: str, request: SampleGenerationRequest):
    """Preview what training samples will be generated."""
    project = project_service.get(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    return sampling_service.preview(project_id, request)


@app.post("/v1/projects/{project_id}/samples/generate", response_model=TrainingSampleSet)
async def generate_samples(project_id: str, request: SampleGenerationRequest):
    """Generate training samples from constraints."""
    project = project_service.get(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    return sampling_service.generate(project_id, request)


# =============================================================================
# Export
# =============================================================================


@app.get("/v1/projects/{project_id}/export/parquet")
async def export_parquet(project_id: str):
    """Export training data as Parquet file (survi-compatible)."""
    project = project_service.get(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    path = sampling_service.export_parquet(project_id)
    if path is None:
        raise HTTPException(status_code=404, detail="No samples generated")

    return FileResponse(
        path=path,
        media_type="application/octet-stream",
        filename=f"{project_id}_samples.parquet",
    )


@app.get("/v1/projects/{project_id}/export/config")
async def export_config(project_id: str):
    """Export SDFTaskSpec as JSON for survi CLI."""
    project = project_service.get(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    config = sampling_service.export_config(project_id, project)
    return config
