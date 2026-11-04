// Error tracking for the app and every invitation (Sentry). Only when
// VITE_SENTRY_DSN is set at build time, and loaded after the page is idle, so
// a guest on a slow phone downloads it after the invitation itself. Errors
// before that are kept and sent once it loads. Personal data is scrubbed
// before anything is sent (utils/scrub.js).
import { scrubBreadcrumb, scrubEvent } from './utils/scrub.js'

const DSN = import.meta.env.VITE_SENTRY_DSN

export function startErrorTracking() {
  if (!DSN) return
  const early = []
  const keep = e => early.push(e.error || e.reason || e)
  window.addEventListener('error', keep)
  window.addEventListener('unhandledrejection', keep)

  const load = () => import('./sentryClient.js').then(Sentry => {
    Sentry.init({
      dsn: DSN,
      release: import.meta.env.VITE_RELEASE || undefined,
      environment: import.meta.env.MODE,
      sendDefaultPii: false,
      integrations: [Sentry.browserTracingIntegration()],
      tracesSampleRate: 0.05,
      beforeSend: scrubEvent,
      beforeSendTransaction: scrubEvent,
      beforeBreadcrumb: scrubBreadcrumb,
    })
    window.removeEventListener('error', keep)
    window.removeEventListener('unhandledrejection', keep)
    early.forEach(err => Sentry.captureException(err))
  }).catch(() => { /* the tracker being down must never break the page */ })

  if ('requestIdleCallback' in window) window.requestIdleCallback(load, { timeout: 5000 })
  else setTimeout(load, 3000)
}
