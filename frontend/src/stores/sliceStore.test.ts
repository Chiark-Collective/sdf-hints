// ABOUTME: Unit tests for sliceStore
// ABOUTME: Tests slice painting mode tool and brush settings

import { describe, it, expect, beforeEach } from 'vitest'
import { useSliceStore } from './sliceStore'

describe('sliceStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useSliceStore.setState({
      tool: 'brush',
      brushSize: 20,
    })
  })

  describe('tool', () => {
    it('should initialize with brush tool', () => {
      expect(useSliceStore.getState().tool).toBe('brush')
    })

    it('should switch to lasso tool', () => {
      useSliceStore.getState().setTool('lasso')
      expect(useSliceStore.getState().tool).toBe('lasso')
    })

    it('should switch to eraser tool', () => {
      useSliceStore.getState().setTool('eraser')
      expect(useSliceStore.getState().tool).toBe('eraser')
    })

    it('should switch back to brush tool', () => {
      useSliceStore.getState().setTool('lasso')
      useSliceStore.getState().setTool('brush')
      expect(useSliceStore.getState().tool).toBe('brush')
    })
  })

  describe('brushSize', () => {
    it('should initialize with default brush size', () => {
      expect(useSliceStore.getState().brushSize).toBe(20)
    })

    it('should update brush size', () => {
      useSliceStore.getState().setBrushSize(50)
      expect(useSliceStore.getState().brushSize).toBe(50)
    })

    it('should accept small brush size', () => {
      useSliceStore.getState().setBrushSize(5)
      expect(useSliceStore.getState().brushSize).toBe(5)
    })

    it('should accept large brush size', () => {
      useSliceStore.getState().setBrushSize(100)
      expect(useSliceStore.getState().brushSize).toBe(100)
    })
  })
})
