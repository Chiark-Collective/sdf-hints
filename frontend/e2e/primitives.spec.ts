// ABOUTME: E2E tests for primitive placement, transformation, and deletion
// ABOUTME: Comprehensive coverage of all primitive types (box, sphere, cylinder, halfspace)

import { test, expect } from './fixtures'

// =============================================================================
// Primitive Placement Tests
// =============================================================================

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

    const box = await canvas.boundingBox()
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    }
    await page.waitForTimeout(200)

    await page.screenshot({ path: 'test-results/ghost-preview.png' })
  })

  test('should place a box primitive', async ({ app, page }) => {
    const canvas = app.canvas
    const box = await canvas.boundingBox()

    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }

    await expect(page.getByText('Confirm (Enter)')).toBeVisible({ timeout: 5000 })
    await page.screenshot({ path: 'test-results/box-placing.png' })

    await page.keyboard.press('Enter')
    await expect(page.getByText('Confirm (Enter)')).not.toBeVisible({ timeout: 5000 })
    await page.screenshot({ path: 'test-results/box-confirmed.png' })
  })

  test('should place a sphere primitive', async ({ app, page }) => {
    await page.keyboard.press('o')
    await page.waitForTimeout(100)

    const canvas = app.canvas
    const box = await canvas.boundingBox()

    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }

    await expect(page.getByText('Confirm (Enter)')).toBeVisible({ timeout: 5000 })
    await page.screenshot({ path: 'test-results/sphere-placing.png' })

    await page.keyboard.press('Enter')
    await expect(page.getByText('Confirm (Enter)')).not.toBeVisible({ timeout: 5000 })
    await page.screenshot({ path: 'test-results/sphere-confirmed.png' })
  })

  test('should place a cylinder primitive', async ({ app, page }) => {
    await page.keyboard.press('c')
    await page.waitForTimeout(100)

    const canvas = app.canvas
    const box = await canvas.boundingBox()

    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }

    await expect(page.getByText('Confirm (Enter)')).toBeVisible({ timeout: 5000 })
    await page.screenshot({ path: 'test-results/cylinder-placing.png' })

    await page.keyboard.press('Enter')
    await expect(page.getByText('Confirm (Enter)')).not.toBeVisible({ timeout: 5000 })
    await page.screenshot({ path: 'test-results/cylinder-confirmed.png' })
  })

  test('should place a halfspace primitive', async ({ app, page }) => {
    await page.keyboard.press('h')
    await page.waitForTimeout(100)

    const canvas = app.canvas
    const box = await canvas.boundingBox()

    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }

    await expect(page.getByText('Confirm (Enter)')).toBeVisible({ timeout: 5000 })
    await page.screenshot({ path: 'test-results/halfspace-placing.png' })

    await page.keyboard.press('Enter')
    await expect(page.getByText('Confirm (Enter)')).not.toBeVisible({ timeout: 5000 })
    await page.screenshot({ path: 'test-results/halfspace-confirmed.png' })
  })

  test('should cancel placement with Escape', async ({ app, page }) => {
    const canvas = app.canvas
    const box = await canvas.boundingBox()

    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }

    await expect(page.getByText('Confirm (Enter)')).toBeVisible({ timeout: 5000 })
    await page.keyboard.press('Escape')
    await expect(page.getByText('Confirm (Enter)')).not.toBeVisible({ timeout: 2000 })
  })
})

// =============================================================================
// Transform Operations - Box
// =============================================================================

test.describe('Box Transform Operations', () => {
  test.beforeEach(async ({ app, page }) => {
    await app.goto()
    await app.createProject(`Box Transform ${Date.now()}`)
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

  test('should select box by clicking', async ({ app, page }) => {
    const canvas = app.canvas
    const box = await canvas.boundingBox()

    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await page.waitForTimeout(300)

    await expect(page.locator('text=[W] Move')).toBeVisible({ timeout: 2000 })
    await page.screenshot({ path: 'test-results/box-selected.png' })
  })

  test('should move box in translate mode', async ({ app, page }) => {
    const canvas = app.canvas
    const box = await canvas.boundingBox()

    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await page.waitForTimeout(300)

    await expect(page.locator('text=[W] Move')).toHaveClass(/text-blue-400/)
    await page.screenshot({ path: 'test-results/box-move-before.png' })

    if (box) {
      const centerX = box.x + box.width / 2
      const centerY = box.y + box.height / 2
      await page.mouse.move(centerX, centerY)
      await page.mouse.down()
      await page.mouse.move(centerX + 100, centerY, { steps: 10 })
      await page.mouse.up()
    }
    await page.waitForTimeout(300)

    await page.screenshot({ path: 'test-results/box-move-after.png' })
    await expect(app.getModeButton('Primitive')).toHaveClass(/bg-blue-600/)
  })

  test('should rotate box in rotate mode', async ({ app, page }) => {
    const canvas = app.canvas
    const box = await canvas.boundingBox()

    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await page.waitForTimeout(300)

    await page.keyboard.press('e')
    await expect(page.locator('text=[E] Rotate')).toHaveClass(/text-blue-400/)
    await page.screenshot({ path: 'test-results/box-rotate-before.png' })

    if (box) {
      const centerX = box.x + box.width / 2
      const centerY = box.y + box.height / 2
      await page.mouse.move(centerX + 50, centerY)
      await page.mouse.down()
      await page.mouse.move(centerX + 50, centerY + 100, { steps: 10 })
      await page.mouse.up()
    }
    await page.waitForTimeout(300)

    await page.screenshot({ path: 'test-results/box-rotate-after.png' })
  })

  test('should scale box in scale mode', async ({ app, page }) => {
    const canvas = app.canvas
    const box = await canvas.boundingBox()

    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await page.waitForTimeout(300)

    await page.keyboard.press('r')
    await expect(page.locator('text=[R] Scale')).toHaveClass(/text-blue-400/)
    await page.screenshot({ path: 'test-results/box-scale-before.png' })

    if (box) {
      const centerX = box.x + box.width / 2
      const centerY = box.y + box.height / 2
      await page.mouse.move(centerX + 50, centerY)
      await page.mouse.down()
      await page.mouse.move(centerX + 150, centerY, { steps: 10 })
      await page.mouse.up()
    }
    await page.waitForTimeout(300)

    await page.screenshot({ path: 'test-results/box-scale-after.png' })
  })

  test('should delete box with Delete key', async ({ app, page }) => {
    const canvas = app.canvas
    const box = await canvas.boundingBox()

    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await page.waitForTimeout(300)
    await expect(page.locator('text=[W] Move')).toBeVisible()

    await page.keyboard.press('Delete')
    await page.waitForTimeout(300)

    // Click to place new - should work since old is deleted
    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await expect(page.getByText('Confirm (Enter)')).toBeVisible({ timeout: 5000 })
  })

  test('should delete box with Backspace key', async ({ app, page }) => {
    const canvas = app.canvas
    const box = await canvas.boundingBox()

    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await page.waitForTimeout(300)
    await expect(page.locator('text=[W] Move')).toBeVisible()

    await page.keyboard.press('Backspace')
    await page.waitForTimeout(300)

    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await expect(page.getByText('Confirm (Enter)')).toBeVisible({ timeout: 5000 })
  })
})

// =============================================================================
// Transform Operations - Sphere
// =============================================================================

test.describe('Sphere Transform Operations', () => {
  test.beforeEach(async ({ app, page }) => {
    await app.goto()
    await app.createProject(`Sphere Transform ${Date.now()}`)
    await app.dismissToast()
    await app.selectMode('Primitive')

    // Switch to sphere and place
    await page.keyboard.press('o')
    await page.waitForTimeout(100)

    const canvas = app.canvas
    const box = await canvas.boundingBox()
    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)
  })

  test('should select sphere by clicking', async ({ app, page }) => {
    const canvas = app.canvas
    const box = await canvas.boundingBox()

    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await page.waitForTimeout(300)

    await expect(page.locator('text=[W] Move')).toBeVisible({ timeout: 2000 })
    await page.screenshot({ path: 'test-results/sphere-selected.png' })
  })

  test('should move sphere in translate mode', async ({ app, page }) => {
    const canvas = app.canvas
    const box = await canvas.boundingBox()

    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await page.waitForTimeout(300)

    await expect(page.locator('text=[W] Move')).toHaveClass(/text-blue-400/)

    if (box) {
      const centerX = box.x + box.width / 2
      const centerY = box.y + box.height / 2
      await page.mouse.move(centerX, centerY)
      await page.mouse.down()
      await page.mouse.move(centerX + 100, centerY, { steps: 10 })
      await page.mouse.up()
    }
    await page.waitForTimeout(300)

    await page.screenshot({ path: 'test-results/sphere-move-after.png' })
  })

  test('should scale sphere uniformly', async ({ app, page }) => {
    const canvas = app.canvas
    const box = await canvas.boundingBox()

    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await page.waitForTimeout(300)

    await page.keyboard.press('r')
    await expect(page.locator('text=[R] Scale')).toHaveClass(/text-blue-400/)

    if (box) {
      const centerX = box.x + box.width / 2
      const centerY = box.y + box.height / 2
      await page.mouse.move(centerX + 50, centerY)
      await page.mouse.down()
      await page.mouse.move(centerX + 150, centerY, { steps: 10 })
      await page.mouse.up()
    }
    await page.waitForTimeout(300)

    await page.screenshot({ path: 'test-results/sphere-scale-after.png' })
  })

  test('should delete sphere with Delete key', async ({ app, page }) => {
    const canvas = app.canvas
    const box = await canvas.boundingBox()

    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await page.waitForTimeout(300)
    await expect(page.locator('text=[W] Move')).toBeVisible()

    await page.keyboard.press('Delete')
    await page.waitForTimeout(300)

    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await expect(page.getByText('Confirm (Enter)')).toBeVisible({ timeout: 5000 })
  })
})

// =============================================================================
// Transform Operations - Cylinder
// =============================================================================

test.describe('Cylinder Transform Operations', () => {
  test.beforeEach(async ({ app, page }) => {
    await app.goto()
    await app.createProject(`Cylinder Transform ${Date.now()}`)
    await app.dismissToast()
    await app.selectMode('Primitive')

    // Switch to cylinder and place
    await page.keyboard.press('c')
    await page.waitForTimeout(100)

    const canvas = app.canvas
    const box = await canvas.boundingBox()
    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)
  })

  test('should select cylinder by clicking', async ({ app, page }) => {
    const canvas = app.canvas
    const box = await canvas.boundingBox()

    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await page.waitForTimeout(300)

    await expect(page.locator('text=[W] Move')).toBeVisible({ timeout: 2000 })
    await page.screenshot({ path: 'test-results/cylinder-selected.png' })
  })

  test('should move cylinder in translate mode', async ({ app, page }) => {
    const canvas = app.canvas
    const box = await canvas.boundingBox()

    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await page.waitForTimeout(300)

    if (box) {
      const centerX = box.x + box.width / 2
      const centerY = box.y + box.height / 2
      await page.mouse.move(centerX, centerY)
      await page.mouse.down()
      await page.mouse.move(centerX + 100, centerY, { steps: 10 })
      await page.mouse.up()
    }
    await page.waitForTimeout(300)

    await page.screenshot({ path: 'test-results/cylinder-move-after.png' })
  })

  test('should scale cylinder (radius and height)', async ({ app, page }) => {
    const canvas = app.canvas
    const box = await canvas.boundingBox()

    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await page.waitForTimeout(300)

    await page.keyboard.press('r')
    await expect(page.locator('text=[R] Scale')).toHaveClass(/text-blue-400/)

    if (box) {
      const centerX = box.x + box.width / 2
      const centerY = box.y + box.height / 2
      await page.mouse.move(centerX + 50, centerY)
      await page.mouse.down()
      await page.mouse.move(centerX + 150, centerY, { steps: 10 })
      await page.mouse.up()
    }
    await page.waitForTimeout(300)

    await page.screenshot({ path: 'test-results/cylinder-scale-after.png' })
  })

  test('should delete cylinder with Delete key', async ({ app, page }) => {
    const canvas = app.canvas
    const box = await canvas.boundingBox()

    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await page.waitForTimeout(300)
    await expect(page.locator('text=[W] Move')).toBeVisible()

    await page.keyboard.press('Delete')
    await page.waitForTimeout(300)

    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await expect(page.getByText('Confirm (Enter)')).toBeVisible({ timeout: 5000 })
  })
})

// =============================================================================
// Transform Operations - Halfspace
// =============================================================================

test.describe('Halfspace Transform Operations', () => {
  test.beforeEach(async ({ app, page }) => {
    await app.goto()
    await app.createProject(`Halfspace Transform ${Date.now()}`)
    await app.dismissToast()
    await app.selectMode('Primitive')

    // Switch to halfspace and place
    await page.keyboard.press('h')
    await page.waitForTimeout(100)

    const canvas = app.canvas
    const box = await canvas.boundingBox()
    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)
  })

  test('should select halfspace by clicking', async ({ app, page }) => {
    const canvas = app.canvas
    const box = await canvas.boundingBox()

    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await page.waitForTimeout(300)

    await expect(page.locator('text=[W] Move')).toBeVisible({ timeout: 2000 })
    await page.screenshot({ path: 'test-results/halfspace-selected.png' })
  })

  test('should move halfspace in translate mode', async ({ app, page }) => {
    const canvas = app.canvas
    const box = await canvas.boundingBox()

    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await page.waitForTimeout(300)

    if (box) {
      const centerX = box.x + box.width / 2
      const centerY = box.y + box.height / 2
      await page.mouse.move(centerX, centerY)
      await page.mouse.down()
      await page.mouse.move(centerX + 100, centerY, { steps: 10 })
      await page.mouse.up()
    }
    await page.waitForTimeout(300)

    await page.screenshot({ path: 'test-results/halfspace-move-after.png' })
  })

  test('should rotate halfspace to change normal direction', async ({ app, page }) => {
    const canvas = app.canvas
    const box = await canvas.boundingBox()

    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await page.waitForTimeout(300)

    await page.keyboard.press('e')
    await expect(page.locator('text=[E] Rotate')).toHaveClass(/text-blue-400/)

    if (box) {
      const centerX = box.x + box.width / 2
      const centerY = box.y + box.height / 2
      await page.mouse.move(centerX + 50, centerY)
      await page.mouse.down()
      await page.mouse.move(centerX + 50, centerY + 100, { steps: 10 })
      await page.mouse.up()
    }
    await page.waitForTimeout(300)

    await page.screenshot({ path: 'test-results/halfspace-rotate-after.png' })
  })

  test('should delete halfspace with Delete key', async ({ app, page }) => {
    const canvas = app.canvas
    const box = await canvas.boundingBox()

    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await page.waitForTimeout(300)
    await expect(page.locator('text=[W] Move')).toBeVisible()

    await page.keyboard.press('Delete')
    await page.waitForTimeout(300)

    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await expect(page.getByText('Confirm (Enter)')).toBeVisible({ timeout: 5000 })
  })
})

// =============================================================================
// Multiple Primitives Interaction
// =============================================================================

test.describe('Multiple Primitives', () => {
  test.beforeEach(async ({ app }) => {
    await app.goto()
    await app.createProject(`Multi Primitive ${Date.now()}`)
    await app.dismissToast()
    await app.selectMode('Primitive')
  })

  test('should place multiple primitives of same type', async ({ app, page }) => {
    const canvas = app.canvas
    const box = await canvas.boundingBox()
    if (!box) return

    // Place first box
    await canvas.click({ position: { x: box.width * 0.3, y: box.height / 2 } })
    await expect(page.getByText('Confirm (Enter)')).toBeVisible({ timeout: 5000 })
    await page.keyboard.press('Enter')
    await page.waitForTimeout(300)

    // Place second box
    await canvas.click({ position: { x: box.width * 0.7, y: box.height / 2 } })
    await expect(page.getByText('Confirm (Enter)')).toBeVisible({ timeout: 5000 })
    await page.keyboard.press('Enter')
    await page.waitForTimeout(300)

    await page.screenshot({ path: 'test-results/multi-boxes.png' })
  })

  test('should place different primitive types', async ({ app, page }) => {
    const canvas = app.canvas
    const box = await canvas.boundingBox()
    if (!box) return

    const positions = [
      { x: box.width * 0.25, y: box.height * 0.25 },
      { x: box.width * 0.75, y: box.height * 0.25 },
      { x: box.width * 0.25, y: box.height * 0.75 },
      { x: box.width * 0.75, y: box.height * 0.75 },
    ]

    // Box
    await canvas.click({ position: positions[0] })
    await page.keyboard.press('Enter')
    await page.waitForTimeout(200)

    // Sphere
    await page.keyboard.press('o')
    await page.waitForTimeout(100)
    await canvas.click({ position: positions[1] })
    await page.keyboard.press('Enter')
    await page.waitForTimeout(200)

    // Cylinder
    await page.keyboard.press('c')
    await page.waitForTimeout(100)
    await canvas.click({ position: positions[2] })
    await page.keyboard.press('Enter')
    await page.waitForTimeout(200)

    // Halfspace
    await page.keyboard.press('h')
    await page.waitForTimeout(100)
    await canvas.click({ position: positions[3] })
    await page.keyboard.press('Enter')
    await page.waitForTimeout(200)

    await page.screenshot({ path: 'test-results/multi-types.png' })
  })

  test('should select different primitives by clicking', async ({ app, page }) => {
    const canvas = app.canvas
    const box = await canvas.boundingBox()
    if (!box) return

    // Place box at left
    await canvas.click({ position: { x: box.width * 0.3, y: box.height / 2 } })
    await page.keyboard.press('Enter')
    await page.waitForTimeout(300)

    // Place sphere at right
    await page.keyboard.press('o')
    await page.waitForTimeout(100)
    await canvas.click({ position: { x: box.width * 0.7, y: box.height / 2 } })
    await page.keyboard.press('Enter')
    await page.waitForTimeout(300)

    // Click on left to select box
    await canvas.click({ position: { x: box.width * 0.3, y: box.height / 2 } })
    await page.waitForTimeout(300)
    await expect(page.locator('text=[W] Move')).toBeVisible()
    await page.screenshot({ path: 'test-results/multi-select-box.png' })

    // Click on right to select sphere (should deselect box)
    await canvas.click({ position: { x: box.width * 0.7, y: box.height / 2 } })
    await page.waitForTimeout(300)
    await expect(page.locator('text=[W] Move')).toBeVisible()
    await page.screenshot({ path: 'test-results/multi-select-sphere.png' })
  })

  test('should deselect and start new placement when clicking empty space', async ({ app, page }) => {
    const canvas = app.canvas
    const box = await canvas.boundingBox()
    if (!box) return

    // Place box at center
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    await page.keyboard.press('Enter')
    await page.waitForTimeout(300)

    // Select the box
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    await page.waitForTimeout(300)
    await expect(page.locator('text=[W] Move')).toBeVisible()

    // Click on empty space (corner)
    await canvas.click({ position: { x: box.width * 0.1, y: box.height * 0.1 } })
    await page.waitForTimeout(300)

    // Should show confirm button for new placement
    await expect(page.getByText('Confirm (Enter)')).toBeVisible({ timeout: 5000 })
  })
})

// =============================================================================
// Label Types (Solid/Empty)
// =============================================================================

test.describe('Label Types', () => {
  test.beforeEach(async ({ app }) => {
    await app.goto()
    await app.createProject(`Label Test ${Date.now()}`)
    await app.dismissToast()
    await app.selectMode('Primitive')
  })

  test('should place solid primitive by default (blue)', async ({ app, page }) => {
    const canvas = app.canvas
    const box = await canvas.boundingBox()

    // Default label should be solid (uses ring-solid class when selected)
    await expect(page.locator('button:has-text("Solid")')).toHaveClass(/ring-solid|border-solid/)

    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await expect(page.getByText('Confirm (Enter)')).toBeVisible({ timeout: 5000 })
    await page.keyboard.press('Enter')
    await page.waitForTimeout(300)

    await page.screenshot({ path: 'test-results/label-solid.png' })
  })

  test('should switch to empty label (orange)', async ({ app, page }) => {
    // Click Empty button in label panel
    await page.locator('button:has-text("Empty")').click()
    await page.waitForTimeout(100)

    const canvas = app.canvas
    const box = await canvas.boundingBox()

    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await expect(page.getByText('Confirm (Enter)')).toBeVisible({ timeout: 5000 })
    await page.keyboard.press('Enter')
    await page.waitForTimeout(300)

    await page.screenshot({ path: 'test-results/label-empty.png' })
  })

  test('should place primitives with different labels', async ({ app, page }) => {
    const canvas = app.canvas
    const box = await canvas.boundingBox()
    if (!box) return

    // Place solid box
    await canvas.click({ position: { x: box.width * 0.3, y: box.height / 2 } })
    await page.keyboard.press('Enter')
    await page.waitForTimeout(200)

    // Switch to empty
    await page.locator('button:has-text("Empty")').click()
    await page.waitForTimeout(100)

    // Place empty box
    await canvas.click({ position: { x: box.width * 0.7, y: box.height / 2 } })
    await page.keyboard.press('Enter')
    await page.waitForTimeout(200)

    await page.screenshot({ path: 'test-results/label-both.png' })
  })
})

// =============================================================================
// Primitive Type Switching
// =============================================================================

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

    const positions = [
      { x: canvasBox.width * 0.25, y: canvasBox.height * 0.25 },
      { x: canvasBox.width * 0.75, y: canvasBox.height * 0.25 },
      { x: canvasBox.width * 0.25, y: canvasBox.height * 0.75 },
      { x: canvasBox.width * 0.75, y: canvasBox.height * 0.75 },
    ]

    // Box (default) - B key
    await page.keyboard.press('b')
    await page.waitForTimeout(100)
    await canvas.click({ position: positions[0] })
    await expect(page.getByText('Confirm (Enter)')).toBeVisible({ timeout: 5000 })
    await page.keyboard.press('Enter')
    await page.waitForTimeout(300)

    // Sphere - O key
    await page.keyboard.press('o')
    await page.waitForTimeout(100)
    await canvas.click({ position: positions[1] })
    await expect(page.getByText('Confirm (Enter)')).toBeVisible({ timeout: 5000 })
    await page.keyboard.press('Enter')
    await page.waitForTimeout(300)

    // Cylinder - C key
    await page.keyboard.press('c')
    await page.waitForTimeout(100)
    await canvas.click({ position: positions[2] })
    await expect(page.getByText('Confirm (Enter)')).toBeVisible({ timeout: 5000 })
    await page.keyboard.press('Enter')
    await page.waitForTimeout(300)

    // Halfspace - H key
    await page.keyboard.press('h')
    await page.waitForTimeout(100)
    await canvas.click({ position: positions[3] })
    await expect(page.getByText('Confirm (Enter)')).toBeVisible({ timeout: 5000 })

    await page.screenshot({ path: 'test-results/type-switch-all.png' })
  })
})

// =============================================================================
// First Click After Mode Selection
// =============================================================================

test.describe('First Click After Mode Selection', () => {
  test('should place primitive on first click after selecting primitive mode', async ({ app, page }) => {
    await app.goto()
    await app.createProject(`First Click Test ${Date.now()}`)
    await app.dismissToast()

    await expect(app.getModeButton('Orbit')).toHaveClass(/bg-blue-600/)
    await app.selectMode('Primitive')
    await expect(app.getModeButton('Primitive')).toHaveClass(/bg-blue-600/)

    const canvas = app.canvas
    const box = await canvas.boundingBox()
    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }

    await expect(page.getByText('Confirm (Enter)')).toBeVisible({ timeout: 5000 })
  })

  test('should place primitive after switching modes multiple times', async ({ app, page }) => {
    await app.goto()
    await app.createProject(`Mode Switch Test ${Date.now()}`)
    await app.dismissToast()

    const canvas = app.canvas
    const box = await canvas.boundingBox()

    await app.selectMode('Primitive')
    await app.selectMode('Orbit')
    await app.selectMode('Primitive')

    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }

    await expect(page.getByText('Confirm (Enter)')).toBeVisible({ timeout: 5000 })
  })

  test('should place primitive without moving mouse first', async ({ app, page }) => {
    await app.goto()
    await app.createProject(`No Mouse Move Test ${Date.now()}`)
    await app.dismissToast()

    await page.keyboard.press('p')
    await expect(app.getModeButton('Primitive')).toHaveClass(/bg-blue-600/)

    const canvas = app.canvas
    const box = await canvas.boundingBox()
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
    }

    await expect(page.getByText('Confirm (Enter)')).toBeVisible({ timeout: 5000 })
  })
})

// =============================================================================
// Transform Mode Indicators
// =============================================================================

test.describe('Transform Mode Indicators', () => {
  test.beforeEach(async ({ app, page }) => {
    await app.goto()
    await app.createProject(`Indicator Test ${Date.now()}`)
    await app.dismissToast()
    await app.selectMode('Primitive')

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

// =============================================================================
// Deselect and Escape Behavior
// =============================================================================

test.describe('Deselect Behavior', () => {
  test.beforeEach(async ({ app, page }) => {
    await app.goto()
    await app.createProject(`Deselect Test ${Date.now()}`)
    await app.dismissToast()
    await app.selectMode('Primitive')

    const canvas = app.canvas
    const box = await canvas.boundingBox()
    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)
  })

  test('should deselect with Escape and allow new placement', async ({ app, page }) => {
    const canvas = app.canvas
    const box = await canvas.boundingBox()

    // Select primitive
    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await page.waitForTimeout(300)
    await expect(page.locator('text=[W] Move')).toBeVisible()

    // Escape deselects
    await page.keyboard.press('Escape')
    await page.waitForTimeout(200)

    // Re-enter primitive mode if needed
    await app.selectMode('Primitive')
    await page.waitForTimeout(200)

    // Click elsewhere to place new
    if (box) {
      await canvas.click({ position: { x: box.width / 4, y: box.height / 4 } })
    }

    await expect(page.getByText('Confirm (Enter)')).toBeVisible({ timeout: 5000 })
  })
})
