// ABOUTME: Right sidebar panel for label selection and constraint list
// ABOUTME: Shows active label type and list of created constraints

import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import * as ToggleGroup from '@radix-ui/react-toggle-group'
import { TrashIcon, DownloadIcon } from '@radix-ui/react-icons'

import { useProjectStore, type LabelType } from '../../stores/projectStore'
import { useLabelStore, type Constraint } from '../../stores/labelStore'
import { useSliceStore } from '../../stores/sliceStore'
import { useBrushStore } from '../../stores/brushStore'
import { useSeedStore } from '../../stores/seedStore'
import { useConstraintSync } from '../../hooks/useConstraintSync'
import { toast } from '../../stores/toastStore'
import { LoadingButton } from './Spinner'
import { PrimitiveMode } from '../modes/PrimitiveMode'
import { SliceMode } from '../modes/SliceMode'
import { BrushMode } from '../modes/BrushMode'
import { SeedMode } from '../modes/SeedMode'
import { MLImportMode } from '../modes/MLImportMode'
import { generateSamples, exportParquet } from '../../services/api'

const labelOptions: { value: LabelType; label: string; description: string; color: string }[] = [
  {
    value: 'solid',
    label: 'Solid',
    description: 'Inside the surface (material)',
    color: 'bg-solid',
  },
  {
    value: 'empty',
    label: 'Empty',
    description: 'Outside the surface (air)',
    color: 'bg-empty',
  },
  {
    value: 'surface',
    label: 'Surface',
    description: 'On the boundary (distance = 0)',
    color: 'bg-surface',
  },
]

// Wrapper for SliceMode with store integration
function SliceModePanel() {
  const tool = useSliceStore((s) => s.tool)
  const setTool = useSliceStore((s) => s.setTool)
  const brushSize = useSliceStore((s) => s.brushSize)
  const setBrushSize = useSliceStore((s) => s.setBrushSize)

  return (
    <div className="border-b border-gray-800">
      <SliceMode
        tool={tool}
        setTool={setTool}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
      />
    </div>
  )
}

// Wrapper for BrushMode with store integration
function BrushModePanel() {
  const depthAware = useBrushStore((s) => s.depthAware)
  const setDepthAware = useBrushStore((s) => s.setDepthAware)

  return (
    <div className="border-b border-gray-800">
      <BrushMode depthAware={depthAware} setDepthAware={setDepthAware} />
    </div>
  )
}

// Wrapper for SeedMode with store integration
function SeedModePanel({ projectId }: { projectId: string }) {
  const seeds = useSeedStore((s) => s.seeds)
  const addSeed = useSeedStore((s) => s.addSeed)
  const removeSeed = useSeedStore((s) => s.removeSeed)
  const clearSeeds = useSeedStore((s) => s.clearSeeds)

  return (
    <div className="border-b border-gray-800">
      <SeedMode
        projectId={projectId}
        seeds={seeds}
        onAddSeed={(pos) => addSeed(pos)}
        onRemoveSeed={removeSeed}
        onClearSeeds={clearSeeds}
      />
    </div>
  )
}

// Wrapper for MLImportMode
function MLImportModePanel({ projectId }: { projectId: string }) {
  return (
    <div className="border-b border-gray-800">
      <MLImportMode projectId={projectId} />
    </div>
  )
}

export function LabelPanel() {
  const activeLabel = useProjectStore((s) => s.activeLabel)
  const setActiveLabel = useProjectStore((s) => s.setActiveLabel)
  const mode = useProjectStore((s) => s.mode)
  const currentProjectId = useProjectStore((s) => s.currentProjectId)

  const constraints = useLabelStore((s) =>
    currentProjectId ? s.getConstraints(currentProjectId) : []
  )
  const removeConstraint = useLabelStore((s) => s.removeConstraint)

  // Backend sync for constraints
  const { deleteConstraint: syncDeleteConstraint } = useConstraintSync(currentProjectId)

  // Group constraints by type
  const groupedConstraints = useMemo(() => {
    const groups: Record<string, Constraint[]> = {}
    for (const c of constraints) {
      const type = c.type
      if (!groups[type]) groups[type] = []
      groups[type].push(c)
    }
    return groups
  }, [constraints])

  return (
    <div className="w-72 flex flex-col bg-gray-900 border-l border-gray-800">
      {/* Label selection */}
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-sm font-medium mb-3">Active Label</h3>
        <ToggleGroup.Root
          type="single"
          value={activeLabel}
          onValueChange={(value) => value && setActiveLabel(value as LabelType)}
          className="flex flex-col gap-2"
        >
          {labelOptions.map(({ value, label, description, color }) => (
            <ToggleGroup.Item
              key={value}
              value={value}
              aria-label={label}
              className={`
                flex items-center gap-3 p-3 rounded-lg border transition-colors text-left
                ${activeLabel === value
                  ? `border-${value} bg-${value}/10 ring-2 ring-${value}`
                  : 'border-gray-700 hover:border-gray-600'
                }
              `}
            >
              <div className={`w-4 h-4 rounded ${color}`} />
              <div>
                <div className="font-medium text-sm">{label}</div>
                <div className="text-xs text-gray-500">{description}</div>
              </div>
            </ToggleGroup.Item>
          ))}
        </ToggleGroup.Root>
      </div>

      {/* Mode-specific settings */}
      {mode === 'primitive' && (
        <div className="border-b border-gray-800">
          <PrimitiveMode />
        </div>
      )}

      {mode === 'slice' && (
        <SliceModePanel />
      )}

      {mode === 'brush' && (
        <BrushModePanel />
      )}

      {mode === 'seed' && currentProjectId && (
        <SeedModePanel projectId={currentProjectId} />
      )}

      {mode === 'import' && currentProjectId && (
        <MLImportModePanel projectId={currentProjectId} />
      )}

      {/* Constraints list */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-sm font-medium mb-3">
            Constraints ({constraints.length})
          </h3>

          {constraints.length === 0 ? (
            <p className="text-sm text-gray-500">
              No constraints yet. Use the tools to mark regions.
            </p>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedConstraints).map(([type, items]) => (
                <div key={type}>
                  <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
                    {formatConstraintType(type)}
                  </h4>
                  <ul className="space-y-1">
                    {items.map((constraint) => (
                      <ConstraintItem
                        key={constraint.id}
                        constraint={constraint}
                        onDelete={() => {
                          if (currentProjectId) {
                            removeConstraint(currentProjectId, constraint.id)
                            syncDeleteConstraint(constraint.id)
                          }
                        }}
                      />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Export section */}
      {currentProjectId && constraints.length > 0 && (
        <ExportSection projectId={currentProjectId} constraintCount={constraints.length} />
      )}
    </div>
  )
}

interface ConstraintItemProps {
  constraint: Constraint
  onDelete: () => void
}

function ConstraintItem({ constraint, onDelete }: ConstraintItemProps) {
  const labelColor =
    constraint.sign === 'solid'
      ? 'bg-solid'
      : constraint.sign === 'empty'
      ? 'bg-empty'
      : 'bg-surface'

  const name = constraint.name || `${constraint.type} ${constraint.id.slice(0, 4)}`

  return (
    <li className="flex items-center gap-2 p-2 rounded hover:bg-gray-800 group">
      <div className={`w-3 h-3 rounded ${labelColor}`} />
      <span className="flex-1 text-sm truncate">{name}</span>
      <button
        onClick={onDelete}
        className="p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <TrashIcon className="w-4 h-4" />
      </button>
    </li>
  )
}

function formatConstraintType(type: string): string {
  const labels: Record<string, string> = {
    box: 'Boxes',
    sphere: 'Spheres',
    halfspace: 'Half-spaces',
    cylinder: 'Cylinders',
    painted_region: 'Painted Regions',
    seed_propagation: 'Propagated Seeds',
    ml_import: 'ML Imports',
  }
  return labels[type] || type
}

interface ExportSectionProps {
  projectId: string
  constraintCount: number
}

function ExportSection({ projectId, constraintCount }: ExportSectionProps) {
  const [sampleCount, setSampleCount] = useState<number | null>(null)

  const generateMutation = useMutation({
    mutationFn: () =>
      generateSamples(projectId, {
        total_samples: 10000,
        include_surface: true,
        far_direction: 'bidirectional',
      }),
    onSuccess: (data) => {
      setSampleCount(data.sample_count)
      toast.success(
        'Samples generated',
        `${data.sample_count.toLocaleString()} training samples created`
      )
    },
    onError: (error: Error) => {
      toast.error('Generation failed', error.message)
    },
  })

  const exportMutation = useMutation({
    mutationFn: () => exportParquet(projectId),
    onSuccess: (blob) => {
      // Download the file
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${projectId}_samples.parquet`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Export complete', 'Parquet file downloaded')
    },
    onError: (error: Error) => {
      toast.error('Export failed', error.message)
    },
  })

  return (
    <div className="p-4 border-t border-gray-800 space-y-3">
      {/* Generate button */}
      <LoadingButton
        onClick={() => generateMutation.mutate()}
        loading={generateMutation.isPending}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Generate Samples
      </LoadingButton>

      {/* Status */}
      {sampleCount !== null && (
        <div className="text-center">
          <p className="text-sm text-green-400">
            {sampleCount.toLocaleString()} samples generated
          </p>
        </div>
      )}

      {generateMutation.isError && (
        <p className="text-sm text-red-400 text-center">
          {(generateMutation.error as Error).message}
        </p>
      )}

      {/* Export button (shown after generation) */}
      {sampleCount !== null && (
        <LoadingButton
          onClick={() => exportMutation.mutate()}
          loading={exportMutation.isPending}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <DownloadIcon className="w-4 h-4" />
          Export Parquet
        </LoadingButton>
      )}

      <p className="text-xs text-gray-500 text-center">
        {constraintCount} constraint{constraintCount !== 1 ? 's' : ''} defined
      </p>
    </div>
  )
}
