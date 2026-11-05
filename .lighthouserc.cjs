// Lighthouse CI on the prod-like stack (production build, nginx gzip, TLS),
// Lighthouse's mobile profile: slow 4G (150 ms RTT, 1.6 Mbps) and a 4x CPU
// slowdown, as in the Phase 1 budget (THEMEPACK-REPORT.md §4). Budgets are
// the values measured in Phase 5 plus a margin (LAUNCH-READINESS.md); CI
// fails when a page gets slower or heavier than that.
const BASE = process.env.LH_BASE || 'https://localhost:8443'
const page = (path, budgets) => ({ url: `${BASE}${path}`, budgets })

// Measured in Phase 5 (median of 3; LAUNCH-READINESS.md) -> budget (+~15 %):
//   invitation  LCP 3.83 s -> 4.4 s,  575 KB -> 680 KB
//   landing     LCP 3.34 s -> 3.9 s,  917 KB -> 1060 KB
//   /tema       LCP 3.29 s -> 3.9 s, 1110 KB -> 1280 KB
const budget = (lcp, bytes) => ({
  'largest-contentful-paint': ['error', { maxNumericValue: lcp, aggregationMethod: 'median-run' }],
  'cumulative-layout-shift': ['error', { maxNumericValue: 0.1, aggregationMethod: 'median-run' }],
  'total-blocking-time': ['error', { maxNumericValue: 300, aggregationMethod: 'median-run' }],
  'total-byte-weight': ['error', { maxNumericValue: bytes * 1024, aggregationMethod: 'median-run' }],
})
const invitation = budget(4400, 680)
const pages = [
  page('/', budget(3900, 1060)),
  page('/tema', budget(3900, 1280)),
  page('/demo-taman-sage', invitation),
  page('/demo-taman-sage/LHC2PQ', invitation),
]

module.exports = {
  ci: {
    collect: {
      url: pages.map(p => p.url),
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--ignore-certificate-errors --no-sandbox',
        // The mobile defaults: simulated slow 4G + 4x CPU, 412x823 phone.
        throttlingMethod: 'simulate',
        onlyCategories: ['performance'],
      },
    },
    assert: {
      assertMatrix: pages.map(p => ({ matchingUrlPattern: `^${p.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, assertions: p.budgets })),
    },
    upload: { target: 'filesystem', outputDir: '.lighthouseci' },
  },
}
