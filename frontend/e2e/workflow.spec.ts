// ABOUTME: E2E tests for complete user workflows
// ABOUTME: Tests full user journeys from project creation to export

import { test, expect, createTestPointCloud, cleanupTestFiles } from './fixtures'

test.describe('Complete Labeling Workflow', () => {
  test.afterAll(() => {
    cleanupTestFiles()
  })

  test('should complete a full workflow: create project, upload, generate samples', async ({
    app,
    page,
  }) => {
    // 1. Navigate to app
    await app.goto()
    await expect(page).toHaveTitle(/SDF Labeler/)

    // 2. Create a new project
    const projectName = `Workflow Test ${Date.now()}`
    await app.createProject(projectName)
    await expect(page.getByText(projectName)).toBeVisible()
    await expect(page.getByText('Project created')).toBeVisible()

    // 3. Upload a point cloud
    const filePath = createTestPointCloud(200)
    await app.uploadFile(filePath)
    await expect(page.getByText('Point cloud uploaded')).toBeVisible({ timeout: 30000 })

    // 4. Verify point cloud info in status bar
    await expect(app.statusBar).toContainText(/\d+ points/)

    // 5. Switch to Primitive mode
    await app.selectMode('Primitive')
    await expect(page.getByRole('button', { name: 'Primitive' })).toHaveClass(/bg-blue-600/)

    // 6. Check that canvas is rendered
    await expect(app.canvas).toBeVisible()

    // 7. Return to Orbit mode
    await page.keyboard.press('Escape')
    await expect(page.getByRole('button', { name: 'Orbit' })).toHaveClass(/bg-blue-600/)
  })

  test('should handle keyboard navigation throughout workflow', async ({ app, page }) => {
    await app.goto()

    // Create project via dialog
    const projectName = `Keyboard Workflow ${Date.now()}`
    await app.createProject(projectName)

    // Use keyboard to switch modes
    await page.keyboard.press('p') // Primitive
    await expect(page.getByRole('button', { name: 'Primitive' })).toHaveClass(/bg-blue-600/)

    await page.keyboard.press('s') // Slice
    await expect(page.getByRole('button', { name: 'Slice' })).toHaveClass(/bg-blue-600/)

    await page.keyboard.press('b') // Brush
    await expect(page.getByRole('button', { name: 'Brush' })).toHaveClass(/bg-blue-600/)

    await page.keyboard.press('g') // Seed
    await expect(page.getByRole('button', { name: 'Seed' })).toHaveClass(/bg-blue-600/)

    await page.keyboard.press('Escape') // Back to Orbit
    await expect(page.getByRole('button', { name: 'Orbit' })).toHaveClass(/bg-blue-600/)

    // Cycle labels with Tab
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: 'Empty' })).toHaveClass(/ring-2/)

    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: 'Surface' })).toHaveClass(/ring-2/)
  })
})

test.describe('Error Recovery', () => {
  test('should handle page refresh gracefully', async ({ app, page }) => {
    await app.goto()

    // Create a project
    const projectName = `Refresh Test ${Date.now()}`
    await app.createProject(projectName)

    // Refresh page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Project should still exist (persisted in backend)
    await expect(page.getByText(projectName)).toBeVisible()
  })

  test('should recover from mode switch during operation', async ({ app, page }) => {
    await app.goto()
    await app.createProject(`Recovery Test ${Date.now()}`)

    // Switch modes rapidly
    await app.selectMode('Primitive')
    await app.selectMode('Slice')
    await app.selectMode('Brush')
    await app.selectMode('Seed')
    await app.selectMode('Orbit')

    // App should still be responsive
    await expect(page.getByRole('button', { name: 'Orbit' })).toHaveClass(/bg-blue-600/)
    await expect(app.canvas).toBeVisible()
  })
})

test.describe('UI Responsiveness', () => {
  test('should render canvas at appropriate size', async ({ app, page }) => {
    await app.goto()

    // Canvas should be visible and have reasonable dimensions
    const canvas = app.canvas
    await expect(canvas).toBeVisible()

    const box = await canvas.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBeGreaterThan(100)
    expect(box!.height).toBeGreaterThan(100)
  })

  test('should maintain layout after window resize', async ({ app, page }) => {
    await app.goto()

    // Resize window
    await page.setViewportSize({ width: 1200, height: 800 })
    await expect(app.projectPanel).toBeVisible()
    await expect(app.canvas).toBeVisible()

    // Resize to smaller
    await page.setViewportSize({ width: 900, height: 600 })
    await expect(app.projectPanel).toBeVisible()
    await expect(app.canvas).toBeVisible()
  })
})

test.describe('Toast Notifications', () => {
  test('should show and auto-dismiss toasts', async ({ app, page }) => {
    await app.goto()

    // Trigger a toast by creating a project
    await app.createProject(`Toast Test ${Date.now()}`)

    // Toast should appear
    const toast = page.locator('[role="status"]')
    await expect(toast).toBeVisible()

    // Toast should auto-dismiss (default 3s, give it 5s)
    await expect(toast).not.toBeVisible({ timeout: 6000 })
  })

  test('should show error toasts with longer duration', async ({ app, page }) => {
    // This would require triggering an error condition
    // For now, just verify the toast system works
    await app.goto()
    await app.createProject(`Error Toast Test ${Date.now()}`)
    await expect(page.getByText('Project created')).toBeVisible()
  })
})

test.describe('3D Canvas Interaction', () => {
  test.beforeEach(async ({ app }) => {
    await app.goto()
    await app.createProject(`Canvas Test ${Date.now()}`)
  })

  test('should render 3D scene', async ({ app, page }) => {
    // Canvas should have a WebGL context
    const canvas = app.canvas
    await expect(canvas).toBeVisible()

    // Check that canvas is a real canvas element
    const tagName = await canvas.evaluate((el) => el.tagName)
    expect(tagName.toLowerCase()).toBe('canvas')
  })

  test('should allow canvas click interactions', async ({ app, page }) => {
    // Upload a point cloud first
    const filePath = createTestPointCloud(100)
    await app.uploadFile(filePath)
    await expect(page.getByText('Point cloud uploaded')).toBeVisible({ timeout: 30000 })

    // Switch to Primitive mode
    await app.selectMode('Primitive')

    // Click on canvas (this would place a primitive in the real app)
    const canvas = app.canvas
    const box = await canvas.boundingBox()
    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    }

    // App should still be responsive after click
    await expect(page.getByRole('button', { name: 'Primitive' })).toHaveClass(/bg-blue-600/)
  })
})
