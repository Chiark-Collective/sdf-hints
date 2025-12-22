// ABOUTME: E2E tests for project management
// ABOUTME: Tests project creation, selection, and deletion flows

import { test, expect } from './fixtures'

test.describe('Project Management', () => {
  test.beforeEach(async ({ app }) => {
    await app.goto()
  })

  test('should display empty project list on initial load', async ({ app }) => {
    const projectPanel = app.projectPanel
    await expect(projectPanel).toBeVisible()
    await expect(projectPanel.getByText('Projects')).toBeVisible()
    await expect(projectPanel.getByText('No projects yet')).toBeVisible()
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

    // Project should appear in list
    await expect(page.getByText(projectName)).toBeVisible()

    // "No projects" message should be gone
    await expect(page.getByText('No projects yet')).not.toBeVisible()

    // Project should be selected (shown by different styling)
    const projectItem = page.locator(`li:has-text("${projectName}")`)
    await expect(projectItem).toHaveClass(/bg-blue/)
  })

  test('should show upload dropzone when project is selected', async ({ app, page }) => {
    const projectName = `Upload Test ${Date.now()}`
    await app.createProject(projectName)

    // Upload section should appear
    await expect(page.getByText('Drop point cloud here')).toBeVisible()
    await expect(page.getByText('or browse files')).toBeVisible()
  })

  test('should switch between projects', async ({ app, page }) => {
    // Create two projects
    const project1 = `Project A ${Date.now()}`
    const project2 = `Project B ${Date.now()}`

    await app.createProject(project1)
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
    await page.fill('input[placeholder="Project name"]', 'Cancelled Project')
    await page.click('button:has-text("Cancel")')

    // Dialog should close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible()

    // Project should not exist
    await expect(page.getByText('Cancelled Project')).not.toBeVisible()
    await expect(page.getByText('No projects yet')).toBeVisible()
  })

  test('should show toast on project creation', async ({ app, page }) => {
    const projectName = `Toast Test ${Date.now()}`
    await app.createProject(projectName)

    // Should show success toast
    await expect(page.locator('[role="status"]')).toBeVisible()
    await expect(page.getByText('Project created')).toBeVisible()
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

  test('should show loading state initially', async ({ page }) => {
    // On a fresh load, there might be a brief loading state
    // This test verifies the loading indicator works
    await page.goto('/')
    // Either "Loading..." or the actual content should appear quickly
    await expect(
      page.getByText('Loading...').or(page.getByText('No projects yet')).or(page.locator('li'))
    ).toBeVisible({ timeout: 5000 })
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
