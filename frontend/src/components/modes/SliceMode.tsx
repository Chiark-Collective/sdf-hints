// ABOUTME: Slice painting mode panel for 2D cross-section labeling
// ABOUTME: Controls for plane selection, slice position, and painting tools

import * as ToggleGroup from '@radix-ui/react-toggle-group'
import * as Slider from '@radix-ui/react-slider'
import { EraserIcon, Pencil1Icon, SquareIcon } from '@radix-ui/react-icons'

import { useProjectStore } from '../../stores/projectStore'

type SlicePlane = 'xy' | 'xz' | 'yz'

const planeOptions: { value: SlicePlane; label: string; shortcut: string }[] = [
  { value: 'xy', label: 'XY (Top)', shortcut: '1' },
  { value: 'xz', label: 'XZ (Front)', shortcut: '2' },
  { value: 'yz', label: 'YZ (Side)', shortcut: '3' },
]

export type SliceTool = 'brush' | 'lasso' | 'eraser'

interface SliceModeProps {
  tool: SliceTool
  setTool: (tool: SliceTool) => void
  brushSize: number
  setBrushSize: (size: number) => void
  selectedPointCount?: number
  onCreateConstraint?: () => void
}

export function SliceMode({
  tool,
  setTool,
  brushSize,
  setBrushSize,
  selectedPointCount = 0,
  onCreateConstraint,
}: SliceModeProps) {
  const activeLabel = useProjectStore((s) => s.activeLabel)
  const slicePlane = useProjectStore((s) => s.slicePlane)
  const setSlicePlane = useProjectStore((s) => s.setSlicePlane)
  const slicePosition = useProjectStore((s) => s.slicePosition)
  const setSlicePosition = useProjectStore((s) => s.setSlicePosition)
  const sliceThickness = useProjectStore((s) => s.sliceThickness)
  const setSliceThickness = useProjectStore((s) => s.setSliceThickness)

  const labelColor = activeLabel === 'solid' ? 'text-solid' : activeLabel === 'empty' ? 'text-empty' : 'text-surface'

  return (
    <div className="p-4 space-y-4">
      {/* Instructions */}
      <div className="p-3 bg-gray-800/50 rounded-lg text-sm text-gray-400">
        <p className="mb-2">
          <strong className="text-white">Paint</strong> on the 2D slice to mark regions
        </p>
        <p className="mb-2">
          <strong className="text-white">Scroll</strong> to move through slices
        </p>
        <p>
          Label: <span className={`font-medium ${labelColor}`}>
            {activeLabel === 'solid' ? 'Solid (inside)' : activeLabel === 'empty' ? 'Empty (outside)' : 'Surface'}
          </span>
        </p>
      </div>

      {/* Slice plane selection */}
      <div>
        <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
          Slice Plane
        </h4>
        <ToggleGroup.Root
          type="single"
          value={slicePlane}
          onValueChange={(value) => value && setSlicePlane(value as SlicePlane)}
          className="flex gap-2"
        >
          {planeOptions.map(({ value, label, shortcut }) => (
            <ToggleGroup.Item
              key={value}
              value={value}
              className={`
                flex-1 px-3 py-2 rounded-lg border transition-colors text-sm
                ${slicePlane === value
                  ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                  : 'border-gray-700 hover:border-gray-600 text-gray-400'
                }
              `}
            >
              <div className="font-medium">{label}</div>
              <kbd className="text-xs text-gray-500">{shortcut}</kbd>
            </ToggleGroup.Item>
          ))}
        </ToggleGroup.Root>
      </div>

      {/* Slice position slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-medium text-gray-500 uppercase">
            Slice Position
          </h4>
          <span className="text-sm text-gray-400">{slicePosition.toFixed(2)}</span>
        </div>
        <Slider.Root
          value={[slicePosition]}
          onValueChange={([value]) => setSlicePosition(value)}
          min={-10}
          max={10}
          step={0.01}
          className="relative flex items-center h-5"
        >
          <Slider.Track className="relative h-1 flex-1 bg-gray-700 rounded">
            <Slider.Range className="absolute h-full bg-blue-500 rounded" />
          </Slider.Track>
          <Slider.Thumb className="block w-4 h-4 bg-white rounded-full shadow focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </Slider.Root>
      </div>

      {/* Slice thickness slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-medium text-gray-500 uppercase">
            Slice Thickness
          </h4>
          <span className="text-sm text-gray-400">{sliceThickness.toFixed(2)}</span>
        </div>
        <Slider.Root
          value={[sliceThickness]}
          onValueChange={([value]) => setSliceThickness(value)}
          min={0.01}
          max={1}
          step={0.01}
          className="relative flex items-center h-5"
        >
          <Slider.Track className="relative h-1 flex-1 bg-gray-700 rounded">
            <Slider.Range className="absolute h-full bg-blue-500 rounded" />
          </Slider.Track>
          <Slider.Thumb className="block w-4 h-4 bg-white rounded-full shadow focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </Slider.Root>
      </div>

      {/* Paint tools */}
      <div>
        <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
          Paint Tool
        </h4>
        <ToggleGroup.Root
          type="single"
          value={tool}
          onValueChange={(value) => value && setTool(value as SliceTool)}
          className="flex gap-2"
        >
          <ToggleGroup.Item
            value="brush"
            className={`
              flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors
              ${tool === 'brush'
                ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                : 'border-gray-700 hover:border-gray-600 text-gray-400'
              }
            `}
          >
            <Pencil1Icon className="w-4 h-4" />
            <span className="text-sm">Brush</span>
          </ToggleGroup.Item>
          <ToggleGroup.Item
            value="lasso"
            className={`
              flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors
              ${tool === 'lasso'
                ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                : 'border-gray-700 hover:border-gray-600 text-gray-400'
              }
            `}
          >
            <SquareIcon className="w-4 h-4" />
            <span className="text-sm">Lasso</span>
          </ToggleGroup.Item>
          <ToggleGroup.Item
            value="eraser"
            className={`
              flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors
              ${tool === 'eraser'
                ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                : 'border-gray-700 hover:border-gray-600 text-gray-400'
              }
            `}
          >
            <EraserIcon className="w-4 h-4" />
            <span className="text-sm">Eraser</span>
          </ToggleGroup.Item>
        </ToggleGroup.Root>
      </div>

      {/* Brush size (when brush tool selected) */}
      {tool === 'brush' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-medium text-gray-500 uppercase">
              Brush Size
            </h4>
            <span className="text-sm text-gray-400">{brushSize.toFixed(0)}px</span>
          </div>
          <Slider.Root
            value={[brushSize]}
            onValueChange={([value]) => setBrushSize(value)}
            min={5}
            max={100}
            step={1}
            className="relative flex items-center h-5"
          >
            <Slider.Track className="relative h-1 flex-1 bg-gray-700 rounded">
              <Slider.Range className="absolute h-full bg-blue-500 rounded" />
            </Slider.Track>
            <Slider.Thumb className="block w-4 h-4 bg-white rounded-full shadow focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </Slider.Root>
        </div>
      )}

      {/* Selection info and Create Constraint button */}
      {selectedPointCount > 0 && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-blue-400">
              {selectedPointCount.toLocaleString()} points selected
            </span>
          </div>
          {onCreateConstraint && (
            <button
              onClick={onCreateConstraint}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
            >
              Create Constraint
            </button>
          )}
        </div>
      )}

      {/* Keyboard shortcuts reference */}
      <div className="pt-4 border-t border-gray-800">
        <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
          Shortcuts
        </h4>
        <div className="space-y-1 text-xs text-gray-400">
          <div className="flex justify-between">
            <span>Toggle label</span>
            <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">Tab</kbd>
          </div>
          <div className="flex justify-between">
            <span>Brush size</span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">[</kbd>
              <kbd className="px-1.5 py-0.5 bg-gray-700 rounded ml-1">]</kbd>
            </span>
          </div>
          <div className="flex justify-between">
            <span>Switch planes</span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">1</kbd>
              <kbd className="px-1.5 py-0.5 bg-gray-700 rounded ml-1">2</kbd>
              <kbd className="px-1.5 py-0.5 bg-gray-700 rounded ml-1">3</kbd>
            </span>
          </div>
          <div className="flex justify-between">
            <span>Confirm selection</span>
            <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">Enter</kbd>
          </div>
        </div>
      </div>
    </div>
  )
}
