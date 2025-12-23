// ABOUTME: E2E tests for seed placement, deletion, and propagation
// ABOUTME: Validates seed mode functionality including placing, removing, and propagating seeds

import { test, expect, createTestPointCloud, cleanupTestFiles } from './fixtures'

test.describe('Seed Mode', () => {
  test.beforeEach(async ({ app }) => {
    await app.goto()
    await app.createProject(`Seed Test ${Date.now()}`)
    await app.dismissToast()
  })

  test.afterAll(() => {
    cleanupTestFiles()
  })

  test('should switch to seed mode', async ({ app, page }) => {
    await app.selectMode('Seed')
    await expect(app.getModeButton('Seed')).toHaveClass(/bg-blue-600/)
    await expect(page.getByText('Seeds placed')).toBeVisible()
  })

  test('should show seed count when placing seeds', async ({ app, page }) => {
    await app.selectMode('Seed')

    // Initially 0 seeds - look for the specific seed count display
    const seedCountDisplay = page.locator('.text-white.font-medium').filter({ hasText: /^[0-9]+$/ })
    await expect(seedCountDisplay).toHaveText('0')

    // Click on canvas to place seed
    const canvas = app.canvas
    const box = await canvas.boundingBox()
    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await page.waitForTimeout(300)

    // Should show 1 seed
    await expect(seedCountDisplay).toHaveText('1')
  })

  test('should delete individual seeds with × button', async ({ app, page }) => {
    await app.selectMode('Seed')

    const canvas = app.canvas
    const box = await canvas.boundingBox()

    // Seed count display
    const seedCountDisplay = page.locator('.text-white.font-medium').filter({ hasText: /^[0-9]+$/ })

    // Place first seed
    if (box) {
      await canvas.click({ position: { x: box.width * 0.3, y: box.height / 2 } })
    }
    await page.waitForTimeout(300)

    // Place second seed
    if (box) {
      await canvas.click({ position: { x: box.width * 0.7, y: box.height / 2 } })
    }
    await page.waitForTimeout(300)

    // Should have 2 seeds
    await expect(seedCountDisplay).toHaveText('2')

    // Find and click the first × delete button in the seed list area
    const seedList = page.locator('.max-h-24.overflow-y-auto')
    const deleteButtons = seedList.locator('button:has-text("×")')
    await expect(deleteButtons.first()).toBeVisible()
    await deleteButtons.first().click()
    await page.waitForTimeout(200)

    // Should have 1 seed now
    await expect(seedCountDisplay).toHaveText('1')

    await page.screenshot({ path: 'test-results/seed-deletion.png' })
  })

  test('should clear all seeds with Clear Seeds button', async ({ app, page }) => {
    await app.selectMode('Seed')

    const canvas = app.canvas
    const box = await canvas.boundingBox()

    // Seed count display
    const seedCountDisplay = page.locator('.text-white.font-medium').filter({ hasText: /^[0-9]+$/ })

    // Place multiple seeds
    if (box) {
      await canvas.click({ position: { x: box.width * 0.3, y: box.height * 0.3 } })
      await page.waitForTimeout(100)
      await canvas.click({ position: { x: box.width * 0.7, y: box.height * 0.3 } })
      await page.waitForTimeout(100)
      await canvas.click({ position: { x: box.width * 0.5, y: box.height * 0.7 } })
    }
    await page.waitForTimeout(300)

    // Should have 3 seeds
    await expect(seedCountDisplay).toHaveText('3')

    // Click Clear Seeds button
    const clearButton = page.getByRole('button', { name: 'Clear Seeds' })
    await clearButton.click()
    await page.waitForTimeout(200)

    // Should have 0 seeds
    await expect(seedCountDisplay).toHaveText('0')

    await page.screenshot({ path: 'test-results/seed-clear-all.png' })
  })

  test('should propagate seeds and create constraint', async ({ app, page }) => {
    // Need point cloud for propagation
    const filePath = createTestPointCloud(100)
    await app.uploadFile(filePath)
    await expect(app.getToastTitle('Point cloud uploaded')).toBeVisible({ timeout: 30000 })
    await app.dismissToast()

    await app.selectMode('Seed')

    const canvas = app.canvas
    const box = await canvas.boundingBox()

    // Seed count display
    const seedCountDisplay = page.locator('.text-white.font-medium').filter({ hasText: /^[0-9]+$/ })

    // Place a seed
    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await page.waitForTimeout(300)

    // Verify seed was placed
    await expect(seedCountDisplay).toHaveText('1')

    // Click Propagate button
    const propagateButton = page.getByRole('button', { name: 'Propagate' })
    await expect(propagateButton).toBeEnabled()
    await propagateButton.click()
    await page.waitForTimeout(500)

    // Seeds should be cleared after propagation
    await expect(seedCountDisplay).toHaveText('0')

    // Should see constraint in list (Propagated Seeds section)
    await expect(page.getByText('Propagated Seeds')).toBeVisible()

    await page.screenshot({ path: 'test-results/seed-propagated.png' })
  })

  test('should delete propagated seed constraint from constraint list', async ({ app, page }) => {
    // Need point cloud for propagation
    const filePath = createTestPointCloud(100)
    await app.uploadFile(filePath)
    await expect(app.getToastTitle('Point cloud uploaded')).toBeVisible({ timeout: 30000 })
    await app.dismissToast()

    await app.selectMode('Seed')

    const canvas = app.canvas
    const box = await canvas.boundingBox()

    // Place and propagate a seed
    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await page.waitForTimeout(300)
    await page.getByRole('button', { name: 'Propagate' }).click()
    await page.waitForTimeout(500)

    // Dismiss any remaining toasts that might block interaction
    try {
      await app.dismissToast()
    } catch {
      // No toast to dismiss
    }
    await page.waitForTimeout(300)

    // Should see constraint - find the Propagated Seeds section
    const propagatedSection = page.locator('div').filter({ hasText: 'Propagated Seeds' }).locator('ul.space-y-1')
    await expect(propagatedSection).toBeVisible({ timeout: 5000 })

    // Get the constraint item within this section
    const constraintItems = propagatedSection.locator('li')
    await expect(constraintItems.first()).toBeVisible()

    // Get count before
    const countBefore = await constraintItems.count()
    expect(countBefore).toBe(1)

    // Click delete button using JavaScript to bypass all visibility checks
    const deleteButton = constraintItems.first().locator('button')
    await deleteButton.evaluate((el) => (el as HTMLElement).click())
    await page.waitForTimeout(500)

    // After deletion, the "Propagated Seeds" section should be gone (no more constraints of this type)
    await expect(propagatedSection).not.toBeVisible({ timeout: 5000 })

    await page.screenshot({ path: 'test-results/seed-constraint-deleted.png' })
  })
})
