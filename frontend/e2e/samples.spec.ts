// ABOUTME: E2E tests for sample generation and visualization
// ABOUTME: Tests sample generation workflow and viewport visualization toggle

import { test, expect, createTestPointCloud, cleanupTestFiles, AppHelper } from './fixtures'
import type { Page } from '@playwright/test'

// Helper to set up a project with a constraint (needed for export section to be visible)
async function setupProjectWithConstraint(app: AppHelper, page: Page) {
  await app.goto()
  await app.createProject(`Sample Test ${Date.now()}`)
  await app.dismissToast()

  // Upload point cloud
  const filePath = createTestPointCloud(100)
  await app.uploadFile(filePath)
  await expect(app.getToastTitle('Point cloud uploaded')).toBeVisible({ timeout: 30000 })
  await app.dismissToast()

  // Place a box primitive to create a constraint
  await app.selectMode('Primitive')
  const canvas = app.canvas
  const box = await canvas.boundingBox()
  if (box) {
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
  }
  await page.keyboard.press('Enter')
  await page.waitForTimeout(500)
}

test.describe('Sample Generation', () => {
  test.afterAll(() => {
    cleanupTestFiles()
  })

  test('should show samples per primitive input when constraints exist', async ({ app, page }) => {
    await setupProjectWithConstraint(app, page)

    // The samples per primitive input should be visible in the export section
    const input = page.locator('#samples-per-primitive')
    await expect(input).toBeVisible()
    await expect(input).toHaveValue('100')
  })

  test('should allow changing samples per primitive value', async ({ app, page }) => {
    await setupProjectWithConstraint(app, page)

    const input = page.locator('#samples-per-primitive')
    await input.fill('200')
    await expect(input).toHaveValue('200')
  })

  test('should clamp samples per primitive to valid range', async ({ app, page }) => {
    await setupProjectWithConstraint(app, page)

    const input = page.locator('#samples-per-primitive')

    // Try setting below minimum
    await input.fill('5')
    await input.blur()
    // Should clamp to 10
    await expect(input).toHaveValue('10')

    // Try setting above maximum
    await input.fill('99999')
    await input.blur()
    // Should clamp to 10000
    await expect(input).toHaveValue('10000')
  })
})

test.describe('Sample Generation with Constraints', () => {
  test.afterAll(() => {
    cleanupTestFiles()
  })

  test('should generate samples from box constraint', async ({ app, page }) => {
    await app.goto()
    await app.createProject(`Sample Gen Test ${Date.now()}`)
    await app.dismissToast()

    // Upload point cloud
    const filePath = createTestPointCloud(100)
    await app.uploadFile(filePath)
    await expect(app.getToastTitle('Point cloud uploaded')).toBeVisible({ timeout: 30000 })
    await app.dismissToast()

    // Switch to Primitive mode and place a box
    await app.selectMode('Primitive')
    const canvas = app.canvas
    const box = await canvas.boundingBox()

    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }

    // Confirm the primitive
    await expect(page.getByText('Confirm (Enter)')).toBeVisible({ timeout: 5000 })
    await page.keyboard.press('Enter')
    await expect(page.getByText('Confirm (Enter)')).not.toBeVisible({ timeout: 5000 })

    // Click Generate Samples button
    const generateButton = page.getByRole('button', { name: 'Generate Samples' })
    await expect(generateButton).toBeVisible()
    await generateButton.click()

    // Wait for generation to complete - should show sample count
    await expect(page.getByText(/\d+ samples generated/)).toBeVisible({ timeout: 10000 })

    await page.screenshot({ path: 'test-results/samples-generated.png' })
  })
})

test.describe('Sample Visualization Toggle', () => {
  test.afterAll(() => {
    cleanupTestFiles()
  })

  test('should show visualization toggle after generating samples', async ({ app, page }) => {
    await app.goto()
    await app.createProject(`Viz Toggle Test ${Date.now()}`)
    await app.dismissToast()

    // Upload point cloud
    const filePath = createTestPointCloud(100)
    await app.uploadFile(filePath)
    await expect(app.getToastTitle('Point cloud uploaded')).toBeVisible({ timeout: 30000 })
    await app.dismissToast()

    // Place a box primitive
    await app.selectMode('Primitive')
    const canvas = app.canvas
    const box = await canvas.boundingBox()

    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)

    // Generate samples
    const generateButton = page.getByRole('button', { name: 'Generate Samples' })
    await generateButton.click()
    await expect(page.getByText(/\d+ samples generated/)).toBeVisible({ timeout: 10000 })

    // The "Show samples in viewport" toggle should now be visible
    const toggle = page.getByText('Show samples in viewport')
    await expect(toggle).toBeVisible()

    await page.screenshot({ path: 'test-results/viz-toggle-visible.png' })
  })

  test('should toggle sample visualization on and off', async ({ app, page }) => {
    await app.goto()
    await app.createProject(`Viz Toggle Interaction ${Date.now()}`)
    await app.dismissToast()

    // Upload point cloud
    const filePath = createTestPointCloud(100)
    await app.uploadFile(filePath)
    await expect(app.getToastTitle('Point cloud uploaded')).toBeVisible({ timeout: 30000 })
    await app.dismissToast()

    // Place a box primitive
    await app.selectMode('Primitive')
    const canvas = app.canvas
    const box = await canvas.boundingBox()

    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)

    // Generate samples
    const generateButton = page.getByRole('button', { name: 'Generate Samples' })
    await generateButton.click()
    await expect(page.getByText(/\d+ samples generated/)).toBeVisible({ timeout: 10000 })

    // Find and click the checkbox
    const checkbox = page.locator('label:has-text("Show samples in viewport") input[type="checkbox"]')
    await expect(checkbox).toBeVisible()

    // Initially unchecked
    await expect(checkbox).not.toBeChecked()

    // Check it
    await checkbox.check()
    await expect(checkbox).toBeChecked()

    await page.screenshot({ path: 'test-results/samples-viz-on.png' })

    // Uncheck it
    await checkbox.uncheck()
    await expect(checkbox).not.toBeChecked()

    await page.screenshot({ path: 'test-results/samples-viz-off.png' })
  })

  test('should fetch samples when visualization is enabled', async ({ app, page }) => {
    await app.goto()
    await app.createProject(`Viz Fetch Test ${Date.now()}`)
    await app.dismissToast()

    // Upload point cloud
    const filePath = createTestPointCloud(100)
    await app.uploadFile(filePath)
    await expect(app.getToastTitle('Point cloud uploaded')).toBeVisible({ timeout: 30000 })
    await app.dismissToast()

    // Place a box primitive
    await app.selectMode('Primitive')
    const canvas = app.canvas
    const box = await canvas.boundingBox()

    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)

    // Generate samples
    const generateButton = page.getByRole('button', { name: 'Generate Samples' })
    await generateButton.click()
    await expect(page.getByText(/\d+ samples generated/)).toBeVisible({ timeout: 10000 })

    // Set up request interception to verify API call
    let samplesFetched = false
    page.on('request', (request) => {
      if (request.url().includes('/samples') && request.method() === 'GET') {
        samplesFetched = true
      }
    })

    // Enable visualization
    const checkbox = page.locator('label:has-text("Show samples in viewport") input[type="checkbox"]')
    await checkbox.check()

    // Wait a bit for the API call
    await page.waitForTimeout(1000)

    // Verify samples were fetched
    expect(samplesFetched).toBe(true)
  })
})

test.describe('Export After Sample Generation', () => {
  test.afterAll(() => {
    cleanupTestFiles()
  })

  test('should show export button after generating samples', async ({ app, page }) => {
    await app.goto()
    await app.createProject(`Export Test ${Date.now()}`)
    await app.dismissToast()

    // Upload point cloud
    const filePath = createTestPointCloud(100)
    await app.uploadFile(filePath)
    await expect(app.getToastTitle('Point cloud uploaded')).toBeVisible({ timeout: 30000 })
    await app.dismissToast()

    // Place a box primitive
    await app.selectMode('Primitive')
    const canvas = app.canvas
    const box = await canvas.boundingBox()

    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)

    // Export button should NOT be visible before generation
    const exportButton = page.getByRole('button', { name: 'Export Parquet' })
    await expect(exportButton).not.toBeVisible()

    // Generate samples
    const generateButton = page.getByRole('button', { name: 'Generate Samples' })
    await generateButton.click()
    await expect(page.getByText(/\d+ samples generated/)).toBeVisible({ timeout: 10000 })

    // Export button should now be visible
    await expect(exportButton).toBeVisible()

    await page.screenshot({ path: 'test-results/export-button-visible.png' })
  })
})
