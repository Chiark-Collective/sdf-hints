// ABOUTME: Test against actual running dev server
// ABOUTME: To reproduce user's box placement issue

import { test, expect } from '@playwright/test'

test.use({ baseURL: 'http://localhost:5173' })

test('box placement on LIVE dev server', async ({ page }) => {
  await page.goto('/')
  await page.waitForTimeout(2000)

  // Screenshot initial
  await page.screenshot({ path: 'test-results/LIVE-1-initial.png' })

  // Click on first project in list to select it
  const projectItem = page.locator('[class*="cursor-pointer"]').first()
  await projectItem.click()
  await page.waitForTimeout(500)

  await page.screenshot({ path: 'test-results/LIVE-2-project-selected.png' })

  // Now click Box button in toolbar - it's the 2nd icon button
  // The toolbar has: pointer, box, sphere, sphere-hollow, grid, download, history, undo
  const boxButton = page.locator('button[class*="h-9 w-9"]').nth(1)
  await boxButton.click()
  await page.waitForTimeout(500)

  await page.screenshot({ path: 'test-results/LIVE-3-primitive-mode.png' })

  // Click on main canvas (the three.js one)
  const mainCanvas = page.locator('canvas').first()
  const box = await mainCanvas.boundingBox()
  console.log('Canvas bounding box:', box)

  if (box) {
    // Move to center
    await page.mouse.move(box.x + box.width/2, box.y + box.height/2)
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'test-results/LIVE-4-mouse-hover.png' })

    // Click
    await page.mouse.click(box.x + box.width/2, box.y + box.height/2)
    await page.waitForTimeout(1000)
    await page.screenshot({ path: 'test-results/LIVE-5-after-click.png' })
  }

  // Check for confirm button
  const confirm = page.locator('button:has-text("Confirm")')
  const visible = await confirm.isVisible()
  console.log('Confirm button visible:', visible)

  await page.screenshot({ path: 'test-results/LIVE-6-final.png' })

  // Don't assert - just capture what we see
  console.log('TEST COMPLETE - check screenshots')
})
