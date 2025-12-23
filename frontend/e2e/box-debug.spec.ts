// ABOUTME: Detailed box debugging test using proper fixtures
// ABOUTME: Captures every step to find the rendering issue

import { test, expect } from './fixtures'

test('detailed box placement debug', async ({ app, page }) => {
  await app.goto()
  await page.screenshot({ path: 'test-results/BOX-01-app-loaded.png' })

  // Create project
  await app.createProject('Box Debug ' + Date.now())
  await app.dismissToast()
  await page.screenshot({ path: 'test-results/BOX-02-project-created.png' })

  // Select Primitive mode
  await app.selectMode('Primitive')
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'test-results/BOX-03-primitive-mode.png' })

  // Get canvas
  const canvas = app.canvas
  const box = await canvas.boundingBox()
  console.log('Canvas box:', box)

  if (box) {
    // Move mouse to canvas center
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'test-results/BOX-04-ghost-preview.png' })

    // Click to place
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: 'test-results/BOX-05-after-click.png' })
  }

  // Check confirm button
  const confirmBtn = page.getByRole('button', { name: /Confirm/i })
  const isVisible = await confirmBtn.isVisible()
  console.log('Confirm button visible:', isVisible)

  await page.screenshot({ path: 'test-results/BOX-06-final.png' })

  expect(isVisible).toBe(true)
})
