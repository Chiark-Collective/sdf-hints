# ABOUTME: Project management service
# ABOUTME: Handles CRUD operations for labeling projects

import json
from datetime import datetime
from pathlib import Path

from sdf_labeler_api.models.project import Project, ProjectConfig, ProjectCreate


class ProjectService:
    """Service for managing labeling projects."""

    def __init__(self, data_dir: Path):
        self.data_dir = data_dir
        self.projects_dir = data_dir / "projects"
        self.projects_dir.mkdir(parents=True, exist_ok=True)

    def _project_path(self, project_id: str) -> Path:
        """Get path to project directory."""
        return self.projects_dir / project_id

    def _metadata_path(self, project_id: str) -> Path:
        """Get path to project metadata file."""
        return self._project_path(project_id) / "project.json"

    def create(self, request: ProjectCreate) -> Project:
        """Create a new project."""
        project = Project(
            name=request.name,
            description=request.description,
            config=request.config,
        )

        # Create project directory
        project_path = self._project_path(project.id)
        project_path.mkdir(parents=True, exist_ok=True)

        # Save metadata
        self._save(project)

        return project

    def get(self, project_id: str) -> Project | None:
        """Get a project by ID."""
        metadata_path = self._metadata_path(project_id)
        if not metadata_path.exists():
            return None

        with open(metadata_path) as f:
            data = json.load(f)

        return Project(**data)

    def list_all(self) -> list[Project]:
        """List all projects."""
        projects = []
        for project_dir in self.projects_dir.iterdir():
            if project_dir.is_dir():
                project = self.get(project_dir.name)
                if project:
                    projects.append(project)

        # Sort by creation date, newest first
        projects.sort(key=lambda p: p.created_at, reverse=True)
        return projects

    def update_config(self, project_id: str, config: ProjectConfig) -> Project | None:
        """Update project configuration."""
        project = self.get(project_id)
        if project is None:
            return None

        project.config = config
        project.updated_at = datetime.utcnow()
        self._save(project)

        return project

    def set_pointcloud(
        self,
        project_id: str,
        pointcloud_id: str,
        bounds_low: tuple[float, float, float],
        bounds_high: tuple[float, float, float],
    ) -> Project | None:
        """Set point cloud reference for a project."""
        project = self.get(project_id)
        if project is None:
            return None

        project.point_cloud_id = pointcloud_id
        project.bounds_low = bounds_low
        project.bounds_high = bounds_high
        project.updated_at = datetime.utcnow()
        self._save(project)

        return project

    def delete(self, project_id: str) -> bool:
        """Delete a project and all associated data."""
        project_path = self._project_path(project_id)
        if not project_path.exists():
            return False

        # Remove all files in project directory
        import shutil

        shutil.rmtree(project_path)
        return True

    def _save(self, project: Project) -> None:
        """Save project metadata to disk."""
        metadata_path = self._metadata_path(project.id)
        with open(metadata_path, "w") as f:
            json.dump(project.model_dump(mode="json"), f, indent=2, default=str)
