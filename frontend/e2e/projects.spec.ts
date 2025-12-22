// ABOUTME: E2E tests for project management
// ABOUTME: Tests project creation, selection, and deletion flows

import { test, expect } from './fixtures'

test.describe('Project Management', () => {
  test.beforeEach(async ({ app }) => {
    await app.goto()
  })

  test('should display project panel on load', async ({ app }) => {
    const projectPanel = app.projectPanel
    await expect(projectPanel).toBeVisible()
    await expect(projectPanel.getByText('Projects')).toBeVisible()
  })

  test('should open create project dialog', async ({ app, page }) => {
    await app.openCreateProjectDialog()

    // Dialog should be visible
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('New Project')).toBeVisible()
    await expect(page.locator('input[placeholder="Project name"]')).toBeVisible()
  })

  test('should create a new project', async ({ app, page }) => {
    const projectName = `Test Project ${Date.now()}`

    await app.createProject(projectName)

    // Project should appear in list (use specific selector)
    await expect(app.getProjectInList(projectName)).toBeVisible()

    // Project should be selected (shown by different styling)
    const projectItem = app.getProjectInList(projectName)
    await expect(projectItem).toHaveClass(/bg-blue/)
  })

  test('should show upload dropzone when project is selected', async ({ app, page }) => {
    const projectName = `Upload Test ${Date.now()}`
    await app.createProject(projectName)

    // Switch to upload tab (default is now Demo Data)
    await app.switchToUploadTab()

    // Upload section should appear
    await expect(page.getByText('Drop point cloud here')).toBeVisible()
    await expect(page.getByText('or browse files')).toBeVisible()
  })

  test('should switch between projects', async ({ app, page }) => {
    // Create two projects
    const project1 = `Project A ${Date.now()}`
    const project2 = `Project B ${Date.now()}`

    await app.createProject(project1)
    await app.dismissToast()
    await app.createProject(project2)

    // Project 2 should be selected (last created)
    let selectedItem = page.locator('li[class*="bg-blue"]')
    await expect(selectedItem).toContainText(project2)

    // Click on project 1
    await app.selectProject(project1)

    // Project 1 should now be selected
    selectedItem = page.locator('li[class*="bg-blue"]')
    await expect(selectedItem).toContainText(project1)
  })

  test('should not create project with empty name', async ({ app, page }) => {
    await app.openCreateProjectDialog()

    // Submit button should be disabled with empty input
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeDisabled()

    // Try clicking anyway (should not close dialog)
    await submitButton.click({ force: true })
    await expect(page.locator('[role="dialog"]')).toBeVisible()
  })

  test('should cancel project creation', async ({ app, page }) => {
    await app.openCreateProjectDialog()

    // Fill in name but cancel
    const cancelledName = `Cancelled ${Date.now()}`
    await page.fill('input[placeholder="Project name"]', cancelledName)
    await page.click('button:has-text("Cancel")')

    // Dialog should close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible()

    // Project should not exist in list
    await expect(app.getProjectInList(cancelledName)).not.toBeVisible()
  })

  test('should show toast on project creation', async ({ app }) => {
    const projectName = `Toast Test ${Date.now()}`
    await app.createProject(projectName)

    // Should show success toast (use specific toast title selector)
    await expect(app.getToastTitle('Project created')).toBeVisible()
  })

  test('should close dialog with Escape key', async ({ app, page }) => {
    await app.openCreateProjectDialog()
    await expect(page.locator('[role="dialog"]')).toBeVisible()

    await page.keyboard.press('Escape')

    await expect(page.locator('[role="dialog"]')).not.toBeVisible()
  })
})

test.describe('Project Panel UI', () => {
  test.beforeEach(async ({ app }) => {
    await app.goto()
  })

  test('should show projects panel on load', async ({ app, page }) => {
    // Panel should be visible with projects header
    await expect(app.projectPanel).toBeVisible()
    await expect(app.projectPanel.getByText('Projects')).toBeVisible()
  })

  test('should have proper layout', async ({ app, page }) => {
    // Panel should have correct width class
    await expect(app.projectPanel).toHaveClass(/w-64/)

    // Should have header with "Projects" text
    await expect(app.projectPanel.getByText('Projects')).toBeVisible()

    // Should have create button in header
    await expect(app.createProjectButton).toBeVisible()
  })
})
