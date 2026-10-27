// The editor's live preview follows saved theme and photo-filter changes.
// Uses a stateful stub backend (stub.js): PATCH → next GET → iframe reload.
import { test, expect } from '@playwright/test'
import { SLUG, stubEditor } from './stub.js'

test('live preview follows theme and photo-filter changes', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('access_token', 'test-token'))
  const state = await stubEditor(page)
  await page.goto(`/dashboard/${SLUG}/edit`)
  const preview = page.frameLocator('iframe[title="Pratinjau undangan"]')
  const showPreview = () => page.getByRole('button', { name: 'Pratinjau Langsung' }).click()

  // On phones the preview is a full-screen overlay over the form, so a couple
  // closes it to edit and reopens it to look; on desktop it sits alongside.
  async function edit(change) {
    const close = page.locator('.ed-preview-close')
    if (await close.isVisible()) await close.click()
    await change()
    await page.getByRole('button', { name: 'Simpan Pengaturan' }).click()
    if (await page.getByRole('button', { name: 'Pratinjau Langsung' }).isVisible()) await showPreview()
  }

  await showPreview()
  // The pack renders in the preview, without the opening gate.
  await expect(preview.locator('.pk-root')).toHaveAttribute('data-photo-filter', 'none')
  await expect(preview.locator('.pk-opening')).toHaveCount(0)

  // Photo filter: offered for this pack; saving re-renders the preview.
  await edit(() => page.selectOption('#set-filter', 'bw'))
  await expect(preview.locator('.pk-root')).toHaveAttribute('data-photo-filter', 'bw')
  expect(state.photo_filter).toBe('bw')
  await expect(preview.locator('.pk-hero-img')).toHaveCSS('filter', /grayscale\(1\)/)

  // Theme: switch to a legacy theme (listed because the dev server sets
  // VITE_SHOW_HIDDEN_THEMES=1) and back. The filter control follows the pack.
  await edit(async () => {
    await page.selectOption('#set-theme', 'navy-gold')
    await expect(page.locator('#set-filter')).toHaveCount(0)
  })
  await expect(preview.locator('.navy-gold.lx-root')).toBeVisible()

  await edit(() => page.selectOption('#set-theme', 'minimal'))
  await expect(preview.locator('.pk-root')).toHaveAttribute('data-pack', 'minimal')
})
