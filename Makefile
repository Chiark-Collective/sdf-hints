# ABOUTME: Makefile for sdf-labeler project
# ABOUTME: Provides commands for development, testing, and running the application

.PHONY: help install install-backend install-frontend dev dev-backend dev-frontend \
        test test-backend test-frontend lint format clean

SHELL := /bin/bash

# Colors for output
CYAN := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RESET := \033[0m

help:
	@echo "$(CYAN)SDF Labeler - Development Commands$(RESET)"
	@echo ""
	@echo "$(GREEN)Setup:$(RESET)"
	@echo "  make install          Install all dependencies"
	@echo "  make install-backend  Install backend dependencies"
	@echo "  make install-frontend Install frontend dependencies"
	@echo ""
	@echo "$(GREEN)Development:$(RESET)"
	@echo "  make dev              Run both backend and frontend"
	@echo "  make dev-backend      Run backend only (port 8000)"
	@echo "  make dev-frontend     Run frontend only (port 5173)"
	@echo ""
	@echo "$(GREEN)Testing:$(RESET)"
	@echo "  make test             Run all tests"
	@echo "  make test-backend     Run backend tests"
	@echo "  make test-frontend    Run frontend tests"
	@echo ""
	@echo "$(GREEN)Code Quality:$(RESET)"
	@echo "  make lint             Run linters"
	@echo "  make format           Format code"
	@echo ""
	@echo "$(GREEN)Cleanup:$(RESET)"
	@echo "  make clean            Remove build artifacts"

# =============================================================================
# Installation
# =============================================================================

install: install-backend install-frontend

install-backend:
	@echo "$(CYAN)Installing backend dependencies...$(RESET)"
	cd backend && uv sync

install-frontend:
	@echo "$(CYAN)Installing frontend dependencies...$(RESET)"
	cd frontend && npm install

# =============================================================================
# Development
# =============================================================================

dev:
	@echo "$(CYAN)Starting development servers...$(RESET)"
	@echo "$(YELLOW)Backend: http://localhost:8000$(RESET)"
	@echo "$(YELLOW)Frontend: http://localhost:5173$(RESET)"
	@$(MAKE) -j2 dev-backend dev-frontend

dev-backend:
	cd backend && uv run uvicorn sdf_labeler_api.app:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	cd frontend && npm run dev

# =============================================================================
# Testing
# =============================================================================

test: test-backend test-frontend

test-backend:
	@echo "$(CYAN)Running backend tests...$(RESET)"
	cd backend && uv run pytest tests/ -v

test-frontend:
	@echo "$(CYAN)Running frontend tests...$(RESET)"
	cd frontend && npm test

# =============================================================================
# Code Quality
# =============================================================================

lint:
	@echo "$(CYAN)Linting backend...$(RESET)"
	cd backend && uv run ruff check .
	@echo "$(CYAN)Linting frontend...$(RESET)"
	cd frontend && npm run lint

format:
	@echo "$(CYAN)Formatting backend...$(RESET)"
	cd backend && uv run ruff format .
	@echo "$(CYAN)Formatting frontend...$(RESET)"
	cd frontend && npm run format

# =============================================================================
# Cleanup
# =============================================================================

clean:
	@echo "$(CYAN)Cleaning build artifacts...$(RESET)"
	rm -rf backend/.pytest_cache backend/__pycache__ backend/**/__pycache__
	rm -rf backend/.ruff_cache
	rm -rf frontend/node_modules frontend/dist
	rm -rf .artifacts
