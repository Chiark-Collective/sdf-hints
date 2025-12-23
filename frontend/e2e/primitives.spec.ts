// ABOUTME: E2E tests for primitive placement and transformation
// ABOUTME: Tests all primitive types and transform operations

import { test, expect } from './fixtures'

test.describe('Primitive Placement', () => {
  test.beforeEach(async ({ app }) => {
    await app.goto()
    await app.createProject(`Primitive Test ${Date.now()}`)
    await app.dismissToast()
    await app.selectMode('Primitive')
  })

  test('should show ghost preview when hovering canvas', async ({ app, page }) => {
    const canvas = app.canvas
    await expect(canvas).toBeVisible()

    // Move mouse over canvas
    const box = await canvas.boundingBox()
    if (box) {
      await page.mouse.move(box.width / 2, box.height / 2)
    }

    // Wait a moment for ghost to appear
    await page.waitForTimeout(200)

    // Take screenshot for visual verification
    await page.screenshot({ path: 'test-results/ghost-preview.png' })
  })

  test('should place a box primitive', async ({ app, page }) => {
    const canvas = app.canvas
    const box = await canvas.boundingBox()

    // Click to place
    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }

    // Confirm button should appear
    await expect(page.getByText('Confirm (Enter)')).toBeVisible({ timeout: 5000 })

    // Take screenshot of placing state
    await page.screenshot({ path: 'test-results/box-placing.png' })

    // Confirm placement
    await page.keyboard.press('Enter')

    // Confirm button should disappear
    await expect(page.getByText('Confirm (Enter)')).not.toBeVisible({ timeout: 5000 })

    // Take screenshot of confirmed box
    await page.screenshot({ path: 'test-results/box-confirmed.png' })
  })

  test('should place a sphere primitive', async ({ app, page }) => {
    // Switch to sphere (O key in primitive mode)
    await page.keyboard.press('o')
    await page.waitForTimeout(100)

    const canvas = app.canvas
    const box = await canvas.boundingBox()

    // Click to place
    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }

    // Confirm button should appear
    await expect(page.getByText('Confirm (Enter)')).toBeVisible({ timeout: 5000 })

    // Take screenshot
    await page.screenshot({ path: 'test-results/sphere-placing.png' })

    // Confirm
    await page.keyboard.press('Enter')
    await expect(page.getByText('Confirm (Enter)')).not.toBeVisible({ timeout: 5000 })

    await page.screenshot({ path: 'test-results/sphere-confirmed.png' })
  })

  test('should place a cylinder primitive', async ({ app, page }) => {
    // Switch to cylinder (press 'c')
    await page.keyboard.press('c')
    await page.waitForTimeout(100)

    const canvas = app.canvas
    const box = await canvas.boundingBox()

    // Click to place
    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }

    // Confirm button should appear
    await expect(page.getByText('Confirm (Enter)')).toBeVisible({ timeout: 5000 })

    await page.screenshot({ path: 'test-results/cylinder-placing.png' })

    // Confirm
    await page.keyboard.press('Enter')
    await expect(page.getByText('Confirm (Enter)')).not.toBeVisible({ timeout: 5000 })

    await page.screenshot({ path: 'test-results/cylinder-confirmed.png' })
  })

  test('should place a halfspace primitive', async ({ app, page }) => {
    // Switch to halfspace (press 'h')
    await page.keyboard.press('h')
    await page.waitForTimeout(100)

    const canvas = app.canvas
    const box = await canvas.boundingBox()

    // Click to place
    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }

    // Confirm button should appear
    await expect(page.getByText('Confirm (Enter)')).toBeVisible({ timeout: 5000 })

    await page.screenshot({ path: 'test-results/halfspace-placing.png' })

    // Confirm
    await page.keyboard.press('Enter')
    await expect(page.getByText('Confirm (Enter)')).not.toBeVisible({ timeout: 5000 })

    await page.screenshot({ path: 'test-results/halfspace-confirmed.png' })
  })

  test('should cancel placement with Escape', async ({ app, page }) => {
    const canvas = app.canvas
    const box = await canvas.boundingBox()

    // Click to place
    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }

    // Confirm button should appear
    await expect(page.getByText('Confirm (Enter)')).toBeVisible({ timeout: 5000 })

    // Press Escape to cancel
    await page.keyboard.press('Escape')

    // Confirm button should disappear
    await expect(page.getByText('Confirm (Enter)')).not.toBeVisible({ timeout: 2000 })
  })
})

test.describe('Primitive Transform Operations', () => {
  test.beforeEach(async ({ app, page }) => {
    await app.goto()
    await app.createProject(`Transform Test ${Date.now()}`)
    await app.dismissToast()
    await app.selectMode('Primitive')

    // Place and confirm a box
    const canvas = app.canvas
    const box = await canvas.boundingBox()
    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)
  })

  test('should select placed primitive by clicking', async ({ app, page }) => {
    const canvas = app.canvas
    const box = await canvas.boundingBox()

    // Click on the primitive to select it
    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await page.waitForTimeout(300)

    // Transform mode indicator should be visible (means something is selected)
    await expect(page.locator('text=[W] Move')).toBeVisible({ timeout: 2000 })

    await page.screenshot({ path: 'test-results/box-selected.png' })
  })

  test('should move primitive in translate mode', async ({ app, page }) => {
    const canvas = app.canvas
    const box = await canvas.boundingBox()

    // Select primitive
    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await page.waitForTimeout(300)

    // Should be in translate mode by default
    await expect(page.locator('text=[W] Move')).toHaveClass(/text-blue-400/)

    // Take before screenshot
    await page.screenshot({ path: 'test-results/move-before.png' })

    // Drag to move
    if (box) {
      const centerX = box.width / 2
      const centerY = box.height / 2
      await page.mouse.move(centerX, centerY)
      await page.mouse.down()
      await page.mouse.move(centerX + 100, centerY, { steps: 10 })
      await page.mouse.up()
    }
    await page.waitForTimeout(300)

    // Take after screenshot
    await page.screenshot({ path: 'test-results/move-after.png' })

    // App should still be responsive
    await expect(app.getModeButton('Primitive')).toHaveClass(/bg-blue-600/)
  })

  test('should rotate primitive in rotate mode', async ({ app, page }) => {
    const canvas = app.canvas
    const box = await canvas.boundingBox()

    // Select primitive
    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await page.waitForTimeout(300)

    // Switch to rotate mode
    await page.keyboard.press('e')
    await expect(page.locator('text=[E] Rotate')).toHaveClass(/text-blue-400/)

    await page.screenshot({ path: 'test-results/rotate-before.png' })

    // Drag to rotate
    if (box) {
      const centerX = box.width / 2
      const centerY = box.height / 2
      await page.mouse.move(centerX + 50, centerY)
      await page.mouse.down()
      await page.mouse.move(centerX + 50, centerY + 100, { steps: 10 })
      await page.mouse.up()
    }
    await page.waitForTimeout(300)

    await page.screenshot({ path: 'test-results/rotate-after.png' })

    // App should still be responsive
    await expect(app.getModeButton('Primitive')).toHaveClass(/bg-blue-600/)
  })

  test('should scale primitive in scale mode', async ({ app, page }) => {
    const canvas = app.canvas
    const box = await canvas.boundingBox()

    // Select primitive
    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await page.waitForTimeout(300)

    // Switch to scale mode
    await page.keyboard.press('r')
    await expect(page.locator('text=[R] Scale')).toHaveClass(/text-blue-400/)

    await page.screenshot({ path: 'test-results/scale-before.png' })

    // Drag to scale
    if (box) {
      const centerX = box.width / 2
      const centerY = box.height / 2
      await page.mouse.move(centerX + 50, centerY)
      await page.mouse.down()
      await page.mouse.move(centerX + 150, centerY, { steps: 10 })
      await page.mouse.up()
    }
    await page.waitForTimeout(300)

    await page.screenshot({ path: 'test-results/scale-after.png' })

    // App should still be responsive
    await expect(app.getModeButton('Primitive')).toHaveClass(/bg-blue-600/)
  })

  test('should deselect with Escape and allow new placement', async ({ app, page }) => {
    const canvas = app.canvas
    const box = await canvas.boundingBox()

    // Select primitive
    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await page.waitForTimeout(300)

    // Transform mode should be visible
    await expect(page.locator('text=[W] Move')).toBeVisible()

    // Press Escape to deselect (this also switches to Orbit mode globally)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(200)

    // Switch back to Primitive mode
    await app.selectMode('Primitive')
    await page.waitForTimeout(200)

    // Click elsewhere to place a new primitive
    if (box) {
      await canvas.click({ position: { x: box.width / 4, y: box.height / 4 } })
    }

    // Should see confirm button for new placement
    await expect(page.getByText('Confirm (Enter)')).toBeVisible({ timeout: 5000 })
  })

  test('should delete primitive with Delete key', async ({ app, page }) => {
    const canvas = app.canvas
    const box = await canvas.boundingBox()

    // Select primitive
    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await page.waitForTimeout(300)

    // Transform mode should be visible (primitive selected)
    await expect(page.locator('text=[W] Move')).toBeVisible()

    // Take screenshot before delete
    await page.screenshot({ path: 'test-results/before-delete.png' })

    // Press Delete to remove
    await page.keyboard.press('Delete')
    await page.waitForTimeout(300)

    // Take screenshot after delete
    await page.screenshot({ path: 'test-results/after-delete.png' })

    // Click to place a new primitive (should work since old one is deleted)
    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }

    // Should see confirm button (placing new primitive, not selecting old one)
    await expect(page.getByText('Confirm (Enter)')).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Primitive Type Switching', () => {
  test.beforeEach(async ({ app }) => {
    await app.goto()
    await app.createProject(`Type Switch Test ${Date.now()}`)
    await app.dismissToast()
    await app.selectMode('Primitive')
  })

  test('should switch between primitive types with keyboard', async ({ app, page }) => {
    const canvas = app.canvas
    const canvasBox = await canvas.boundingBox()
    if (!canvasBox) return

    // Use spread out positions to avoid clicking on already-placed primitives
    // Each position is in a different quadrant of the canvas
    const positions = [
      { x: canvasBox.width * 0.25, y: canvasBox.height * 0.25 },  // top-left
      { x: canvasBox.width * 0.75, y: canvasBox.height * 0.25 },  // top-right
      { x: canvasBox.width * 0.25, y: canvasBox.height * 0.75 },  // bottom-left
      { x: canvasBox.width * 0.75, y: canvasBox.height * 0.75 },  // bottom-right
    ]

    // Box (default)
    await canvas.click({ position: positions[0] })
    await expect(page.getByText('Confirm (Enter)')).toBeVisible({ timeout: 5000 })
    await page.screenshot({ path: 'test-results/type-box.png' })
    await page.keyboard.press('Enter')
    await page.waitForTimeout(300)

    // Sphere (press 'o')
    await page.keyboard.press('o')
    await page.waitForTimeout(100)
    await canvas.click({ position: positions[1] })
    await expect(page.getByText('Confirm (Enter)')).toBeVisible({ timeout: 5000 })
    await page.screenshot({ path: 'test-results/type-sphere.png' })
    await page.keyboard.press('Enter')
    await page.waitForTimeout(300)

    // Cylinder (press 'c')
    await page.keyboard.press('c')
    await page.waitForTimeout(100)
    await canvas.click({ position: positions[2] })
    await expect(page.getByText('Confirm (Enter)')).toBeVisible({ timeout: 5000 })
    await page.screenshot({ path: 'test-results/type-cylinder.png' })
    await page.keyboard.press('Enter')
    await page.waitForTimeout(300)

    // Halfspace (press 'h')
    await page.keyboard.press('h')
    await page.waitForTimeout(100)
    await canvas.click({ position: positions[3] })
    await expect(page.getByText('Confirm (Enter)')).toBeVisible({ timeout: 5000 })
    await page.screenshot({ path: 'test-results/type-halfspace.png' })
  })
})

test.describe('Transform Mode Indicators', () => {
  test.beforeEach(async ({ app, page }) => {
    await app.goto()
    await app.createProject(`Indicator Test ${Date.now()}`)
    await app.dismissToast()
    await app.selectMode('Primitive')

    // Place and confirm a box, then select it
    const canvas = app.canvas
    const box = await canvas.boundingBox()
    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await page.keyboard.press('Enter')
    await page.waitForTimeout(300)
    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await page.waitForTimeout(300)
  })

  test('should show correct mode indicators when switching W/E/R', async ({ page }) => {
    // W = Move (default)
    await page.keyboard.press('w')
    await expect(page.locator('text=[W] Move')).toHaveClass(/text-blue-400/)
    await expect(page.locator('text=[E] Rotate')).toHaveClass(/text-gray-400/)
    await expect(page.locator('text=[R] Scale')).toHaveClass(/text-gray-400/)

    // E = Rotate
    await page.keyboard.press('e')
    await expect(page.locator('text=[W] Move')).toHaveClass(/text-gray-400/)
    await expect(page.locator('text=[E] Rotate')).toHaveClass(/text-blue-400/)
    await expect(page.locator('text=[R] Scale')).toHaveClass(/text-gray-400/)

    // R = Scale
    await page.keyboard.press('r')
    await expect(page.locator('text=[W] Move')).toHaveClass(/text-gray-400/)
    await expect(page.locator('text=[E] Rotate')).toHaveClass(/text-gray-400/)
    await expect(page.locator('text=[R] Scale')).toHaveClass(/text-blue-400/)
  })
})
