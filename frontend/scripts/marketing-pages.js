// Vite build plugin: what search engines and link previews see on the
// marketing site without running JavaScript.
// - dist/tema/index.html and dist/tema/<id>/index.html: the SPA shell with
//   each page's own <title>, description, canonical and Open Graph tags (the
//   site's JPEG preview image: WhatsApp doesn't reliably show WebP), plus a
//   <noscript> summary. nginx serves them via `try_files $uri/index.html`.
// - dist/sitemap.xml: marketing pages only (invitations are private).
// - dist/robots.txt.
// Invitations themselves get noindex from nginx (X-Robots-Tag) and the app.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function withTags(shell, { title, desc, url, noscript }) {
  const set = (html, re, tag) => (re.test(html) ? html.replace(re, tag) : html.replace('</head>', `    ${tag}\n  </head>`))
  let html = shell
  html = set(html, /<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
  html = set(html, /<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(desc)}" />`)
  html = set(html, /<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${esc(title)}" />`)
  html = set(html, /<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${esc(desc)}" />`)
  html = set(html, /<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${esc(url)}" />`)
  html = set(html, /<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${esc(url)}" />`)
  return html.replace('<div id="root"></div>', `<div id="root"></div>\n    <noscript>${noscript}</noscript>`)
}

export default function marketingPages() {
  let outDir
  return {
    name: 'dearguest-marketing-pages',
    apply: 'build',
    configResolved(config) { outDir = config.build.outDir },
    closeBundle() {
      const origin = (process.env.VITE_PUBLIC_ORIGIN || '').replace(/\/+$/, '')
      const shell = readFileSync(join(outDir, 'index.html'), 'utf8')
      const registry = JSON.parse(readFileSync(new URL('../src/themes/registry.json', import.meta.url), 'utf8'))
      const themes = registry.themes.filter(t => t.status === 'active')
      const write = (path, html) => {
        mkdirSync(join(outDir, path), { recursive: true })
        writeFileSync(join(outDir, path, 'index.html'), html)
      }

      write('tema', withTags(shell, {
        title: 'Galeri Tema Undangan Pernikahan Digital · DearGuest',
        desc: `${themes.length} tema undangan pernikahan berlukis: ${themes.map(t => t.name).join(', ')}.`,
        url: `${origin}/tema`,
        noscript: `<h1>Galeri Tema DearGuest</h1><ul>${themes.map(t =>
          `<li><a href="/tema/${t.id}">${esc(t.name)}</a>: ${esc(t.catalog.desc)}</li>`).join('')}</ul>`,
      }))
      for (const t of themes) {
        write(`tema/${t.id}`, withTags(shell, {
          title: `${t.name} · Tema Undangan Pernikahan DearGuest`,
          desc: t.catalog.desc,
          url: `${origin}/tema/${t.id}`,
          noscript: `<h1>${esc(t.name)}</h1><p>${esc(t.catalog.category)}</p><p>${esc(t.catalog.desc)}</p>` +
            `<p><a href="/${t.demoSlug}">Lihat demo</a> · <a href="/tema">Semua tema</a></p>`,
        }))
      }

      const today = new Date().toISOString().slice(0, 10)
      const urls = ['/', '/tema', ...themes.map(t => `/tema/${t.id}`)]
      writeFileSync(join(outDir, 'sitemap.xml'),
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        urls.map(u => `  <url><loc>${esc(origin + u)}</loc><lastmod>${today}</lastmod></url>`).join('\n') +
        '\n</urlset>\n')
      // /og/ and /share/ stay crawlable on purpose: some preview bots honour
      // robots.txt for card images. They send X-Robots-Tag: noindex instead.
      writeFileSync(join(outDir, 'robots.txt'), [
        'User-agent: *',
        'Disallow: /dashboard',
        'Disallow: /my',
        'Disallow: /onboarding',
        'Disallow: /api/',
        'Allow: /',
        '',
        `Sitemap: ${origin}/sitemap.xml`,
        '',
      ].join('\n'))
    },
  }
}
