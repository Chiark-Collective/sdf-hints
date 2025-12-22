// ABOUTME: Top toolbar with mode selection and global actions
// ABOUTME: Provides interaction mode toggle and undo/redo buttons

import { useCallback } from 'react'
import {
  CursorArrowIcon,
  BoxIcon,
  ShadowIcon,
  CircleIcon,
  MixIcon,
  UploadIcon,
  ResetIcon,
  CounterClockwiseClockIcon,
} from '@radix-ui/react-icons'
import * as ToggleGroup from '@radix-ui/react-toggle-group'
import * as Tooltip from '@radix-ui/react-tooltip'

import { useProjectStore, type InteractionMode } from '../../stores/projectStore'
import { useLabelStore } from '../../stores/labelStore'

const modes: { value: InteractionMode; icon: typeof CursorArrowIcon; label: string; shortcut: string }[] = [
  { value: 'orbit', icon: CursorArrowIcon, label: 'Navigate', shortcut: 'Esc' },
  { value: 'primitive', icon: BoxIcon, label: 'Place Primitives', shortcut: 'P' },
  { value: 'slice', icon: ShadowIcon, label: 'Slice Paint', shortcut: 'S' },
  { value: 'brush', icon: CircleIcon, label: '3D Brush', shortcut: 'B' },
  { value: 'seed', icon: MixIcon, label: 'Seed & Propagate', shortcut: 'G' },
  { value: 'import', icon: UploadIcon, label: 'Import ML', shortcut: 'I' },
]

export function Toolbar() {
  const mode = useProjectStore((s) => s.mode)
  const setMode = useProjectStore((s) => s.setMode)
  const currentProjectId = useProjectStore((s) => s.currentProjectId)

  const canUndo = useLabelStore((s) => s.canUndo())
  const canRedo = useLabelStore((s) => s.canRedo())
  const undo = useLabelStore((s) => s.undo)
  const redo = useLabelStore((s) => s.redo)

  const handleUndo = useCallback(() => {
    if (currentProjectId) {
      undo(currentProjectId)
    }
  }, [currentProjectId, undo])

  const handleRedo = useCallback(() => {
    if (currentProjectId) {
      redo(currentProjectId)
    }
  }, [currentProjectId, redo])

  return (
    <Tooltip.Provider delayDuration={300}>
      <div className="flex items-center gap-4 px-4 py-2 bg-gray-900 border-b border-gray-800">
        {/* Logo/Title */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-orange-500" />
          <span className="font-semibold text-white">SDF Labeler</span>
        </div>

        <div className="w-px h-6 bg-gray-700" />

        {/* Mode selection */}
        <ToggleGroup.Root
          type="single"
          value={mode}
          onValueChange={(value) => value && setMode(value as InteractionMode)}
          className="flex gap-1"
        >
          {modes.map(({ value, icon: Icon, label, shortcut }) => (
            <Tooltip.Root key={value}>
              <Tooltip.Trigger asChild>
                <ToggleGroup.Item
                  value={value}
                  className={`
                    p-2 rounded transition-colors
                    ${mode === value
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                </ToggleGroup.Item>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  className="px-3 py-2 text-sm bg-gray-800 rounded shadow-lg border border-gray-700"
                  sideOffset={5}
                >
                  <div className="flex items-center gap-2">
                    <span>{label}</span>
                    <kbd className="px-1.5 py-0.5 text-xs bg-gray-700 rounded">{shortcut}</kbd>
                  </div>
                  <Tooltip.Arrow className="fill-gray-800" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          ))}
        </ToggleGroup.Root>

        <div className="w-px h-6 bg-gray-700" />

        {/* Undo/Redo */}
        <div className="flex gap-1">
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                onClick={handleUndo}
                disabled={!canUndo}
                className={`
                  p-2 rounded transition-colors
                  ${canUndo
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                    : 'text-gray-600 cursor-not-allowed'
                  }
                `}
              >
                <CounterClockwiseClockIcon className="w-5 h-5" />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="px-3 py-2 text-sm bg-gray-800 rounded shadow-lg border border-gray-700"
                sideOffset={5}
              >
                <div className="flex items-center gap-2">
                  <span>Undo</span>
                  <kbd className="px-1.5 py-0.5 text-xs bg-gray-700 rounded">⌘Z</kbd>
                </div>
                <Tooltip.Arrow className="fill-gray-800" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>

          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                onClick={handleRedo}
                disabled={!canRedo}
                className={`
                  p-2 rounded transition-colors
                  ${canRedo
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                    : 'text-gray-600 cursor-not-allowed'
                  }
                `}
              >
                <ResetIcon className="w-5 h-5" />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="px-3 py-2 text-sm bg-gray-800 rounded shadow-lg border border-gray-700"
                sideOffset={5}
              >
                <div className="flex items-center gap-2">
                  <span>Redo</span>
                  <kbd className="px-1.5 py-0.5 text-xs bg-gray-700 rounded">⌘⇧Z</kbd>
                </div>
                <Tooltip.Arrow className="fill-gray-800" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Help */}
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded">
              <span className="text-sm">?</span>
            </button>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content
              className="px-3 py-2 text-sm bg-gray-800 rounded shadow-lg border border-gray-700"
              sideOffset={5}
            >
              Keyboard Shortcuts
              <Tooltip.Arrow className="fill-gray-800" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </div>
    </Tooltip.Provider>
  )
}
