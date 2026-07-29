import { test, expect } from '@playwright/test'

// Determinism coverage for the WebGL themes.
//
// These had no coverage at all: setup used bare Math.random() and motion
// accumulated `+= speed * dt`, so no two runs — let alone two machines — ever
// produced the same frame. Converting the scene to a pure function of a
// seekable clock fixes that at the state level, which is what these assert.
//
// Two things make the frames reproducible, and both are needed:
//   - the quality tier (particle counts scale with it, so a tier change under
//     load renders a different scene, not just a slower one)
//   - the device pixel ratio (r3f treats dpr as an adaptive [min,max] range,
//     so the canvas resolution itself drifts)
// `?q=high` pins both in dev; production keeps adapting.
const THEMES_3D = [{ slug: 'demo-lanterns-3d', frame: 240 }]

// Serial, with a longer timeout: booting a WebGL context and compiling shaders
// takes far longer than the DOM themes, and two contexts at once on a loaded
// machine pushes navigation past Playwright's 30s default.
test.describe.configure({ mode: 'serial' })
test.setTimeout(90_000)

for (const { slug, frame } of THEMES_3D) {
  test(`${slug} — scene at frame ${frame}`, async ({ page }) => {
    await page.goto(`/${slug}?to=Budi+Santoso&q=high`, { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => window.__backdrop, null, { timeout: 25000 })
    await page.locator('.cover-open-btn').click()
    await page.waitForTimeout(1500)
    await page.evaluate(f => { window.__backdrop.pause(); window.__backdrop.seekTo(f) }, frame)
    await page.waitForTimeout(700)
    await expect(page.locator('.cc-root')).toHaveClass(/cc-q-high/)
    await expect(page).toHaveScreenshot(`${slug}-scene.png`)
  })

  test(`${slug} — scene is a pure function of the clock`, async ({ page }) => {
    await page.goto(`/${slug}?to=Budi+Santoso&q=high`, { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => window.__backdrop, null, { timeout: 25000 })
    await page.locator('.cover-open-btn').click()
    await page.waitForTimeout(1500)

    // A pixel diff cannot resolve two seconds of slow lantern drift, so assert
    // the underlying property instead: seek away and back, and the camera and
    // particles must land on exactly the same numbers.
    const sample = async f => {
      await page.evaluate(fr => { window.__backdrop.pause(); window.__backdrop.seekTo(fr) }, f)
      await page.waitForTimeout(350)
      return page.evaluate(() => ({ rig: window.__rig, lanterns: window.__lanterns }))
    }

    const first = await sample(frame)
    // Not a multiple of the 600-frame loop, or the seek aliases straight back
    // onto the same frame and the scene legitimately does not move.
    const away = await sample(frame + 150)
    const back = await sample(frame)

    // Seeking must actually move the scene. Camera x drifts continuously;
    // z is not a useful probe — it settles at warpTo once the warp completes.
    expect(away.rig.x).not.toBe(first.rig.x)
    expect(away.lanterns.y).not.toBe(first.lanterns.y)

    // ...and returning to a frame must reproduce it exactly. Before the
    // conversion this was impossible: motion accumulated per rendered frame,
    // so the scene depended on how it got there, not on where it was.
    expect(back.rig).toEqual(first.rig)
    expect(back.lanterns).toEqual(first.lanterns)
  })
}
