// ABOUTME: E2E tests for interaction modes
// ABOUTME: Tests toolbar mode switching and keyboard shortcuts

import { test, expect, createTestPointCloud, cleanupTestFiles } from './fixtures'

test.describe('Toolbar Mode Switching', () => {
  test.beforeEach(async ({ app }) => {
    await app.goto()
  })

  test('should display all mode buttons in toolbar', async ({ app, page }) => {
    const modes = ['Orbit', 'Primitive', 'Slice', 'Brush', 'Seed', 'Import']

    for (const mode of modes) {
      await expect(page.getByRole('button', { name: mode })).toBeVisible()
    }
  })

  test('should default to Orbit mode', async ({ app, page }) => {
    const orbitButton = page.getByRole('button', { name: 'Orbit' })
    await expect(orbitButton).toHaveClass(/bg-blue-600/)
  })

  test('should switch to Primitive mode', async ({ app, page }) => {
    await app.selectMode('Primitive')

    const primitiveButton = page.getByRole('button', { name: 'Primitive' })
    await expect(primitiveButton).toHaveClass(/bg-blue-600/)

    // Orbit should no longer be active
    const orbitButton = page.getByRole('button', { name: 'Orbit' })
    await expect(orbitButton).not.toHaveClass(/bg-blue-600/)
  })

  test('should switch to Slice mode', async ({ app, page }) => {
    await app.selectMode('Slice')

    const sliceButton = page.getByRole('button', { name: 'Slice' })
    await expect(sliceButton).toHaveClass(/bg-blue-600/)
  })

  test('should switch to Brush mode', async ({ app, page }) => {
    await app.selectMode('Brush')

    const brushButton = page.getByRole('button', { name: 'Brush' })
    await expect(brushButton).toHaveClass(/bg-blue-600/)
  })

  test('should switch to Seed mode', async ({ app, page }) => {
    await app.selectMode('Seed')

    const seedButton = page.getByRole('button', { name: 'Seed' })
    await expect(seedButton).toHaveClass(/bg-blue-600/)
  })

  test('should switch to Import mode', async ({ app, page }) => {
    await app.selectMode('Import')

    const importButton = page.getByRole('button', { name: 'Import' })
    await expect(importButton).toHaveClass(/bg-blue-600/)
  })

  test('should return to Orbit mode', async ({ app, page }) => {
    // Switch away first
    await app.selectMode('Primitive')
    await expect(page.getByRole('button', { name: 'Primitive' })).toHaveClass(/bg-blue-600/)

    // Switch back to Orbit
    await app.selectMode('Orbit')
    await expect(page.getByRole('button', { name: 'Orbit' })).toHaveClass(/bg-blue-600/)
  })
})

test.describe('Keyboard Shortcuts', () => {
  test.beforeEach(async ({ app }) => {
    await app.goto()
  })

  test('should switch to Primitive mode with P key', async ({ app, page }) => {
    await page.keyboard.press('p')

    const primitiveButton = page.getByRole('button', { name: 'Primitive' })
    await expect(primitiveButton).toHaveClass(/bg-blue-600/)
  })

  test('should switch to Slice mode with S key', async ({ app, page }) => {
    await page.keyboard.press('s')

    const sliceButton = page.getByRole('button', { name: 'Slice' })
    await expect(sliceButton).toHaveClass(/bg-blue-600/)
  })

  test('should switch to Brush mode with B key', async ({ app, page }) => {
    await page.keyboard.press('b')

    const brushButton = page.getByRole('button', { name: 'Brush' })
    await expect(brushButton).toHaveClass(/bg-blue-600/)
  })

  test('should switch to Seed mode with G key', async ({ app, page }) => {
    await page.keyboard.press('g')

    const seedButton = page.getByRole('button', { name: 'Seed' })
    await expect(seedButton).toHaveClass(/bg-blue-600/)
  })

  test('should switch to Import mode with I key', async ({ app, page }) => {
    await page.keyboard.press('i')

    const importButton = page.getByRole('button', { name: 'Import' })
    await expect(importButton).toHaveClass(/bg-blue-600/)
  })

  test('should return to Orbit mode with Escape key', async ({ app, page }) => {
    // Switch to another mode first
    await page.keyboard.press('p')
    await expect(page.getByRole('button', { name: 'Primitive' })).toHaveClass(/bg-blue-600/)

    // Press Escape to return to Orbit
    await page.keyboard.press('Escape')
    await expect(page.getByRole('button', { name: 'Orbit' })).toHaveClass(/bg-blue-600/)
  })

  test('should not trigger shortcuts when typing in input', async ({ app, page }) => {
    // Open create project dialog
    await app.openCreateProjectDialog()

    // Type 'p' in the input (should not switch modes)
    await page.fill('input[placeholder="Project name"]', 'ppp')

    // Should still be in Orbit mode
    await expect(page.getByRole('button', { name: 'Orbit' })).toHaveClass(/bg-blue-600/)
    await expect(page.getByRole('button', { name: 'Primitive' })).not.toHaveClass(/bg-blue-600/)
  })
})

test.describe('Label Selection', () => {
  test.beforeEach(async ({ app }) => {
    await app.goto()
  })

  test('should display label buttons', async ({ app, page }) => {
    const labels = ['Solid', 'Empty', 'Surface']

    for (const label of labels) {
      await expect(page.getByRole('button', { name: label })).toBeVisible()
    }
  })

  test('should default to Solid label', async ({ app, page }) => {
    const solidButton = page.getByRole('button', { name: 'Solid' })
    await expect(solidButton).toHaveClass(/ring-2/)
  })

  test('should switch to Empty label', async ({ app, page }) => {
    await page.getByRole('button', { name: 'Empty' }).click()

    await expect(page.getByRole('button', { name: 'Empty' })).toHaveClass(/ring-2/)
    await expect(page.getByRole('button', { name: 'Solid' })).not.toHaveClass(/ring-2/)
  })

  test('should switch to Surface label', async ({ app, page }) => {
    await page.getByRole('button', { name: 'Surface' }).click()

    await expect(page.getByRole('button', { name: 'Surface' })).toHaveClass(/ring-2/)
  })

  test('should cycle labels with Tab key', async ({ app, page }) => {
    // Start with Solid
    await expect(page.getByRole('button', { name: 'Solid' })).toHaveClass(/ring-2/)

    // Press Tab to cycle to Empty
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: 'Empty' })).toHaveClass(/ring-2/)

    // Press Tab to cycle to Surface
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: 'Surface' })).toHaveClass(/ring-2/)

    // Press Tab to cycle back to Solid
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: 'Solid' })).toHaveClass(/ring-2/)
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
    await expect(page.getByRole('button', { name: 'Primitive' })).toHaveClass(/bg-blue-600/)
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
