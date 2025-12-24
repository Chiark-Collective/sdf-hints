// ABOUTME: Ray scribble painter for creating ray-carve constraints
// ABOUTME: Captures scribble strokes and casts rays to find surface hits

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

import { useProjectStore } from '../../stores/projectStore'
import { useLabelStore, type RayCarveConstraint, type RayInfo } from '../../stores/labelStore'
import { useRayScribbleStore, type RayInfo as StoreRayInfo } from '../../stores/rayScribbleStore'
import { useSimplePointCloudRaycast } from '../../hooks/usePointCloudBVH'

const COLORS = {
  solid: '#3b82f6',
  empty: '#f97316',
  surface: '#22c55e',
}

interface RayScribblePainterProps {
  projectId: string
}

export function RayScribblePainter({ projectId }: RayScribblePainterProps) {
  const mode = useProjectStore((s) => s.mode)
  const activeLabel = useProjectStore((s) => s.activeLabel)
  const pointCloudPositions = useProjectStore((s) => s.pointCloudPositions)

  const addConstraint = useLabelStore((s) => s.addConstraint)
  const constraints = useLabelStore((s) => s.getConstraints(projectId))

  const emptyBandWidth = useRayScribbleStore((s) => s.emptyBandWidth)
  const surfaceBandWidth = useRayScribbleStore((s) => s.surfaceBandWidth)
  const isScribbling = useRayScribbleStore((s) => s.isScribbling)
  const currentStrokeRays = useRayScribbleStore((s) => s.currentStrokeRays)
  const startStroke = useRayScribbleStore((s) => s.startStroke)
  const addRayToStroke = useRayScribbleStore((s) => s.addRayToStroke)
  const endStroke = useRayScribbleStore((s) => s.endStroke)
  const cancelStroke = useRayScribbleStore((s) => s.cancelStroke)

  const { camera, raycaster, pointer, gl } = useThree()

  const isActive = mode === 'ray_scribble'

  // Point cloud raycasting
  const { raycast, isReady: raycastReady } = useSimplePointCloudRaycast(
    pointCloudPositions,
    0.1 // threshold for point intersection
  )

  // Track last raycast position to avoid duplicate rays
  const lastRayPosition = useRef<THREE.Vector2>(new THREE.Vector2())
  const MIN_SCREEN_DISTANCE = 5 // Minimum pixels between ray samples

  // Cast ray from current pointer position
  const castRayAtPointer = useCallback(() => {
    if (!raycastReady) return null

    raycaster.setFromCamera(pointer, camera)

    const ray = raycaster.ray
    const hit = raycast(ray)

    if (hit) {
      const rayInfo: StoreRayInfo = {
        origin: [ray.origin.x, ray.origin.y, ray.origin.z],
        direction: [ray.direction.x, ray.direction.y, ray.direction.z],
        hitDistance: hit.distance,
        surfaceNormal: undefined, // Could compute from nearby points
      }
      return rayInfo
    }

    return null
  }, [camera, pointer, raycaster, raycast, raycastReady])

  // Update rays during scribbling
  useFrame(() => {
    if (!isActive || !isScribbling) return

    // Check if pointer moved enough
    const currentPointer = new THREE.Vector2(
      pointer.x * gl.domElement.width,
      pointer.y * gl.domElement.height
    )

    const distance = currentPointer.distanceTo(lastRayPosition.current)
    if (distance < MIN_SCREEN_DISTANCE) return

    lastRayPosition.current.copy(currentPointer)

    // Cast ray and add to stroke
    const rayInfo = castRayAtPointer()
    if (rayInfo) {
      addRayToStroke(rayInfo)
    }
  })

  // Handle start scribbling
  const handleStartScribble = useCallback(() => {
    if (!isActive) return

    startStroke()

    // Cast initial ray
    const rayInfo = castRayAtPointer()
    if (rayInfo) {
      addRayToStroke(rayInfo)
    }

    // Reset last position
    lastRayPosition.current.set(
      pointer.x * gl.domElement.width,
      pointer.y * gl.domElement.height
    )
  }, [isActive, startStroke, castRayAtPointer, addRayToStroke, pointer, gl.domElement])

  // Handle stop scribbling - create constraint
  const handleStopScribble = useCallback(() => {
    if (!isScribbling) return

    const stroke = endStroke()

    // Create constraint if stroke has rays
    if (stroke && stroke.rays.length >= 1) {
      const constraint: RayCarveConstraint = {
        id: crypto.randomUUID(),
        type: 'ray_carve',
        sign: activeLabel,
        weight: 1.0,
        createdAt: Date.now(),
        rays: stroke.rays.map((r) => ({
          origin: r.origin,
          direction: r.direction,
          hitDistance: r.hitDistance,
          surfaceNormal: r.surfaceNormal,
        })),
        emptyBandWidth,
        surfaceBandWidth,
      }

      addConstraint(projectId, constraint)
    }
  }, [
    isScribbling,
    endStroke,
    activeLabel,
    emptyBandWidth,
    surfaceBandWidth,
    addConstraint,
    projectId,
  ])

  // Mouse event handlers
  useEffect(() => {
    if (!isActive) return

    const canvas = gl.domElement

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        handleStartScribble()
      }
    }

    const handleMouseUp = () => {
      handleStopScribble()
    }

    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mouseup', handleMouseUp)

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isActive, handleStartScribble, handleStopScribble, gl.domElement])

  // Keyboard handler for Escape to cancel
  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancelStroke()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isActive, cancelStroke])

  // Get ray carve constraints for this project
  const rayCarves = constraints.filter(
    (c): c is RayCarveConstraint => c.type === 'ray_carve'
  )

  if (!isActive && rayCarves.length === 0) return null

  const color = COLORS[activeLabel]

  return (
    <group>
      {/* Current stroke being drawn */}
      {currentStrokeRays.length > 0 && (
        <RayStrokeVisualization
          rays={currentStrokeRays}
          emptyBandWidth={emptyBandWidth}
          color={color}
          opacity={0.5}
        />
      )}

      {/* Existing ray carve constraints */}
      {rayCarves.map((constraint) => (
        <RayStrokeVisualization
          key={constraint.id}
          rays={constraint.rays}
          emptyBandWidth={constraint.emptyBandWidth}
          color={COLORS[constraint.sign]}
          opacity={0.3}
        />
      ))}
    </group>
  )
}

interface RayStrokeVisualizationProps {
  rays: (StoreRayInfo | RayInfo)[]
  emptyBandWidth: number
  color: string
  opacity: number
}

function RayStrokeVisualization({
  rays,
  emptyBandWidth,
  color,
  opacity,
}: RayStrokeVisualizationProps) {
  // Create geometry for visualizing rays as cones showing empty space
  const coneGeometry = useMemo(() => {
    if (rays.length === 0) return null

    // For each ray, create a cone from origin to hit point - emptyBandWidth
    const positions: number[] = []
    const indices: number[] = []

    const CONE_SEGMENTS = 8

    rays.forEach((ray) => {
      const origin = new THREE.Vector3(...ray.origin)
      const direction = new THREE.Vector3(...ray.direction).normalize()
      const hitDistance = ray.hitDistance

      // Cone end point is hit - emptyBandWidth
      const endDistance = Math.max(0.1, hitDistance - emptyBandWidth)
      const endPoint = origin.clone().add(direction.clone().multiplyScalar(endDistance))

      // Cone radius increases with distance (like a flashlight beam)
      const coneAngle = 0.05 // radians
      const endRadius = endDistance * Math.tan(coneAngle)

      // Create basis vectors perpendicular to ray direction
      const up = Math.abs(direction.y) < 0.9
        ? new THREE.Vector3(0, 1, 0)
        : new THREE.Vector3(1, 0, 0)
      const right = new THREE.Vector3().crossVectors(direction, up).normalize()
      const perpUp = new THREE.Vector3().crossVectors(right, direction).normalize()

      const baseVertexIndex = positions.length / 3

      // Add origin vertex (cone tip)
      positions.push(origin.x, origin.y, origin.z)

      // Add ring of vertices at end
      for (let i = 0; i < CONE_SEGMENTS; i++) {
        const angle = (i / CONE_SEGMENTS) * Math.PI * 2
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)

        const vertex = endPoint.clone()
          .add(right.clone().multiplyScalar(cos * endRadius))
          .add(perpUp.clone().multiplyScalar(sin * endRadius))

        positions.push(vertex.x, vertex.y, vertex.z)
      }

      // Create triangles from tip to ring
      for (let i = 0; i < CONE_SEGMENTS; i++) {
        const nextI = (i + 1) % CONE_SEGMENTS
        indices.push(
          baseVertexIndex, // tip
          baseVertexIndex + 1 + i, // current ring vertex
          baseVertexIndex + 1 + nextI // next ring vertex
        )
      }
    })

    if (positions.length === 0) return null

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()

    return geometry
  }, [rays, emptyBandWidth])

  if (!coneGeometry) return null

  return (
    <mesh geometry={coneGeometry}>
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

