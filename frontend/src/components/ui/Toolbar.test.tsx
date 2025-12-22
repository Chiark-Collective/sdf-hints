// ABOUTME: Unit tests for Toolbar component
// ABOUTME: Tests mode switching buttons and undo/redo functionality

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Toolbar } from './Toolbar'
import { useProjectStore } from '../../stores/projectStore'
import { useLabelStore } from '../../stores/labelStore'

describe('Toolbar', () => {
  beforeEach(() => {
    // Reset stores
    useProjectStore.setState({
      currentProjectId: 'test-project',
      activeLabel: 'solid',
      mode: 'orbit',
      brushRadius: 0.1,
      slicePlane: 'xy',
      slicePosition: 0,
    })

    useLabelStore.setState({
      constraintsByProject: {},
      undoStack: [],
      redoStack: [],
      maxHistory: 50,
    })
  })

  describe('branding', () => {
    it('should display app name', () => {
      render(<Toolbar />)

      expect(screen.getByText('SDF Labeler')).toBeInTheDocument()
    })
  })

  describe('mode buttons', () => {
    it('should render all mode buttons', () => {
      render(<Toolbar />)

      // Mode buttons are toggle items, we check they're rendered
      const toggleGroup = screen.getByRole('group')
      expect(toggleGroup).toBeInTheDocument()

      // Should have 6 mode buttons
      const buttons = toggleGroup.querySelectorAll('[role="radio"]')
      expect(buttons).toHaveLength(6)
    })

    it('should have orbit as initial mode', () => {
      render(<Toolbar />)

      // The mode in the store should be 'orbit' by default
      expect(useProjectStore.getState().mode).toBe('orbit')
    })

    it('should switch to primitive mode when clicked', () => {
      render(<Toolbar />)

      const toggleGroup = screen.getByRole('group')
      const buttons = toggleGroup.querySelectorAll('[role="radio"]')

      // Click primitive mode button (second)
      fireEvent.click(buttons[1])

      expect(useProjectStore.getState().mode).toBe('primitive')
    })

    it('should switch to slice mode when clicked', () => {
      render(<Toolbar />)

      const toggleGroup = screen.getByRole('group')
      const buttons = toggleGroup.querySelectorAll('[role="radio"]')

      // Click slice mode button (third)
      fireEvent.click(buttons[2])

      expect(useProjectStore.getState().mode).toBe('slice')
    })

    it('should switch to brush mode when clicked', () => {
      render(<Toolbar />)

      const toggleGroup = screen.getByRole('group')
      const buttons = toggleGroup.querySelectorAll('[role="radio"]')

      // Click brush mode button (fourth)
      fireEvent.click(buttons[3])

      expect(useProjectStore.getState().mode).toBe('brush')
    })

    it('should switch to seed mode when clicked', () => {
      render(<Toolbar />)

      const toggleGroup = screen.getByRole('group')
      const buttons = toggleGroup.querySelectorAll('[role="radio"]')

      // Click seed mode button (fifth)
      fireEvent.click(buttons[4])

      expect(useProjectStore.getState().mode).toBe('seed')
    })

    it('should switch to import mode when clicked', () => {
      render(<Toolbar />)

      const toggleGroup = screen.getByRole('group')
      const buttons = toggleGroup.querySelectorAll('[role="radio"]')

      // Click import mode button (sixth)
      fireEvent.click(buttons[5])

      expect(useProjectStore.getState().mode).toBe('import')
    })
  })

  describe('undo/redo buttons', () => {
    it('should disable undo when stack is empty', () => {
      render(<Toolbar />)

      const undoButton = screen.getAllByRole('button')[0] // First button after toggle group
      expect(undoButton).toBeDisabled()
    })

    it('should disable redo when stack is empty', () => {
      render(<Toolbar />)

      const redoButton = screen.getAllByRole('button')[1] // Second button after toggle group
      expect(redoButton).toBeDisabled()
    })

    it('should enable undo when stack has items', () => {
      // Add constraint then we'll have undo stack
      useLabelStore.getState().addConstraint('test-project', {
        id: 'box-1',
        type: 'box',
        sign: 'solid',
        weight: 1.0,
        createdAt: Date.now(),
        center: [0, 0, 0],
        halfExtents: [1, 1, 1],
      })

      render(<Toolbar />)

      const undoButton = screen.getAllByRole('button')[0]
      expect(undoButton).not.toBeDisabled()
    })

    it('should perform undo when clicked', () => {
      // Add constraint
      useLabelStore.getState().addConstraint('test-project', {
        id: 'box-1',
        type: 'box',
        sign: 'solid',
        weight: 1.0,
        createdAt: Date.now(),
        center: [0, 0, 0],
        halfExtents: [1, 1, 1],
      })

      expect(useLabelStore.getState().getConstraints('test-project')).toHaveLength(1)

      render(<Toolbar />)

      const undoButton = screen.getAllByRole('button')[0]
      fireEvent.click(undoButton)

      expect(useLabelStore.getState().getConstraints('test-project')).toHaveLength(0)
    })

    it('should enable redo after undo', () => {
      // Add constraint and undo
      useLabelStore.getState().addConstraint('test-project', {
        id: 'box-1',
        type: 'box',
        sign: 'solid',
        weight: 1.0,
        createdAt: Date.now(),
        center: [0, 0, 0],
        halfExtents: [1, 1, 1],
      })
      useLabelStore.getState().undo('test-project')

      render(<Toolbar />)

      const redoButton = screen.getAllByRole('button')[1]
      expect(redoButton).not.toBeDisabled()
    })

    it('should perform redo when clicked', () => {
      // Add constraint and undo
      useLabelStore.getState().addConstraint('test-project', {
        id: 'box-1',
        type: 'box',
        sign: 'solid',
        weight: 1.0,
        createdAt: Date.now(),
        center: [0, 0, 0],
        halfExtents: [1, 1, 1],
      })
      useLabelStore.getState().undo('test-project')

      expect(useLabelStore.getState().getConstraints('test-project')).toHaveLength(0)

      render(<Toolbar />)

      const redoButton = screen.getAllByRole('button')[1]
      fireEvent.click(redoButton)

      expect(useLabelStore.getState().getConstraints('test-project')).toHaveLength(1)
    })
  })

  describe('help button', () => {
    it('should render help button', () => {
      render(<Toolbar />)

      // Help button has "?" text
      expect(screen.getByText('?')).toBeInTheDocument()
    })
  })
})
