// ABOUTME: Live debug test against running dev server
// ABOUTME: Tests what the user actually sees

import { test, expect } from '@playwright/test'

test('live debug - fresh page load and box placement', async ({ page }) => {
  // Go directly to running dev server
  await page.goto('http://localhost:5173')
  await page.waitForTimeout(2000)

  // Screenshot initial state
  await page.screenshot({ path: 'test-results/live-1-initial.png' })

  // Check if there's already a project, if not create one
  const createButton = page.getByRole('button', { name: '+' })
  if (await createButton.isVisible()) {
    await createButton.click()
    await page.waitForTimeout(500)

    const input = page.getByPlaceholder('Project name')
    if (await input.isVisible()) {
      await input.fill('Live Debug Test')
      await page.getByRole('button', { name: 'Create' }).click()
      await page.waitForTimeout(1000)
    }
  }

  await page.screenshot({ path: 'test-results/live-2-after-project.png' })

  // Click the Box/Primitive mode button in toolbar
  const primitiveButton = page.locator('button[title*="Primitive"]').or(page.getByRole('button').filter({ has: page.locator('svg') }).nth(1))

  // Try clicking the second toolbar button (Box icon)
  const toolbarButtons = page.locator('header button')
  const count = await toolbarButtons.count()
  console.log('Toolbar buttons:', count)

  // Find and click the Primitive/Box button
  for (let i = 0; i < count; i++) {
    const btn = toolbarButtons.nth(i)
    const classes = await btn.getAttribute('class')
    console.log(`Button ${i}: ${classes}`)
  }

  // Click the second button (should be box/primitive)
  if (count > 1) {
    await toolbarButtons.nth(1).click()
    await page.waitForTimeout(500)
  }

  await page.screenshot({ path: 'test-results/live-3-primitive-mode.png' })

  // Find canvas and click center
  const canvas = page.locator('canvas')
  const box = await canvas.boundingBox()

  if (box) {
    // Move mouse to canvas center
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.waitForTimeout(500)

    await page.screenshot({ path: 'test-results/live-4-mouse-over-canvas.png' })

    // Click to place
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
    await page.waitForTimeout(500)

    await page.screenshot({ path: 'test-results/live-5-after-click.png' })
  }

  // Check for Confirm button
  const confirmVisible = await page.getByRole('button', { name: /Confirm/i }).isVisible().catch(() => false)
  console.log('Confirm button visible:', confirmVisible)

  await page.screenshot({ path: 'test-results/live-6-final.png' })
})

test('live debug - hard reload then place', async ({ page }) => {
  await page.goto('http://localhost:5173')
  await page.waitForTimeout(1000)

  // Hard reload
  await page.reload()
  await page.waitForTimeout(2000)

  await page.screenshot({ path: 'test-results/live-reload-1-after-reload.png' })

  // Click toolbar button for Primitive mode
  const toolbarButtons = page.locator('header button')
  if (await toolbarButtons.count() > 1) {
    await toolbarButtons.nth(1).click()
    await page.waitForTimeout(500)
  }

  await page.screenshot({ path: 'test-results/live-reload-2-primitive-mode.png' })

  // Click canvas
  const canvas = page.locator('canvas')
  const box = await canvas.boundingBox()
  if (box) {
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
    await page.waitForTimeout(500)
  }

  await page.screenshot({ path: 'test-results/live-reload-3-after-click.png' })

  const confirmVisible = await page.getByRole('button', { name: /Confirm/i }).isVisible().catch(() => false)
  console.log('Confirm visible after reload:', confirmVisible)
})
