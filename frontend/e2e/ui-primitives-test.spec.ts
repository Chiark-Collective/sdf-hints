// ABOUTME: Tests for primitive placement via UI buttons
// ABOUTME: Validates that clicking UI buttons (not just keyboard) works for all primitive types

import { test, expect } from './fixtures'

test.describe('Primitive Placement via UI Buttons', () => {
  test.beforeEach(async ({ app }) => {
    await app.goto()
    await app.createProject(`UI Primitive Test ${Date.now()}`)
    await app.dismissToast()
    await app.selectMode('Primitive')
  })

  test('should place sphere via UI button click', async ({ app, page }) => {
    // Click the Sphere button in the UI panel
    await page.locator('button:has-text("Sphere")').click()
    await page.waitForTimeout(200)

    // Now click on canvas to place
    const canvas = app.canvas
    const box = await canvas.boundingBox()
    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }

    // Should see confirm button
    await expect(page.getByText('Confirm (Enter)')).toBeVisible({ timeout: 5000 })
    await page.screenshot({ path: 'test-results/sphere-ui-placement.png' })
  })

  test('should place halfspace via UI button click', async ({ app, page }) => {
    // Click the Half-space button in the UI panel
    await page.locator('button:has-text("Half-space")').click()
    await page.waitForTimeout(200)

    // Now click on canvas to place
    const canvas = app.canvas
    const box = await canvas.boundingBox()
    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }

    // Should see confirm button
    await expect(page.getByText('Confirm (Enter)')).toBeVisible({ timeout: 5000 })
    await page.screenshot({ path: 'test-results/halfspace-ui-placement.png' })
  })

  test('should place cylinder via UI button click', async ({ app, page }) => {
    // Click the Cylinder button in the UI panel
    await page.locator('button:has-text("Cylinder")').click()
    await page.waitForTimeout(200)

    // Now click on canvas to place
    const canvas = app.canvas
    const box = await canvas.boundingBox()
    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }

    // Should see confirm button
    await expect(page.getByText('Confirm (Enter)')).toBeVisible({ timeout: 5000 })
    await page.screenshot({ path: 'test-results/cylinder-ui-placement.png' })
  })

  test('should place box via UI button click', async ({ app, page }) => {
    // Click the Box button in the UI panel (use role=radio to target the toggle button specifically)
    await page.getByRole('radio', { name: 'Box' }).click()
    await page.waitForTimeout(200)

    // Now click on canvas to place
    const canvas = app.canvas
    const box = await canvas.boundingBox()
    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }

    // Should see confirm button
    await expect(page.getByText('Confirm (Enter)')).toBeVisible({ timeout: 5000 })
    await page.screenshot({ path: 'test-results/box-ui-placement.png' })
  })
})
