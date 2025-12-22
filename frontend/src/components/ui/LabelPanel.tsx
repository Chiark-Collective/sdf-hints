// ABOUTME: Right sidebar panel for label selection and constraint list
// ABOUTME: Shows active label type and list of created constraints

import { useMemo } from 'react'
import * as ToggleGroup from '@radix-ui/react-toggle-group'
import * as Slider from '@radix-ui/react-slider'
import { TrashIcon, EyeOpenIcon, EyeClosedIcon } from '@radix-ui/react-icons'

import { useProjectStore, type LabelType } from '../../stores/projectStore'
import { useLabelStore, type Constraint } from '../../stores/labelStore'

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

export function LabelPanel() {
  const activeLabel = useProjectStore((s) => s.activeLabel)
  const setActiveLabel = useProjectStore((s) => s.setActiveLabel)
  const brushRadius = useProjectStore((s) => s.brushRadius)
  const setBrushRadius = useProjectStore((s) => s.setBrushRadius)
  const mode = useProjectStore((s) => s.mode)
  const currentProjectId = useProjectStore((s) => s.currentProjectId)

  const constraints = useLabelStore((s) =>
    currentProjectId ? s.getConstraints(currentProjectId) : []
  )
  const removeConstraint = useLabelStore((s) => s.removeConstraint)

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
              className={`
                flex items-center gap-3 p-3 rounded-lg border transition-colors text-left
                ${activeLabel === value
                  ? `border-${value} bg-${value}/10`
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

      {/* Brush settings (shown in brush mode) */}
      {mode === 'brush' && (
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-sm font-medium mb-3">Brush Size</h3>
          <div className="flex items-center gap-4">
            <Slider.Root
              value={[brushRadius]}
              onValueChange={([value]) => setBrushRadius(value)}
              min={0.01}
              max={1}
              step={0.01}
              className="relative flex items-center flex-1 h-5"
            >
              <Slider.Track className="relative h-1 flex-1 bg-gray-700 rounded">
                <Slider.Range className="absolute h-full bg-blue-500 rounded" />
              </Slider.Track>
              <Slider.Thumb className="block w-4 h-4 bg-white rounded-full shadow focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </Slider.Root>
            <span className="text-sm text-gray-400 w-12 text-right">
              {brushRadius.toFixed(2)}
            </span>
          </div>
        </div>
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
                        onDelete={() =>
                          currentProjectId &&
                          removeConstraint(currentProjectId, constraint.id)
                        }
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
        <div className="p-4 border-t border-gray-800">
          <button className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
            Generate Samples
          </button>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Export training data for survi
          </p>
        </div>
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
