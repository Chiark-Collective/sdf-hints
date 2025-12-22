// ABOUTME: Zustand store for slice painting mode state
// ABOUTME: Tracks slice tool, brush size, and 2D painting settings

import { create } from 'zustand'

export type SliceTool = 'brush' | 'lasso' | 'eraser'

interface SliceState {
  // Current tool
  tool: SliceTool

  // Brush settings
  brushSize: number

  // Actions
  setTool: (tool: SliceTool) => void
  setBrushSize: (size: number) => void
}

export const useSliceStore = create<SliceState>((set) => ({
  tool: 'brush',
  brushSize: 20,

  setTool: (tool) => set({ tool }),
  setBrushSize: (size) => set({ brushSize: size }),
}))
