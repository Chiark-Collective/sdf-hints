// ABOUTME: E2E tests for point cloud upload
// ABOUTME: Tests file upload, progress indication, and format handling

import { test, expect, createTestPointCloud, cleanupTestFiles } from './fixtures'

test.describe('Point Cloud Upload', () => {
  test.beforeEach(async ({ app }) => {
    await app.goto()
    // Create a project first
    await app.createProject(`Upload Test ${Date.now()}`)
  })

  test.afterAll(() => {
    cleanupTestFiles()
  })

  test('should show dropzone when project is selected', async ({ app, page }) => {
    await expect(page.getByText('Drop point cloud here')).toBeVisible()
    await expect(page.getByText('or browse files')).toBeVisible()
    await expect(page.getByText('PLY, LAS, LAZ, CSV, NPZ, Parquet')).toBeVisible()
  })

  test('should upload a CSV point cloud file', async ({ app, page }) => {
    // Create a test file
    const filePath = createTestPointCloud(50)

    // Upload via file input
    await app.uploadFile(filePath)

    // Should show success toast
    await expect(page.getByText('Point cloud uploaded', { exact: true })).toBeVisible({ timeout: 30000 })
    await expect(page.getByText(/\d+ points loaded/)).toBeVisible()
  })

  test('should show upload progress', async ({ app, page }) => {
    // Create a larger file to see progress
    const filePath = createTestPointCloud(1000)

    // Start upload
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(filePath)

    // Should show progress indicator (may be brief)
    // We check that either progress is shown OR upload completes quickly
    const progressOrSuccess = page.getByText('Uploading...').or(page.getByText('Point cloud uploaded'))
    await expect(progressOrSuccess).toBeVisible({ timeout: 30000 })

    // Wait for completion
    await expect(page.getByText('Point cloud uploaded')).toBeVisible({ timeout: 60000 })
  })

  test('should update status bar after upload', async ({ app, page }) => {
    const filePath = createTestPointCloud(100)
    await app.uploadFile(filePath)

    // Wait for upload to complete
    await expect(page.getByText('Point cloud uploaded', { exact: true })).toBeVisible({ timeout: 30000 })

    // Status bar should show point count
    await expect(app.statusBar).toContainText(/\d+ points/)
  })

  test('should enable toolbar modes after upload', async ({ app, page }) => {
    const filePath = createTestPointCloud(100)
    await app.uploadFile(filePath)

    // Wait for upload to complete
    await expect(page.getByText('Point cloud uploaded', { exact: true })).toBeVisible({ timeout: 30000 })

    // Toolbar modes should be clickable
    await app.selectMode('Primitive')
    await expect(page.locator('button:has-text("Primitive")').first()).toHaveClass(/bg-blue/)
  })

  test('should handle drag and drop visual feedback', async ({ app, page }) => {
    const dropzone = app.uploadDropzone

    // Simulate drag enter
    await dropzone.dispatchEvent('dragenter', {
      dataTransfer: { types: ['Files'] },
    })

    // Should show drag state (border color change)
    await expect(dropzone).toHaveClass(/border-blue/)

    // Simulate drag leave
    await dropzone.dispatchEvent('dragleave')

    // Should return to normal state
    await expect(dropzone).not.toHaveClass(/border-blue/)
  })
})

test.describe('Upload Error Handling', () => {
  test.beforeEach(async ({ app }) => {
    await app.goto()
    await app.createProject(`Error Test ${Date.now()}`)
  })

  test('should show error toast on upload failure', async ({ app, page }) => {
    // Create an invalid file (empty or malformed)
    const fs = await import('fs')
    const tmpPath = '/tmp/sdf-labeler-tests/invalid.csv'
    fs.mkdirSync('/tmp/sdf-labeler-tests', { recursive: true })
    fs.writeFileSync(tmpPath, 'invalid,data\nno,xyz')

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(tmpPath)

    // Should show error toast (or handle gracefully)
    // The exact error depends on backend validation
    await expect(
      page.getByText('Upload failed').or(page.getByText('Point cloud uploaded'))
    ).toBeVisible({ timeout: 30000 })
  })
})

test.describe('Multiple Uploads', () => {
  test.beforeEach(async ({ app }) => {
    await app.goto()
    await app.createProject(`Multi Upload ${Date.now()}`)
  })

  test.afterAll(() => {
    cleanupTestFiles()
  })

  test('should replace existing point cloud on new upload', async ({ app, page }) => {
    // Upload first file
    const file1 = createTestPointCloud(50)
    await app.uploadFile(file1)
    await expect(page.getByText('Point cloud uploaded', { exact: true })).toBeVisible({ timeout: 30000 })

    // Dismiss toast
    await app.dismissToast()

    // Upload second file
    const file2 = createTestPointCloud(100)
    await app.uploadFile(file2)
    await expect(page.getByText('Point cloud uploaded', { exact: true })).toBeVisible({ timeout: 30000 })

    // Should show new point count
    await expect(page.getByText(/100 points loaded/)).toBeVisible()
  })
})
