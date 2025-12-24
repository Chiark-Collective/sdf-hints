// ABOUTME: Settings panel for ray-scribble annotation mode
// ABOUTME: Controls empty band width and displays scribbling instructions

import * as Slider from '@radix-ui/react-slider'

export interface RayScribbleModeProps {
  emptyBandWidth: number
  setEmptyBandWidth: (width: number) => void
  surfaceBandWidth: number
  setSurfaceBandWidth: (width: number) => void
  isScribbling: boolean
  strokeCount: number
  onClearStrokes: () => void
}

export function RayScribbleMode({
  emptyBandWidth,
  setEmptyBandWidth,
  surfaceBandWidth,
  setSurfaceBandWidth,
  isScribbling,
  strokeCount,
  onClearStrokes,
}: RayScribbleModeProps) {
  return (
    <div className="p-4 space-y-4">
      <div>
        <h4 className="text-sm font-medium mb-2">Ray Scribble</h4>
        <p className="text-xs text-gray-400 mb-4">
          Scribble in screen space to mark free space. Rays are cast through each stroke point
          to find the surface, marking everything before the hit as empty.
        </p>
      </div>

      {/* Empty band width slider */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <label className="text-gray-400">Empty band width</label>
          <span className="text-gray-300">{emptyBandWidth.toFixed(2)}</span>
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
        <p className="text-xs text-gray-500">
          How far before the hit point to mark as empty
        </p>
      </div>

      {/* Surface band width slider */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <label className="text-gray-400">Surface band width</label>
          <span className="text-gray-300">{surfaceBandWidth.toFixed(3)}</span>
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
        <p className="text-xs text-gray-500">
          Width of surface region around hit point
        </p>
      </div>

      {/* Status */}
      <div className="pt-2 border-t border-gray-800">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Strokes</span>
          <span className="text-gray-300">{strokeCount}</span>
        </div>
        {isScribbling && (
          <p className="text-xs text-orange-400 mt-1">Drawing...</p>
        )}
      </div>

      {/* Clear button */}
      {strokeCount > 0 && (
        <button
          onClick={onClearStrokes}
          className="w-full px-3 py-2 text-sm bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors"
        >
          Clear Strokes
        </button>
      )}

      {/* Instructions */}
      <div className="pt-2 border-t border-gray-800">
        <h5 className="text-xs font-medium text-gray-500 mb-1">Instructions</h5>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>Click and drag to scribble</li>
          <li>Rays cast through stroke mark empty space</li>
          <li>Use Tab to switch between solid/empty labels</li>
        </ul>
      </div>
    </div>
  )
}
