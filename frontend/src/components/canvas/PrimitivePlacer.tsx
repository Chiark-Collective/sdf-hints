// ABOUTME: 3D component for placing and editing primitives
// ABOUTME: Uses TransformControls for interactive manipulation

import { useRef, useCallback, useEffect, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { TransformControls } from '@react-three/drei'
import * as THREE from 'three'

import { useProjectStore, type LabelType } from '../../stores/projectStore'
import { usePrimitiveStore, type PlacingPrimitive } from '../../stores/primitiveStore'
import {
  useLabelStore,
  type BoxConstraint,
  type SphereConstraint,
  type HalfspaceConstraint,
  type CylinderConstraint,
  type Constraint,
} from '../../stores/labelStore'
import { useConstraintSync } from '../../hooks/useConstraintSync'

// Colors for solid (inside) and empty (outside)
const COLORS = {
  solid: '#3b82f6',
  empty: '#f97316',
  surface: '#22c55e',
  ghost: '#ffffff',
}

interface PrimitivePlacerProps {
  projectId: string
}

export function PrimitivePlacer({ projectId }: PrimitivePlacerProps) {
  const mode = useProjectStore((s) => s.mode)
  const activeLabel = useProjectStore((s) => s.activeLabel)

  const placingPrimitive = usePrimitiveStore((s) => s.placingPrimitive)
  const selectedConstraintId = usePrimitiveStore((s) => s.selectedConstraintId)
  const startPlacing = usePrimitiveStore((s) => s.startPlacing)
  const updatePlacing = usePrimitiveStore((s) => s.updatePlacing)
  const confirmPlacing = usePrimitiveStore((s) => s.confirmPlacing)
  const cancelPlacing = usePrimitiveStore((s) => s.cancelPlacing)
  const selectConstraint = usePrimitiveStore((s) => s.selectConstraint)

  const constraints = useLabelStore((s) => s.getConstraints(projectId))
  const addConstraint = useLabelStore((s) => s.addConstraint)
  const updateConstraint = useLabelStore((s) => s.updateConstraint)
  const removeConstraint = useLabelStore((s) => s.removeConstraint)

  // Backend sync for constraints
  const { createConstraint: syncConstraint, deleteConstraint: syncDeleteConstraint } = useConstraintSync(projectId)

  const { camera, raycaster, pointer } = useThree()

  // Ghost primitive position (follows mouse)
  const [ghostPosition, setGhostPosition] = useState<[number, number, number] | null>(null)

  // Ground plane for raycasting (XZ plane at Y=0, matching the click mesh)
  const groundPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0))
  const intersectPoint = useRef(new THREE.Vector3())

  // Track if we're in primitive mode
  const isActive = mode === 'primitive'

  // Transform mode: translate (G), rotate (R), scale (S)
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate')

  // Update ghost position on mouse move
  useFrame(() => {
    if (!isActive || placingPrimitive) {
      setGhostPosition(null)
      return
    }

    raycaster.setFromCamera(pointer, camera)

    // Try to intersect with point cloud or use ground plane
    if (raycaster.ray.intersectPlane(groundPlane.current, intersectPoint.current)) {
      setGhostPosition([
        intersectPoint.current.x,
        intersectPoint.current.y,
        intersectPoint.current.z,
      ])
    }
  })

  // Handle click to place primitive
  const handleClick = useCallback(
    (_event: THREE.Event) => {
      if (!isActive) return

      // If clicking on empty space, start placing
      if (ghostPosition && !placingPrimitive) {
        startPlacing(ghostPosition)
      }
    },
    [isActive, ghostPosition, placingPrimitive, startPlacing]
  )

  // Handle confirm placement
  const handleConfirmPlacement = useCallback(() => {
    const primitive = confirmPlacing()
    if (!primitive) return

    // Create constraint based on primitive type
    const baseConstraint = {
      id: crypto.randomUUID(),
      sign: activeLabel,
      weight: 1.0,
      createdAt: Date.now(),
    }

    let constraint: Constraint

    switch (primitive.type) {
      case 'box':
        constraint = {
          ...baseConstraint,
          type: 'box',
          center: primitive.position,
          halfExtents: primitive.halfExtents!,
        } as BoxConstraint
        break
      case 'sphere':
        constraint = {
          ...baseConstraint,
          type: 'sphere',
          center: primitive.position,
          radius: primitive.radius!,
        } as SphereConstraint
        break
      case 'halfspace':
        constraint = {
          ...baseConstraint,
          type: 'halfspace',
          point: primitive.position,
          normal: primitive.normal!,
        } as HalfspaceConstraint
        break
      case 'cylinder':
        constraint = {
          ...baseConstraint,
          type: 'cylinder',
          center: primitive.position,
          axis: [0, 0, 1], // Default to Z-up
          radius: primitive.radius!,
          height: primitive.height!,
        } as CylinderConstraint
        break
      default:
        return
    }

    // Add to local store (optimistic update)
    addConstraint(projectId, constraint)

    // Sync to backend
    syncConstraint(constraint)
  }, [confirmPlacing, activeLabel, addConstraint, projectId, syncConstraint])

  // Keyboard handlers
  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Enter':
          if (placingPrimitive) {
            handleConfirmPlacement()
          }
          break
        case 'Escape':
          if (placingPrimitive) {
            cancelPlacing()
          } else if (selectedConstraintId) {
            selectConstraint(null)
          }
          break
        case 'Delete':
        case 'Backspace':
          if (selectedConstraintId) {
            // Remove from local store
            removeConstraint(projectId, selectedConstraintId)
            // Sync deletion to backend
            syncDeleteConstraint(selectedConstraintId)
            selectConstraint(null)
          }
          break
        // Transform mode shortcuts
        case 'g':
        case 'G':
          setTransformMode('translate')
          break
        case 'r':
        case 'R':
          setTransformMode('rotate')
          break
        case 's':
        case 'S':
          setTransformMode('scale')
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    isActive,
    placingPrimitive,
    selectedConstraintId,
    handleConfirmPlacement,
    cancelPlacing,
    selectConstraint,
    removeConstraint,
    syncDeleteConstraint,
    projectId,
  ])

  if (!isActive) return null

  return (
    <group>
      {/* Ghost preview (follows mouse) */}
      {ghostPosition && !placingPrimitive && (
        <GhostPrimitive position={ghostPosition} />
      )}

      {/* Primitive being placed */}
      {placingPrimitive && (
        <PlacingPrimitiveView
          primitive={placingPrimitive}
          label={activeLabel}
          transformMode={transformMode}
          onUpdate={updatePlacing}
          onConfirm={handleConfirmPlacement}
        />
      )}

      {/* Existing constraints */}
      {constraints
        .filter((c) => c.type === 'box' || c.type === 'sphere' || c.type === 'halfspace' || c.type === 'cylinder')
        .map((constraint) => (
          <ConstraintView
            key={constraint.id}
            constraint={constraint}
            isSelected={constraint.id === selectedConstraintId}
            transformMode={transformMode}
            onSelect={() => selectConstraint(constraint.id)}
            onUpdate={(updates) => {
              const updated = { ...constraint, ...updates } as typeof constraint
              updateConstraint(projectId, updated)
            }}
          />
        ))}

      {/* Click handler plane (invisible) */}
      <mesh
        position={[0, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handleClick}
      >
        <planeGeometry args={[1000, 1000]} />
        <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>

      {/* Transform mode indicator */}
      <Html position={[0, 0, 0]} style={{ pointerEvents: 'none' }} center>
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="flex gap-2 bg-gray-900/90 rounded-lg px-3 py-2 text-xs">
            <span className={transformMode === 'translate' ? 'text-blue-400 font-bold' : 'text-gray-400'}>
              [G] Move
            </span>
            <span className={transformMode === 'rotate' ? 'text-blue-400 font-bold' : 'text-gray-400'}>
              [R] Rotate
            </span>
            <span className={transformMode === 'scale' ? 'text-blue-400 font-bold' : 'text-gray-400'}>
              [S] Scale
            </span>
          </div>
        </div>
      </Html>
    </group>
  )
}

interface GhostPrimitiveProps {
  position: [number, number, number]
}

function GhostPrimitive({ position }: GhostPrimitiveProps) {
  const primitiveType = usePrimitiveStore((s) => s.primitiveType)
  const defaultSize = usePrimitiveStore((s) => s.defaultSize)

  const size = defaultSize / 2

  return (
    <group position={position}>
      {primitiveType === 'box' && (
        <mesh>
          <boxGeometry args={[size * 2, size * 2, size * 2]} />
          <meshBasicMaterial
            color={COLORS.ghost}
            transparent
            opacity={0.2}
            wireframe
          />
        </mesh>
      )}
      {primitiveType === 'sphere' && (
        <mesh>
          <sphereGeometry args={[size, 16, 16]} />
          <meshBasicMaterial
            color={COLORS.ghost}
            transparent
            opacity={0.2}
            wireframe
          />
        </mesh>
      )}
      {primitiveType === 'halfspace' && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[size * 4, size * 4]} />
          <meshBasicMaterial
            color={COLORS.ghost}
            transparent
            opacity={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      {primitiveType === 'cylinder' && (
        <mesh>
          <cylinderGeometry args={[size, size, size * 2, 16]} />
          <meshBasicMaterial
            color={COLORS.ghost}
            transparent
            opacity={0.2}
            wireframe
          />
        </mesh>
      )}
    </group>
  )
}

interface PlacingPrimitiveViewProps {
  primitive: PlacingPrimitive
  label: LabelType
  transformMode: 'translate' | 'rotate' | 'scale'
  onUpdate: (updates: Partial<PlacingPrimitive>) => void
  onConfirm: () => void
}

function PlacingPrimitiveView({
  primitive,
  label,
  transformMode,
  onUpdate,
  onConfirm,
}: PlacingPrimitiveViewProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const color = COLORS[label]

  // Handle transform changes
  const handleTransformChange = useCallback(() => {
    if (!meshRef.current) return

    const pos = meshRef.current.position
    onUpdate({
      position: [pos.x, pos.y, pos.z],
    })

    // Update size based on scale
    const scale = meshRef.current.scale
    if (primitive.type === 'box' && primitive.halfExtents) {
      onUpdate({
        halfExtents: [
          primitive.halfExtents[0] * scale.x,
          primitive.halfExtents[1] * scale.y,
          primitive.halfExtents[2] * scale.z,
        ],
      })
      meshRef.current.scale.set(1, 1, 1)
    } else if (primitive.type === 'sphere' && primitive.radius) {
      onUpdate({
        radius: primitive.radius * scale.x,
      })
      meshRef.current.scale.set(1, 1, 1)
    }
  }, [primitive, onUpdate])

  return (
    <group>
      {meshRef.current && (
        <TransformControls
          object={meshRef.current}
          mode={transformMode}
          onObjectChange={handleTransformChange}
          onMouseUp={handleTransformChange}
        />
      )}

      {primitive.type === 'box' && primitive.halfExtents && (
        <mesh ref={meshRef} position={primitive.position}>
          <boxGeometry
            args={[
              primitive.halfExtents[0] * 2,
              primitive.halfExtents[1] * 2,
              primitive.halfExtents[2] * 2,
            ]}
          />
          <meshBasicMaterial color={color} transparent opacity={0.4} />
          <lineSegments>
            <edgesGeometry
              args={[
                new THREE.BoxGeometry(
                  primitive.halfExtents[0] * 2,
                  primitive.halfExtents[1] * 2,
                  primitive.halfExtents[2] * 2
                ),
              ]}
            />
            <lineBasicMaterial color={color} linewidth={2} />
          </lineSegments>
        </mesh>
      )}

      {primitive.type === 'sphere' && primitive.radius && (
        <mesh ref={meshRef} position={primitive.position}>
          <sphereGeometry args={[primitive.radius, 32, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.4} />
        </mesh>
      )}

      {primitive.type === 'halfspace' && primitive.normal && (
        <group ref={meshRef as any} position={primitive.position}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[10, 10]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.2}
              side={THREE.DoubleSide}
            />
          </mesh>
          <arrowHelper
            args={[
              new THREE.Vector3(...primitive.normal),
              new THREE.Vector3(0, 0, 0),
              2,
              color,
              0.4,
              0.2,
            ]}
          />
        </group>
      )}

      {primitive.type === 'cylinder' && primitive.radius && primitive.height && (
        <mesh ref={meshRef} position={primitive.position}>
          <cylinderGeometry args={[primitive.radius, primitive.radius, primitive.height, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.4} />
        </mesh>
      )}

      {/* Confirm button in 3D space */}
      <Html position={[primitive.position[0], primitive.position[1] + 2, primitive.position[2]]}>
        <button
          onClick={onConfirm}
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded shadow-lg hover:bg-blue-700"
        >
          Confirm (Enter)
        </button>
      </Html>
    </group>
  )
}

// Import Html from drei for 3D UI
import { Html } from '@react-three/drei'

interface ConstraintViewProps {
  constraint: Constraint
  isSelected: boolean
  transformMode: 'translate' | 'rotate' | 'scale'
  onSelect: () => void
  onUpdate: (updates: Partial<Constraint>) => void
}

function ConstraintView({
  constraint,
  isSelected,
  transformMode,
  onSelect,
  onUpdate,
}: ConstraintViewProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const color = COLORS[constraint.sign]

  // Handle transform changes for selected constraint
  const handleTransformChange = useCallback(() => {
    if (!meshRef.current || !isSelected) return

    const pos = meshRef.current.position
    const scale = meshRef.current.scale

    if (constraint.type === 'box') {
      const boxConstraint = constraint as BoxConstraint
      // Apply scale to halfExtents and reset scale
      if (scale.x !== 1 || scale.y !== 1 || scale.z !== 1) {
        onUpdate({
          center: [pos.x, pos.y, pos.z],
          halfExtents: [
            boxConstraint.halfExtents[0] * scale.x,
            boxConstraint.halfExtents[1] * scale.y,
            boxConstraint.halfExtents[2] * scale.z,
          ],
        })
        meshRef.current.scale.set(1, 1, 1)
      } else {
        onUpdate({ center: [pos.x, pos.y, pos.z] })
      }
    } else if (constraint.type === 'sphere') {
      const sphereConstraint = constraint as SphereConstraint
      // Use uniform scale for sphere
      if (scale.x !== 1) {
        onUpdate({
          center: [pos.x, pos.y, pos.z],
          radius: sphereConstraint.radius * scale.x,
        })
        meshRef.current.scale.set(1, 1, 1)
      } else {
        onUpdate({ center: [pos.x, pos.y, pos.z] })
      }
    } else if (constraint.type === 'halfspace') {
      onUpdate({ point: [pos.x, pos.y, pos.z] })
    } else if (constraint.type === 'cylinder') {
      const cylConstraint = constraint as CylinderConstraint
      // Scale radius (x/z) and height (y) separately
      if (scale.x !== 1 || scale.y !== 1) {
        onUpdate({
          center: [pos.x, pos.y, pos.z],
          radius: cylConstraint.radius * scale.x,
          height: cylConstraint.height * scale.y,
        })
        meshRef.current.scale.set(1, 1, 1)
      } else {
        onUpdate({ center: [pos.x, pos.y, pos.z] })
      }
    }
  }, [constraint, isSelected, onUpdate])

  // Get position based on constraint type
  const getPosition = (): [number, number, number] => {
    if (constraint.type === 'halfspace') {
      return (constraint as HalfspaceConstraint).point
    }
    if (constraint.type === 'cylinder') {
      return (constraint as CylinderConstraint).center
    }
    return (constraint as BoxConstraint | SphereConstraint).center
  }
  const position = getPosition()

  return (
    <group>
      {isSelected && meshRef.current && (
        <TransformControls
          object={meshRef.current}
          mode={transformMode}
          onObjectChange={handleTransformChange}
          onMouseUp={handleTransformChange}
        />
      )}

      {constraint.type === 'box' && (
        <mesh
          ref={meshRef}
          position={position}
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
          }}
        >
          <boxGeometry
            args={[
              (constraint as BoxConstraint).halfExtents[0] * 2,
              (constraint as BoxConstraint).halfExtents[1] * 2,
              (constraint as BoxConstraint).halfExtents[2] * 2,
            ]}
          />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={isSelected ? 0.5 : 0.3}
          />
          <lineSegments>
            <edgesGeometry
              args={[
                new THREE.BoxGeometry(
                  (constraint as BoxConstraint).halfExtents[0] * 2,
                  (constraint as BoxConstraint).halfExtents[1] * 2,
                  (constraint as BoxConstraint).halfExtents[2] * 2
                ),
              ]}
            />
            <lineBasicMaterial color={isSelected ? '#ffffff' : color} />
          </lineSegments>
        </mesh>
      )}

      {constraint.type === 'sphere' && (
        <mesh
          ref={meshRef}
          position={position}
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
          }}
        >
          <sphereGeometry args={[(constraint as SphereConstraint).radius, 32, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={isSelected ? 0.5 : 0.3}
          />
        </mesh>
      )}

      {constraint.type === 'halfspace' && (
        <group
          ref={meshRef as any}
          position={position}
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
          }}
        >
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[10, 10]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={isSelected ? 0.3 : 0.15}
              side={THREE.DoubleSide}
            />
          </mesh>
          <arrowHelper
            args={[
              new THREE.Vector3(...(constraint as HalfspaceConstraint).normal),
              new THREE.Vector3(0, 0, 0),
              2,
              isSelected ? '#ffffff' : color,
              0.4,
              0.2,
            ]}
          />
        </group>
      )}

      {constraint.type === 'cylinder' && (
        <mesh
          ref={meshRef}
          position={position}
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
          }}
        >
          <cylinderGeometry
            args={[
              (constraint as CylinderConstraint).radius,
              (constraint as CylinderConstraint).radius,
              (constraint as CylinderConstraint).height,
              32,
            ]}
          />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={isSelected ? 0.5 : 0.3}
          />
        </mesh>
      )}
    </group>
  )
}
