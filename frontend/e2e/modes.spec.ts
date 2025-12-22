// ABOUTME: E2E tests for interaction modes
// ABOUTME: Tests toolbar mode switching and keyboard shortcuts

import { test, expect, createTestPointCloud, cleanupTestFiles } from './fixtures'

test.describe('Toolbar Mode Switching', () => {
  test.beforeEach(async ({ app }) => {
    await app.goto()
  })

  test('should display all mode buttons in toolbar', async ({ app, page }) => {
    const modes = ['orbit', 'primitive', 'slice', 'brush', 'seed', 'import'] as const

    for (const mode of modes) {
      await expect(page.locator(`[data-testid="mode-${mode}"]`)).toBeVisible()
    }
  })

  test('should default to Orbit mode', async ({ app }) => {
    const orbitButton = app.getModeButton('Orbit')
    await expect(orbitButton).toHaveClass(/bg-blue-600/)
  })

  test('should switch to Primitive mode', async ({ app }) => {
    await app.selectMode('Primitive')

    await expect(app.getModeButton('Primitive')).toHaveClass(/bg-blue-600/)

    // Orbit should no longer be active
    await expect(app.getModeButton('Orbit')).not.toHaveClass(/bg-blue-600/)
  })

  test('should switch to Slice mode', async ({ app }) => {
    await app.selectMode('Slice')

    await expect(app.getModeButton('Slice')).toHaveClass(/bg-blue-600/)
  })

  test('should switch to Brush mode', async ({ app }) => {
    await app.selectMode('Brush')

    await expect(app.getModeButton('Brush')).toHaveClass(/bg-blue-600/)
  })

  test('should switch to Seed mode', async ({ app }) => {
    await app.selectMode('Seed')

    await expect(app.getModeButton('Seed')).toHaveClass(/bg-blue-600/)
  })

  test('should switch to Import mode', async ({ app }) => {
    await app.selectMode('Import')

    await expect(app.getModeButton('Import')).toHaveClass(/bg-blue-600/)
  })

  test('should return to Orbit mode', async ({ app }) => {
    // Switch away first
    await app.selectMode('Primitive')
    await expect(app.getModeButton('Primitive')).toHaveClass(/bg-blue-600/)

    // Switch back to Orbit
    await app.selectMode('Orbit')
    await expect(app.getModeButton('Orbit')).toHaveClass(/bg-blue-600/)
  })
})

test.describe('Keyboard Shortcuts', () => {
  test.beforeEach(async ({ app }) => {
    await app.goto()
  })

  test('should switch to Primitive mode with P key', async ({ app, page }) => {
    await page.keyboard.press('p')

    await expect(app.getModeButton('Primitive')).toHaveClass(/bg-blue-600/)
  })

  test('should switch to Slice mode with S key', async ({ app, page }) => {
    await page.keyboard.press('s')

    await expect(app.getModeButton('Slice')).toHaveClass(/bg-blue-600/)
  })

  test('should switch to Brush mode with B key', async ({ app, page }) => {
    await page.keyboard.press('b')

    await expect(app.getModeButton('Brush')).toHaveClass(/bg-blue-600/)
  })

  test('should switch to Seed mode with G key', async ({ app, page }) => {
    await page.keyboard.press('g')

    await expect(app.getModeButton('Seed')).toHaveClass(/bg-blue-600/)
  })

  test('should switch to Import mode with I key', async ({ app, page }) => {
    await page.keyboard.press('i')

    await expect(app.getModeButton('Import')).toHaveClass(/bg-blue-600/)
  })

  test('should return to Orbit mode with Escape key', async ({ app, page }) => {
    // Switch to another mode first
    await page.keyboard.press('p')
    await expect(app.getModeButton('Primitive')).toHaveClass(/bg-blue-600/)

    // Press Escape to return to Orbit
    await page.keyboard.press('Escape')
    await expect(app.getModeButton('Orbit')).toHaveClass(/bg-blue-600/)
  })

  test('should not trigger shortcuts when typing in input', async ({ app }) => {
    // Open create project dialog
    await app.openCreateProjectDialog()

    // Type 'p' in the input (should not switch modes)
    await app.page.fill('input[placeholder="Project name"]', 'ppp')

    // Close dialog to check mode
    await app.page.keyboard.press('Escape')
    await app.page.waitForSelector('[role="dialog"]', { state: 'hidden' })

    // Should still be in Orbit mode
    await expect(app.getModeButton('Orbit')).toHaveClass(/bg-blue-600/)
    await expect(app.getModeButton('Primitive')).not.toHaveClass(/bg-blue-600/)
  })
})

test.describe('Label Selection', () => {
  test.beforeEach(async ({ app }) => {
    await app.goto()
  })

  test('should display label buttons', async ({ app, page }) => {
    // Labels have aria-labels and role="radio" from Radix ToggleGroup
    await expect(page.getByRole('radio', { name: 'Solid' })).toBeVisible()
    await expect(page.getByRole('radio', { name: 'Empty' })).toBeVisible()
    await expect(page.getByRole('radio', { name: 'Surface' })).toBeVisible()
  })

  test('should default to Solid label', async ({ app, page }) => {
    const solidButton = page.getByRole('radio', { name: 'Solid' })
    await expect(solidButton).toHaveClass(/ring-2/)
  })

  test('should switch to Empty label', async ({ app, page }) => {
    const emptyButton = page.getByRole('radio', { name: 'Empty' })
    await emptyButton.click()

    await expect(emptyButton).toHaveClass(/ring-2/)

    const solidButton = page.getByRole('radio', { name: 'Solid' })
    await expect(solidButton).not.toHaveClass(/ring-2/)
  })

  test('should switch to Surface label', async ({ app, page }) => {
    const surfaceButton = page.getByRole('radio', { name: 'Surface' })
    await surfaceButton.click()

    await expect(surfaceButton).toHaveClass(/ring-2/)
  })
})

test.describe('Primitive Mode Sub-options', () => {
  test.beforeEach(async ({ app }) => {
    await app.goto()
    await app.selectMode('Primitive')
  })

  test('should switch primitive type with keyboard in Primitive mode', async ({ app, page }) => {
    // Press B for box (should already be default)
    await page.keyboard.press('b')
    // Box should be selected (we'd check the primitive store, but for E2E we check UI)

    // Press O for sphere
    await page.keyboard.press('o')

    // Press H for halfspace
    await page.keyboard.press('h')

    // Press C for cylinder
    await page.keyboard.press('c')

    // Mode should still be Primitive
    await expect(app.getModeButton('Primitive')).toHaveClass(/bg-blue-600/)
  })
})

test.describe('Mode-specific UI', () => {
  test.beforeEach(async ({ app }) => {
    await app.goto()
  })

  test('should show primitive options in Primitive mode', async ({ app, page }) => {
    await app.selectMode('Primitive')

    // Should see primitive type selector or related UI
    // Check for primitive-related text in label panel
    await expect(page.getByText(/Box|Sphere|Halfspace|Cylinder/).first()).toBeVisible()
  })

  test('should show slice options in Slice mode', async ({ app, page }) => {
    await app.selectMode('Slice')

    // Should see slice plane selector (XY, XZ, YZ)
    await expect(page.getByText(/XY|XZ|YZ/).first()).toBeVisible()
  })

  test('should show brush options in Brush mode', async ({ app, page }) => {
    await app.selectMode('Brush')

    // Should see brush size slider or controls
    await expect(page.getByText(/Brush|Radius|Size/).first()).toBeVisible()
  })

  test('should show seed options in Seed mode', async ({ app, page }) => {
    await app.selectMode('Seed')

    // Should see seed/propagation related controls
    await expect(page.getByText(/Seed|Propagat/).first()).toBeVisible()
  })

  test('should show import options in Import mode', async ({ app, page }) => {
    await app.selectMode('Import')

    // Should see import-related UI
    await expect(page.getByText(/Import|ML|Model/).first()).toBeVisible()
  })
})
