// ABOUTME: Debug test for box placement issue
// ABOUTME: Captures screenshots to diagnose rendering problems

import { test, expect } from './fixtures'
import * as fs from 'fs'

test('debug box placement WITHOUT point cloud', async ({ app, page }) => {
  // Fresh load - NO point cloud upload
  await app.goto()

  // Create project but DON'T upload data
  await app.createProject(`Debug No Data ${Date.now()}`)
  await app.dismissToast()

  // Screenshot before selecting primitive mode
  await page.screenshot({ path: 'test-results/debug-nodata-1-before.png' })

  // Select Primitive mode immediately
  await app.selectMode('Primitive')
  await page.waitForTimeout(500)

  // Screenshot after selecting primitive mode
  await page.screenshot({ path: 'test-results/debug-nodata-2-primitive-mode.png' })

  // Move mouse to center of canvas
  const canvas = app.canvas
  const box = await canvas.boundingBox()
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  }
  await page.waitForTimeout(500)

  // Screenshot showing ghost preview
  await page.screenshot({ path: 'test-results/debug-nodata-3-ghost.png' })

  // Click to place
  if (box) {
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
  }
  await page.waitForTimeout(500)

  // Screenshot after click
  await page.screenshot({ path: 'test-results/debug-nodata-4-after-click.png' })

  // Check if Confirm button is visible
  const confirmButton = page.getByRole('button', { name: /Confirm/i })
  const isVisible = await confirmButton.isVisible().catch(() => false)
  console.log('Confirm button visible (no data):', isVisible)

  expect(isVisible).toBe(true)
})

test('debug box placement WITH point cloud', async ({ app, page }) => {
  // Fresh load
  await app.goto()

  // Create project
  await app.createProject(`Debug With Data ${Date.now()}`)
  await app.dismissToast()

  // Upload a point cloud
  await app.switchToUploadTab()
  const tmpPath = '/tmp/debug-test-points.csv'
  let csv = 'x,y,z\n'
  for (let i = 0; i < 50; i++) {
    csv += `${Math.random() * 2 - 1},${Math.random() * 2 - 1},${Math.random() * 2 - 1}\n`
  }
  fs.writeFileSync(tmpPath, csv)
  await app.uploadFile(tmpPath)
  await expect(app.getToastTitle('Point cloud uploaded')).toBeVisible({ timeout: 30000 })
  await app.dismissToast()

  // Select Primitive mode
  await app.selectMode('Primitive')
  await page.waitForTimeout(500)

  // Move mouse and click
  const canvas = app.canvas
  const box = await canvas.boundingBox()
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.waitForTimeout(300)
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
  }
  await page.waitForTimeout(500)

  // Screenshot after click
  await page.screenshot({ path: 'test-results/debug-withdata-after-click.png' })

  const confirmButton = page.getByRole('button', { name: /Confirm/i })
  const isVisible = await confirmButton.isVisible().catch(() => false)
  console.log('Confirm button visible (with data):', isVisible)

  expect(isVisible).toBe(true)
})

test('debug box after page reload', async ({ app, page }) => {
  // Create project and upload data
  await app.goto()
  await app.createProject(`Debug Reload ${Date.now()}`)
  await app.dismissToast()

  await app.switchToUploadTab()
  const tmpPath = '/tmp/debug-test-points.csv'
  let csv = 'x,y,z\n'
  for (let i = 0; i < 50; i++) {
    csv += `${Math.random() * 2 - 1},${Math.random() * 2 - 1},${Math.random() * 2 - 1}\n`
  }
  const fs = await import('fs')
  fs.writeFileSync(tmpPath, csv)
  await app.uploadFile(tmpPath)
  await expect(app.getToastTitle('Point cloud uploaded')).toBeVisible({ timeout: 30000 })

  // Now RELOAD the page
  await page.reload()
  await page.waitForTimeout(1000)

  // Screenshot after reload
  await page.screenshot({ path: 'test-results/debug-reload-1-after-reload.png' })

  // Try to select primitive mode
  await app.selectMode('Primitive')
  await page.waitForTimeout(500)

  await page.screenshot({ path: 'test-results/debug-reload-2-primitive-mode.png' })

  // Move and click
  const canvas = app.canvas
  const box = await canvas.boundingBox()
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.waitForTimeout(300)
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
  }
  await page.waitForTimeout(500)

  await page.screenshot({ path: 'test-results/debug-reload-3-after-click.png' })

  const confirmButton = page.getByRole('button', { name: /Confirm/i })
  const isVisible = await confirmButton.isVisible().catch(() => false)
  console.log('Confirm button visible (after reload):', isVisible)

  expect(isVisible).toBe(true)
})
