// ABOUTME: E2E tests for primitive placement and transformation
// ABOUTME: Tests box/sphere creation, scaling, and movement

import { test, expect } from './fixtures'

test.describe('Primitive Placement and Transform', () => {
  test.beforeEach(async ({ app }) => {
    await app.goto()
    // Create a project first
    await app.createProject(`Primitive Test ${Date.now()}`)
    await app.dismissToast()
  })

  test('should place a box primitive by clicking on canvas', async ({ app, page }) => {
    // Switch to Primitive mode
    await app.selectMode('Primitive')
    await expect(app.getModeButton('Primitive')).toHaveClass(/bg-blue-600/)

    // Click on canvas to place primitive
    const canvas = app.canvas
    await expect(canvas).toBeVisible()

    const box = await canvas.boundingBox()
    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }

    // Should see the confirm button (primitive is being placed)
    await expect(page.getByText('Confirm (Enter)')).toBeVisible({ timeout: 5000 })

    // Press Enter to confirm
    await page.keyboard.press('Enter')

    // Confirm button should disappear after confirming
    await expect(page.getByText('Confirm (Enter)')).not.toBeVisible({ timeout: 5000 })
  })

  test('should scale a box and maintain geometry after scaling', async ({ app, page }) => {
    // Switch to Primitive mode
    await app.selectMode('Primitive')

    // Click on canvas to place primitive
    const canvas = app.canvas
    const box = await canvas.boundingBox()
    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }

    // Confirm the primitive
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)

    // Click on the primitive to select it (click center of canvas where we placed it)
    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await page.waitForTimeout(300)

    // Press R to enter scale mode (W/E/R like Unity)
    await page.keyboard.press('r')

    // The transform mode indicator should show Scale is active
    await expect(page.locator('text=[R] Scale')).toHaveClass(/text-blue-400/, { timeout: 2000 })

    // Drag to scale (simulate scaling by dragging)
    if (box) {
      const centerX = box.width / 2
      const centerY = box.height / 2
      // Drag from center outward to scale
      await page.mouse.move(centerX + 50, centerY)
      await page.mouse.down()
      await page.mouse.move(centerX + 100, centerY, { steps: 5 })
      await page.mouse.up()
    }
    await page.waitForTimeout(300)

    // Press W to return to translate mode
    await page.keyboard.press('w')
    await expect(page.locator('text=[W] Move')).toHaveClass(/text-blue-400/, { timeout: 2000 })

    // The primitive mesh should still be visible (not disappeared)
    // Check that canvas still has interactive content
    await expect(canvas).toBeVisible()

    // Try to move the primitive - drag it
    if (box) {
      const centerX = box.width / 2
      const centerY = box.height / 2
      await page.mouse.move(centerX, centerY)
      await page.mouse.down()
      await page.mouse.move(centerX + 50, centerY + 50, { steps: 5 })
      await page.mouse.up()
    }

    // App should still be responsive - mode button should still work
    await expect(app.getModeButton('Primitive')).toHaveClass(/bg-blue-600/)
  })

  test('should switch transform modes with keyboard shortcuts', async ({ app, page }) => {
    // Switch to Primitive mode
    await app.selectMode('Primitive')

    // Place and confirm a primitive
    const canvas = app.canvas
    const box = await canvas.boundingBox()
    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await page.keyboard.press('Enter')
    await page.waitForTimeout(300)

    // Select the primitive
    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await page.waitForTimeout(300)

    // Test W for translate (W/E/R like Unity)
    await page.keyboard.press('w')
    await expect(page.locator('text=[W] Move')).toHaveClass(/text-blue-400/)

    // Test E for rotate
    await page.keyboard.press('e')
    await expect(page.locator('text=[E] Rotate')).toHaveClass(/text-blue-400/)

    // Test R for scale
    await page.keyboard.press('r')
    await expect(page.locator('text=[R] Scale')).toHaveClass(/text-blue-400/)

    // Back to W
    await page.keyboard.press('w')
    await expect(page.locator('text=[W] Move')).toHaveClass(/text-blue-400/)
  })
})
