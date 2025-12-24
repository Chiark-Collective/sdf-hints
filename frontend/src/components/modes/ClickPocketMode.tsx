// ABOUTME: Settings panel for click-pocket annotation mode
// ABOUTME: Shows detected pockets and allows toggling solid/empty state

import { LoadingButton } from '../ui/Spinner'

export interface PocketInfo {
  pocketId: number
  voxelCount: number
  centroid: [number, number, number]
  boundsLow: [number, number, number]
  boundsHigh: [number, number, number]
  volumeEstimate: number
  isToggledSolid: boolean
}

export interface ClickPocketModeProps {
  pockets: PocketInfo[]
  selectedPocketId: number | null
  isAnalyzing: boolean
  onAnalyze: () => void
  onTogglePocket: (pocketId: number) => void
  onSelectPocket: (pocketId: number | null) => void
}

export function ClickPocketMode({
  pockets,
  selectedPocketId,
  isAnalyzing,
  onAnalyze,
  onTogglePocket,
  onSelectPocket,
}: ClickPocketModeProps) {
  return (
    <div className="p-4 space-y-4">
      <div>
        <h4 className="text-sm font-medium mb-2">Click Pocket</h4>
        <p className="text-xs text-gray-400 mb-4">
          Auto-detect enclosed cavities in the point cloud. Click pockets to toggle
          between solid (filled) and empty (cavity).
        </p>
      </div>

      {/* Analyze button */}
      <LoadingButton
        onClick={onAnalyze}
        loading={isAnalyzing}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {pockets.length > 0 ? 'Re-analyze Pockets' : 'Detect Pockets'}
      </LoadingButton>

      {/* Pocket list */}
      {pockets.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-medium text-gray-500">
            Detected Pockets ({pockets.length})
          </h5>
          <ul className="space-y-1 max-h-48 overflow-y-auto">
            {pockets.map((pocket) => (
              <PocketItem
                key={pocket.pocketId}
                pocket={pocket}
                isSelected={selectedPocketId === pocket.pocketId}
                onSelect={() => onSelectPocket(
                  selectedPocketId === pocket.pocketId ? null : pocket.pocketId
                )}
                onToggle={() => onTogglePocket(pocket.pocketId)}
              />
            ))}
          </ul>
        </div>
      )}

      {pockets.length === 0 && !isAnalyzing && (
        <p className="text-sm text-gray-500 text-center py-4">
          Click "Detect Pockets" to find cavities
        </p>
      )}

      {/* Instructions */}
      <div className="pt-2 border-t border-gray-800">
        <h5 className="text-xs font-medium text-gray-500 mb-1">Instructions</h5>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>Click a pocket in the 3D view to select</li>
          <li>Selected pockets can be toggled solid/empty</li>
          <li>Orange = empty (cavity), Blue = solid (filled)</li>
        </ul>
      </div>
    </div>
  )
}

interface PocketItemProps {
  pocket: PocketInfo
  isSelected: boolean
  onSelect: () => void
  onToggle: () => void
}

function PocketItem({ pocket, isSelected, onSelect, onToggle }: PocketItemProps) {
  const formatVolume = (v: number) => {
    if (v < 0.001) return `${(v * 1e6).toFixed(1)} mm³`
    if (v < 1) return `${(v * 1000).toFixed(1)} cm³`
    return `${v.toFixed(2)} m³`
  }

  return (
    <li
      className={`
        flex items-center gap-2 p-2 rounded cursor-pointer transition-colors
        ${isSelected ? 'bg-gray-700 ring-1 ring-blue-500' : 'hover:bg-gray-800'}
      `}
      onClick={onSelect}
    >
      {/* State indicator */}
      <div
        className={`w-3 h-3 rounded ${
          pocket.isToggledSolid ? 'bg-solid' : 'bg-empty'
        }`}
        title={pocket.isToggledSolid ? 'Solid' : 'Empty'}
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm truncate">Pocket #{pocket.pocketId}</div>
        <div className="text-xs text-gray-500">
          {pocket.voxelCount} voxels · {formatVolume(pocket.volumeEstimate)}
        </div>
      </div>

      {/* Toggle button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        className={`
          px-2 py-1 text-xs rounded transition-colors
          ${pocket.isToggledSolid
            ? 'bg-solid/20 text-blue-400 hover:bg-solid/30'
            : 'bg-empty/20 text-orange-400 hover:bg-empty/30'
          }
        `}
      >
        {pocket.isToggledSolid ? 'Solid' : 'Empty'}
      </button>
    </li>
  )
}
