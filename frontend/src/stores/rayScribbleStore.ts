// ABOUTME: Zustand store for ray-scribble mode state
// ABOUTME: Manages stroke data, band widths, and scribbling state

import { create } from 'zustand'

export interface RayInfo {
  origin: [number, number, number]
  direction: [number, number, number]
  hitDistance: number
  surfaceNormal?: [number, number, number]
}

export interface RayStroke {
  id: string
  rays: RayInfo[]
  createdAt: number
}

interface RayScribbleState {
  // Settings
  emptyBandWidth: number
  surfaceBandWidth: number

  // Stroke state
  strokes: RayStroke[]
  isScribbling: boolean
  currentStrokeRays: RayInfo[]

  // Actions
  setEmptyBandWidth: (width: number) => void
  setSurfaceBandWidth: (width: number) => void

  startStroke: () => void
  addRayToStroke: (ray: RayInfo) => void
  endStroke: () => RayStroke | null
  cancelStroke: () => void

  addStroke: (stroke: RayStroke) => void
  removeStroke: (strokeId: string) => void
  clearStrokes: () => void
}

export const useRayScribbleStore = create<RayScribbleState>((set, get) => ({
  // Default settings
  emptyBandWidth: 0.1,
  surfaceBandWidth: 0.02,

  // Initial state
  strokes: [],
  isScribbling: false,
  currentStrokeRays: [],

  // Setting actions
  setEmptyBandWidth: (width) => set({ emptyBandWidth: width }),
  setSurfaceBandWidth: (width) => set({ surfaceBandWidth: width }),

  // Stroke actions
  startStroke: () => set({ isScribbling: true, currentStrokeRays: [] }),

  addRayToStroke: (ray) => {
    const state = get()
    if (!state.isScribbling) return
    set({ currentStrokeRays: [...state.currentStrokeRays, ray] })
  },

  endStroke: () => {
    const state = get()
    if (!state.isScribbling || state.currentStrokeRays.length === 0) {
      set({ isScribbling: false, currentStrokeRays: [] })
      return null
    }

    const stroke: RayStroke = {
      id: crypto.randomUUID(),
      rays: state.currentStrokeRays,
      createdAt: Date.now(),
    }

    set({
      isScribbling: false,
      currentStrokeRays: [],
      strokes: [...state.strokes, stroke],
    })

    return stroke
  },

  cancelStroke: () => set({ isScribbling: false, currentStrokeRays: [] }),

  addStroke: (stroke) => set((s) => ({ strokes: [...s.strokes, stroke] })),

  removeStroke: (strokeId) =>
    set((s) => ({ strokes: s.strokes.filter((st) => st.id !== strokeId) })),

  clearStrokes: () => set({ strokes: [] }),
}))
