# ABOUTME: Configuration management for SDF Labeler API
# ABOUTME: Uses pydantic-settings for environment variable loading

from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_prefix="SDF_LABELER_",
        env_file=".env",
        env_file_encoding="utf-8",
    )

    # Server settings
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False

    # Storage settings
    data_dir: Path = Path.home() / ".sdf-labeler" / "data"
    max_upload_size_mb: int = 500

    # Point cloud settings
    octree_node_target: int = 65536  # Target points per octree leaf node
    octree_max_depth: int = 12
    default_normal_k: int = 16

    # CORS settings
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    # Survi integration (optional)
    survi_path: Path | None = None

    def ensure_data_dir(self) -> Path:
        """Ensure data directory exists and return it."""
        self.data_dir.mkdir(parents=True, exist_ok=True)
        return self.data_dir


settings = Settings()
