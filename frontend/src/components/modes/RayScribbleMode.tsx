// ABOUTME: Settings panel for ray-scribble annotation mode
// ABOUTME: Controls empty band width and displays scribbling instructions

import * as Slider from '@radix-ui/react-slider'
import { HelpTooltip } from '../ui/HelpTooltip'

export interface RayScribbleModeProps {
  emptyBandWidth: number
  setEmptyBandWidth: (width: number) => void
  surfaceBandWidth: number
  setSurfaceBandWidth: (width: number) => void
  backBufferWidth: number
  setBackBufferWidth: (width: number) => void
  isScribbling: boolean
  strokeCount: number
  onClearStrokes: () => void
}

export function RayScribbleMode({
  emptyBandWidth,
  setEmptyBandWidth,
  surfaceBandWidth,
  setSurfaceBandWidth,
  backBufferWidth,
  setBackBufferWidth,
  isScribbling,
  strokeCount,
  onClearStrokes,
}: RayScribbleModeProps) {
  return (
    <div className="p-4 space-y-3 border-b border-gray-800">
      <div className="flex items-center gap-2">
        <h4 className="text-sm font-medium">Ray Scribble</h4>
        <HelpTooltip content="Scribble to mark free space. Rays cast through stroke points find the surface, marking everything before the hit as empty." />
      </div>

      {/* Empty band width slider */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1">
            <label className="text-gray-400">Empty band</label>
            <HelpTooltip content="Distance before the hit point to mark as empty space" />
          </div>
          <span className="text-gray-300 tabular-nums">{emptyBandWidth.toFixed(2)}</span>
        </div>
        <Slider.Root
          className="relative flex items-center select-none touch-none w-full h-5"
          value={[emptyBandWidth]}
          onValueChange={([v]) => setEmptyBandWidth(v)}
          min={0.01}
          max={0.5}
          step={0.01}
        >
          <Slider.Track className="bg-gray-700 relative grow rounded-full h-[3px]">
            <Slider.Range className="absolute bg-orange-500 rounded-full h-full" />
          </Slider.Track>
          <Slider.Thumb
            className="block w-4 h-4 bg-white rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
            aria-label="Empty band width"
          />
        </Slider.Root>
      </div>

      {/* Surface band width slider */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1">
            <label className="text-gray-400">Surface band</label>
            <HelpTooltip content="Width of the surface region around the hit point" />
          </div>
          <span className="text-gray-300 tabular-nums">{surfaceBandWidth.toFixed(3)}</span>
        </div>
        <Slider.Root
          className="relative flex items-center select-none touch-none w-full h-5"
          value={[surfaceBandWidth]}
          onValueChange={([v]) => setSurfaceBandWidth(v)}
          min={0.001}
          max={0.1}
          step={0.001}
        >
          <Slider.Track className="bg-gray-700 relative grow rounded-full h-[3px]">
            <Slider.Range className="absolute bg-blue-500 rounded-full h-full" />
          </Slider.Track>
          <Slider.Thumb
            className="block w-4 h-4 bg-white rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Surface band width"
          />
        </Slider.Root>
      </div>

      {/* Back buffer width slider */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1">
            <label className="text-gray-400">Back buffer</label>
            <HelpTooltip content="How far past the surface to sample. 0 = no bleed-through (recommended for thin surfaces)" />
          </div>
          <span className="text-gray-300 tabular-nums">{backBufferWidth.toFixed(3)}</span>
        </div>
        <Slider.Root
          className="relative flex items-center select-none touch-none w-full h-5"
          value={[backBufferWidth]}
          onValueChange={([v]) => setBackBufferWidth(v)}
          min={0}
          max={0.05}
          step={0.001}
        >
          <Slider.Track className="bg-gray-700 relative grow rounded-full h-[3px]">
            <Slider.Range className="absolute bg-purple-500 rounded-full h-full" />
          </Slider.Track>
          <Slider.Thumb
            className="block w-4 h-4 bg-white rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label="Back buffer width"
          />
        </Slider.Root>
      </div>

      {/* Status + Clear */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">Strokes:</span>
          <span className="text-gray-300">{strokeCount}</span>
          {isScribbling && (
            <span className="text-orange-400 text-xs">Drawing...</span>
          )}
        </div>
        {strokeCount > 0 && (
          <button
            onClick={onClearStrokes}
            className="px-2 py-1 text-xs bg-gray-800 text-gray-400 rounded hover:bg-gray-700 hover:text-gray-300 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}
