// Theme previews for /tema and the landing page, captured from each active
// theme's real demo invitation: a 720x1560 WebP still of the cover and a
// 6-second muted loop at 390x844 (open the cover, scroll the first sections)
// as WebM (VP9) and MP4 (H.264), each at most 1.5 MB.
//
// Runs inside the capture image (scripts/capture-docker.sh), against the dev
// server. Writes public/theme-previews/<id>.{webp,webm,mp4}.
//   sh scripts/capture-docker.sh            # every active theme
//   sh scripts/capture-docker.sh sage bugis # some
import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from '@playwright/test'

const BASE = process.env.CAPTURE_BASE || 'http://frontend:5173'
// The dev bundle calls the API on the host's published port (VITE_API_URL),
// which this container can't reach: send those requests to the backend service.
const API = process.env.CAPTURE_API || 'http://backend:8000'
const OUT = 'public/theme-previews'
const VIEW = { width: 390, height: 844 }
const SECONDS = 6
const MAX_BYTES = 1.5 * 1024 * 1024
const registry = JSON.parse(readFileSync('../shared/themes.json', 'utf8'))
const only = process.argv.slice(2)
const themes = registry.themes.filter(t => t.status === 'active' && t.demoSlug && (!only.length || only.includes(t.id)))

const ffmpeg = args => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' })

// Lower quality (higher CRF) until the file fits.
function encode(src, start, out, codec) {
  const common = ['-ss', String(start), '-t', String(SECONDS), '-i', src, '-an',
    '-vf', `scale=${VIEW.width}:${VIEW.height}:flags=lanczos,fps=30`]
  for (let crf = codec === 'vp9' ? 34 : 26; crf <= 50; crf += 3) {
    const args = codec === 'vp9'
      ? [...common, '-c:v', 'libvpx-vp9', '-crf', String(crf), '-b:v', '0', '-row-mt', '1', '-deadline', 'good', out]
      : [...common, '-c:v', 'libx264', '-crf', String(crf), '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out]
    ffmpeg(args)
    const bytes = statSync(out).size
    if (bytes <= MAX_BYTES) return { crf, bytes }
  }
  throw new Error(`${out}: could not fit ${MAX_BYTES} bytes`)
}

async function useBackend(target) {
  await target.route(/^http:\/\/localhost:\d+\/(api|media)\//, async route => {
    const url = route.request().url().replace(/^http:\/\/localhost:\d+/, API)
    const response = await route.fetch({ url, headers: { ...route.request().headers(), host: 'localhost' } })
    await route.fulfill({ response })
  })
}

async function settle(page) {
  await page.evaluate(() => document.fonts.ready)
  await page.waitForLoadState('networkidle')
}

const browser = await chromium.launch()
mkdirSync(OUT, { recursive: true })
for (const theme of themes) {
  const url = `${BASE}/${theme.demoSlug}`
  const work = mkdtempSync(join(tmpdir(), `capture-${theme.id}-`))

  // Still: the cover at 2x, scaled to 720x1560.
  const still = await browser.newPage({ viewport: VIEW, deviceScaleFactor: 2 })
  await useBackend(still)
  await still.goto(url)
  await settle(still)
  await still.waitForTimeout(2500)   // the cover's own entrance
  await still.screenshot({ path: join(work, 'still.png') })
  await still.close()
  ffmpeg(['-i', join(work, 'still.png'), '-vf', 'scale=720:1560:flags=lanczos', '-c:v', 'libwebp', '-quality', '80', join(OUT, `${theme.id}.webp`)])

  // Loop: recorded at 2x for sharpness, trimmed to start once the page is ready.
  const ctx = await browser.newContext({
    viewport: VIEW, deviceScaleFactor: 2, recordVideo: { dir: work, size: { width: VIEW.width * 2, height: VIEW.height * 2 } },
  })
  await useBackend(ctx)
  const t0 = Date.now()
  const page = await ctx.newPage()
  await page.goto(url)
  await settle(page)
  const start = (Date.now() - t0) / 1000
  await page.waitForTimeout(1300)
  await page.locator('.pk-open-btn').click()
  await page.waitForTimeout(1600)
  for (let i = 0; i < 24; i++) {   // ~3 s of gentle scrolling
    await page.mouse.wheel(0, 34)
    await page.waitForTimeout(125)
  }
  await page.waitForTimeout(400)
  const video = await page.video().path()
  await ctx.close()

  const webm = encode(video, start, join(work, 'out.webm'), 'vp9')
  const mp4 = encode(video, start, join(work, 'out.mp4'), 'h264')
  copyFileSync(join(work, 'out.webm'), join(OUT, `${theme.id}.webm`))
  copyFileSync(join(work, 'out.mp4'), join(OUT, `${theme.id}.mp4`))
  rmSync(work, { recursive: true, force: true })
  const kb = n => `${Math.round(n / 1024)} KB`
  console.log(`${theme.id}: webp ${kb(statSync(join(OUT, `${theme.id}.webp`)).size)}, ` +
    `webm ${kb(webm.bytes)} (crf ${webm.crf}), mp4 ${kb(mp4.bytes)} (crf ${mp4.crf})`)
}
await browser.close()
