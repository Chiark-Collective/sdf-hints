// ABOUTME: 3D brush painter component for direct point cloud painting
// ABOUTME: Renders spherical brush cursor and handles paint interactions

import { useRef, useCallback, useState, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

import { useProjectStore } from '../../stores/projectStore'
import { useLabelStore, type PaintedRegionConstraint } from '../../stores/labelStore'

const COLORS = {
  solid: '#3b82f6',
  empty: '#f97316',
  surface: '#22c55e',
}

interface BrushPainterProps {
  projectId: string
  depthAware: boolean
}

export function BrushPainter({ projectId, depthAware: _depthAware }: BrushPainterProps) {
  const mode = useProjectStore((s) => s.mode)
  const activeLabel = useProjectStore((s) => s.activeLabel)
  const brushRadius = useProjectStore((s) => s.brushRadius)
  const selectPoints = useProjectStore((s) => s.selectPoints)
  const selectedPointIndices = useProjectStore((s) => s.selectedPointIndices)
  const clearSelection = useProjectStore((s) => s.clearSelection)
  const points = useProjectStore((s) => s.pointCloudPositions)

  const addConstraint = useLabelStore((s) => s.addConstraint)

  const { camera, raycaster, pointer, gl } = useThree()

  const [brushPosition, setBrushPosition] = useState<[number, number, number] | null>(null)
  const [isPainting, setIsPainting] = useState(false)
  const brushRef = useRef<THREE.Mesh>(null)

  const isActive = mode === 'brush'

  // Build spatial index for points (simple grid-based for now)
  const spatialIndex = useRef<Map<string, number[]>>(new Map())
  const cellSize = useRef(0.5)

  useEffect(() => {
    if (!points || points.length === 0) return

    spatialIndex.current.clear()
    const numPoints = points.length / 3

    // Adjust cell size based on brush radius
    cellSize.current = Math.max(brushRadius * 2, 0.2)

    for (let i = 0; i < numPoints; i++) {
      const x = points[i * 3]
      const y = points[i * 3 + 1]
      const z = points[i * 3 + 2]

      const cellX = Math.floor(x / cellSize.current)
      const cellY = Math.floor(y / cellSize.current)
      const cellZ = Math.floor(z / cellSize.current)
      const key = `${cellX},${cellY},${cellZ}`

      if (!spatialIndex.current.has(key)) {
        spatialIndex.current.set(key, [])
      }
      spatialIndex.current.get(key)!.push(i)
    }
  }, [points, brushRadius])

  // Find points within brush sphere
  const getPointsInBrush = useCallback(
    (center: THREE.Vector3): number[] => {
      if (!points || points.length === 0) return []

      const radiusSquared = brushRadius * brushRadius
      const indices: number[] = []

      // Get cells that might contain points
      const minCellX = Math.floor((center.x - brushRadius) / cellSize.current)
      const maxCellX = Math.floor((center.x + brushRadius) / cellSize.current)
      const minCellY = Math.floor((center.y - brushRadius) / cellSize.current)
      const maxCellY = Math.floor((center.y + brushRadius) / cellSize.current)
      const minCellZ = Math.floor((center.z - brushRadius) / cellSize.current)
      const maxCellZ = Math.floor((center.z + brushRadius) / cellSize.current)

      for (let cx = minCellX; cx <= maxCellX; cx++) {
        for (let cy = minCellY; cy <= maxCellY; cy++) {
          for (let cz = minCellZ; cz <= maxCellZ; cz++) {
            const key = `${cx},${cy},${cz}`
            const cellPoints = spatialIndex.current.get(key)
            if (!cellPoints) continue

            for (const idx of cellPoints) {
              const px = points[idx * 3]
              const py = points[idx * 3 + 1]
              const pz = points[idx * 3 + 2]

              const dx = px - center.x
              const dy = py - center.y
              const dz = pz - center.z
              const distSquared = dx * dx + dy * dy + dz * dz

              if (distSquared <= radiusSquared) {
                indices.push(idx)
              }
            }
          }
        }
      }

      return indices
    },
    [points, brushRadius]
  )

  // Ground plane for raycasting (XZ plane at Y=0)
  const groundPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0))
  const intersectPoint = useRef(new THREE.Vector3())

  // Update brush position on mouse move
  useFrame(() => {
    if (!isActive) {
      setBrushPosition(null)
      return
    }

    raycaster.setFromCamera(pointer, camera)

    // Use ground plane for brush position (points array not needed for cursor)
    if (raycaster.ray.intersectPlane(groundPlane.current, intersectPoint.current)) {
      setBrushPosition([
        intersectPoint.current.x,
        intersectPoint.current.y,
        intersectPoint.current.z,
      ])
    }
  })

  // Handle painting
  const handlePaint = useCallback(() => {
    if (!brushPosition || !isActive) return

    const center = new THREE.Vector3(...brushPosition)
    const indices = getPointsInBrush(center)

    if (indices.length > 0) {
      selectPoints(indices)
    }
  }, [brushPosition, isActive, getPointsInBrush, selectPoints])

  // Mouse event handlers
  useEffect(() => {
    if (!isActive) return

    const canvas = gl.domElement

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        setIsPainting(true)
        handlePaint()
      }
    }

    const handleMouseUp = () => {
      setIsPainting(false)
    }

    const handleMouseMove = () => {
      if (isPainting) {
        handlePaint()
      }
    }

    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('mousemove', handleMouseMove)

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('mousemove', handleMouseMove)
    }
  }, [isActive, isPainting, handlePaint, gl.domElement])

  // Keyboard handlers for confirming selection as constraint
  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && selectedPointIndices.size > 0) {
        // Create painted region constraint
        const constraint: PaintedRegionConstraint = {
          id: crypto.randomUUID(),
          type: 'painted_region',
          sign: activeLabel,
          weight: 1.0,
          createdAt: Date.now(),
          pointIndices: Array.from(selectedPointIndices),
        }

        addConstraint(projectId, constraint)
        clearSelection()
      } else if (e.key === 'Escape') {
        clearSelection()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isActive, selectedPointIndices, activeLabel, addConstraint, projectId, clearSelection])

  if (!isActive || !brushPosition) return null

  const color = COLORS[activeLabel]

  return (
    <group>
      {/* Brush sphere */}
      <mesh ref={brushRef} position={brushPosition}>
        <sphereGeometry args={[brushRadius, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isPainting ? 0.4 : 0.2}
          wireframe={!isPainting}
        />
      </mesh>

      {/* Brush outline */}
      <mesh position={brushPosition}>
        <sphereGeometry args={[brushRadius, 16, 16]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.6} />
      </mesh>
    </group>
  )
}
