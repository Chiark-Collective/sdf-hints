# Changelog

All notable changes to SDF Labeler will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-12-22

### Added

- Initial project scaffolding with Makefile, frontend, and backend structure
- FastAPI backend with project, point cloud, constraint, and sampling endpoints
- React + React Three Fiber frontend with LOD point cloud viewer
- Octree-based point cloud streaming for million-point scale performance
- Zustand stores for project and label state management
- Constraint models: box, sphere, halfspace, cylinder, painted region, seed propagation
- User-friendly label terminology: "solid" (inside), "empty" (outside), "surface"
- Basic UI: toolbar with mode selection, project panel, label panel, status bar
- Undo/redo support for constraint operations
- Survi integration bridge for sampling functions
- Support for multiple point cloud formats: PLY, LAS/LAZ, CSV, NPZ, Parquet
- Automatic normal estimation using PCA on k-nearest neighbors
- Training sample generation with surface anchors, near-band, and far-field sampling
- Export to survi-compatible Parquet format

### Technical Details

- Backend: FastAPI 0.109+, Pydantic 2.5+, numpy, pandas, trimesh, laspy
- Frontend: React 18, @react-three/fiber 8.15, Three.js 0.160, Zustand, TanStack Query
- Point cloud LOD: Octree with 65k points per node target, screen-space error selection
- Storage: Local filesystem with JSON metadata and NPZ point data
