// ABOUTME: Hook for syncing constraints with the backend API
// ABOUTME: Provides mutations for creating, updating, and deleting constraints

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useLabelStore, type Constraint } from '../stores/labelStore'

const API_BASE = '/v1'

interface RayInfoRequest {
  origin: [number, number, number]
  direction: [number, number, number]
  hit_distance: number
  surface_normal?: [number, number, number]
  hit_point_index?: number
  local_spacing?: number
}

interface ConstraintCreateRequest {
  type: string
  name?: string
  sign: 'solid' | 'empty' | 'surface'
  weight: number
  center?: [number, number, number]
  half_extents?: [number, number, number]
  radius?: number
  height?: number
  axis?: [number, number, number]
  point?: [number, number, number]
  normal?: [number, number, number]
  stroke_points?: [number, number, number][]
  // Ray carve fields
  rays?: RayInfoRequest[]
  empty_band_width?: number
  surface_band_width?: number
  back_buffer_width?: number
  back_buffer_coefficient?: number
}

async function createConstraint(
  projectId: string,
  constraint: ConstraintCreateRequest
): Promise<Constraint> {
  const response = await fetch(`${API_BASE}/projects/${projectId}/constraints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(constraint),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to create constraint' }))
    throw new Error(error.detail)
  }

  return response.json()
}

async function deleteConstraintApi(
  projectId: string,
  constraintId: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE}/projects/${projectId}/constraints/${constraintId}`,
    { method: 'DELETE' }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to delete constraint' }))
    throw new Error(error.detail)
  }
}

export function useConstraintSync(projectId: string | null) {
  const queryClient = useQueryClient()
  const removeConstraintFromStore = useLabelStore((s) => s.removeConstraint)

  const createMutation = useMutation({
    mutationFn: async (constraint: Constraint) => {
      if (!projectId) throw new Error('No project selected')

      // Convert store constraint to API format
      const request: ConstraintCreateRequest = {
        type: constraint.type,
        name: constraint.name,
        sign: constraint.sign,
        weight: constraint.weight,
      }

      if (constraint.type === 'box') {
        request.center = constraint.center
        request.half_extents = constraint.halfExtents
      } else if (constraint.type === 'sphere') {
        request.center = constraint.center
        request.radius = constraint.radius
      } else if (constraint.type === 'halfspace') {
        request.point = constraint.point
        request.normal = constraint.normal
      } else if (constraint.type === 'cylinder') {
        request.center = constraint.center
        request.radius = constraint.radius
        request.height = constraint.height
        request.axis = constraint.axis
      } else if (constraint.type === 'brush_stroke') {
        request.stroke_points = constraint.strokePoints
        request.radius = constraint.radius
      } else if (constraint.type === 'ray_carve') {
        request.rays = constraint.rays.map((r) => ({
          origin: r.origin,
          direction: r.direction,
          hit_distance: r.hitDistance,
          surface_normal: r.surfaceNormal,
          hit_point_index: r.hitPointIndex,
          local_spacing: r.localSpacing,
        }))
        request.empty_band_width = constraint.emptyBandWidth
        request.surface_band_width = constraint.surfaceBandWidth
        request.back_buffer_width = constraint.backBufferWidth
        request.back_buffer_coefficient = constraint.backBufferCoefficient
      }

      return createConstraint(projectId, request)
    },
    onSuccess: () => {
      // Constraint already added to store optimistically
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] })
    },
    onError: (error, constraint) => {
      // Remove from store on failure
      if (projectId) {
        removeConstraintFromStore(projectId, constraint.id)
      }
      console.error('Failed to create constraint:', error)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (constraintId: string) => {
      if (!projectId) throw new Error('No project selected')
      return deleteConstraintApi(projectId, constraintId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] })
    },
    onError: (error) => {
      console.error('Failed to delete constraint:', error)
    },
  })

  return {
    createConstraint: createMutation.mutate,
    deleteConstraint: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
