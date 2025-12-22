// ABOUTME: Playwright test fixtures and helpers
// ABOUTME: Provides reusable test utilities for E2E tests

import { test as base, expect, type Page, type Locator } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

// Extended test fixture with app helpers
export const test = base.extend<{
  app: AppHelper
}>({
  app: async ({ page }, use) => {
    const app = new AppHelper(page)
    await use(app)
  },
})

export { expect }

/**
 * Helper class for common app interactions
 */
export class AppHelper {
  constructor(public page: Page) {}

  // Navigation
  async goto() {
    await this.page.goto('/')
    await this.page.waitForLoadState('networkidle')
  }

  // Project Panel
  get projectPanel(): Locator {
    return this.page.locator('.w-64').first()
  }

  get createProjectButton(): Locator {
    return this.projectPanel.getByRole('button').filter({ has: this.page.locator('svg') }).first()
  }

  get projectList(): Locator {
    return this.projectPanel.locator('ul')
  }

  async getProjectItems(): Promise<Locator[]> {
    const items = await this.projectPanel.locator('li').all()
    return items
  }

  // Create project dialog
  async openCreateProjectDialog() {
    await this.createProjectButton.click()
    await this.page.waitForSelector('[role="dialog"]')
  }

  async createProject(name: string) {
    await this.openCreateProjectDialog()
    await this.page.fill('input[placeholder="Project name"]', name)
    await this.page.click('button[type="submit"]')
    // Wait for dialog to close
    await this.page.waitForSelector('[role="dialog"]', { state: 'hidden' })
    // Wait for project to appear in list
    await this.page.waitForSelector(`text=${name}`)
  }

  async selectProject(name: string) {
    await this.page.click(`li:has-text("${name}")`)
  }

  async deleteProject(name: string) {
    const projectItem = this.page.locator(`li:has-text("${name}")`)
    // Hover to show delete button
    await projectItem.hover()
    // Click delete button
    await projectItem.locator('button').click()
    // Confirm deletion (browser dialog)
    this.page.once('dialog', (dialog) => dialog.accept())
  }

  // Toolbar
  get toolbar(): Locator {
    return this.page.locator('[class*="border-b"][class*="border-gray-800"]').filter({ hasText: 'Orbit' }).first()
  }

  async selectMode(mode: 'Orbit' | 'Primitive' | 'Slice' | 'Brush' | 'Seed' | 'Import') {
    await this.toolbar.getByText(mode, { exact: true }).click()
  }

  async getActiveMode(): Promise<string> {
    const activeButton = this.toolbar.locator('button[class*="bg-blue-600"]')
    return (await activeButton.textContent()) || ''
  }

  // Status Bar
  get statusBar(): Locator {
    return this.page.locator('[class*="border-t"][class*="border-gray-800"]').last()
  }

  async getStatusText(): Promise<string> {
    return (await this.statusBar.textContent()) || ''
  }

  // Upload Dropzone
  get uploadDropzone(): Locator {
    return this.page.locator('text=Drop point cloud here').locator('..')
  }

  async uploadFile(filePath: string) {
    const fileInput = this.page.locator('input[type="file"]')
    await fileInput.setInputFiles(filePath)
    // Wait for upload to complete (progress bar disappears)
    await this.page.waitForSelector('text=Uploading...', { state: 'hidden', timeout: 60000 })
  }

  // Label Panel
  get labelPanel(): Locator {
    return this.page.locator('.w-80').first()
  }

  async selectLabel(label: 'Solid' | 'Empty' | 'Surface') {
    await this.labelPanel.getByText(label, { exact: true }).click()
  }

  async getActiveLabel(): Promise<string> {
    const activeButton = this.labelPanel.locator('button[class*="ring-2"]')
    return (await activeButton.textContent()) || ''
  }

  // 3D Canvas
  get canvas(): Locator {
    return this.page.locator('canvas')
  }

  async clickCanvas(x: number, y: number) {
    await this.canvas.click({ position: { x, y } })
  }

  // Toast notifications
  async waitForToast(text: string) {
    await this.page.waitForSelector(`[role="status"]:has-text("${text}")`, { timeout: 5000 })
  }

  async dismissToast() {
    const closeButton = this.page.locator('[role="status"] button')
    if (await closeButton.isVisible()) {
      await closeButton.click()
    }
  }

  // Keyboard shortcuts
  async pressKey(key: string) {
    await this.page.keyboard.press(key)
  }

  async pressKeys(keys: string[]) {
    for (const key of keys) {
      await this.page.keyboard.press(key)
    }
  }
}

/**
 * Create a test point cloud file
 */
export function createTestPointCloud(numPoints: number = 100): string {
  const tmpDir = '/tmp/sdf-labeler-tests'
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true })
  }

  const filePath = path.join(tmpDir, `test-points-${Date.now()}.csv`)

  // Generate CSV content with random points in a unit cube
  let content = 'x,y,z\n'
  for (let i = 0; i < numPoints; i++) {
    const x = Math.random()
    const y = Math.random()
    const z = Math.random()
    content += `${x},${y},${z}\n`
  }

  fs.writeFileSync(filePath, content)
  return filePath
}

/**
 * Clean up test files
 */
export function cleanupTestFiles() {
  const tmpDir = '/tmp/sdf-labeler-tests'
  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true })
  }
}
