// ABOUTME: Main application component
// ABOUTME: Combines 3D viewport with UI panels for SDF labeling

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stats, GizmoHelper, GizmoViewport } from '@react-three/drei'
import { Leva } from 'leva'
import { Suspense } from 'react'

import { ToastProvider } from './components/ui/ToastProvider'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { PointCloudViewer } from './components/canvas/PointCloudViewer'
import { SelectionVolume } from './components/canvas/SelectionVolume'
import { PrimitivePlacer } from './components/canvas/PrimitivePlacer'
import { BrushPainter } from './components/canvas/BrushPainter'
import { SeedPlacer } from './components/canvas/SeedPlacer'
import { useBrushStore } from './stores/brushStore'
import { useSeedStore } from './stores/seedStore'
import { Toolbar } from './components/ui/Toolbar'
import { ProjectPanel } from './components/ui/ProjectPanel'
import { LabelPanel } from './components/ui/LabelPanel'
import { StatusBar } from './components/ui/StatusBar'
import { useProjectStore } from './stores/projectStore'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

function Scene() {
  const projectId = useProjectStore((s) => s.currentProjectId)
  const mode = useProjectStore((s) => s.mode)
  const depthAware = useBrushStore((s) => s.depthAware)
  const seeds = useSeedStore((s) => s.seeds)
  const addSeed = useSeedStore((s) => s.addSeed)
  const propagationRadius = useSeedStore((s) => s.propagationRadius)

  // Disable orbit controls when using interactive modes
  const orbitEnabled = mode === 'orbit'

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Point cloud viewer */}
      {projectId && (
        <Suspense fallback={null}>
          <PointCloudViewer projectId={projectId} />
        </Suspense>
      )}

      {/* Selection volume visualization */}
      <SelectionVolume />

      {/* Primitive placer (when in primitive mode) */}
      {projectId && <PrimitivePlacer projectId={projectId} />}

      {/* Brush painter (when in brush mode) */}
      {projectId && (
        <BrushPainter
          projectId={projectId}
          points={null}
          depthAware={depthAware}
        />
      )}

      {/* Seed placer (when in seed mode) */}
      {projectId && (
        <SeedPlacer
          projectId={projectId}
          seeds={seeds}
          onAddSeed={addSeed}
          propagationRadius={propagationRadius}
        />
      )}

      {/* Camera controls - disabled when using interactive modes */}
      <OrbitControls makeDefault enabled={orbitEnabled} />

      {/* Gizmo helper */}
      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport axisColors={['#f87171', '#4ade80', '#60a5fa']} labelColor="white" />
      </GizmoHelper>

      {/* Performance stats (dev only) - positioned via CSS in index.css */}
      {import.meta.env.DEV && <Stats className="stats-panel" />}
    </>
  )
}

export default function App() {
  // Global keyboard shortcuts
  useKeyboardShortcuts()

  return (
    <ErrorBoundary>
      <ToastProvider>
        <div className="flex flex-col h-screen bg-gray-950">
          {/* Top toolbar */}
          <Toolbar />

          {/* Main content area */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left panel - Project & file management */}
            <ProjectPanel />

            {/* 3D Viewport */}
            <div className="flex-1 relative canvas-container">
              <Canvas
                camera={{ position: [5, 5, 5], fov: 50 }}
                gl={{ antialias: true, alpha: false }}
                dpr={[1, 2]}
              >
                <color attach="background" args={['#0f0f0f']} />
                <Scene />
              </Canvas>

              {/* Leva controls (debug panel) */}
              <Leva
                collapsed
                flat
                titleBar={{ title: 'Debug Controls' }}
                theme={{
                  colors: {
                    elevation1: '#1f1f1f',
                    elevation2: '#2a2a2a',
                    elevation3: '#3a3a3a',
                  },
                }}
              />
            </div>

            {/* Right panel - Label controls */}
            <LabelPanel />
          </div>

          {/* Status bar */}
          <StatusBar />
        </div>
      </ToastProvider>
    </ErrorBoundary>
  )
}
