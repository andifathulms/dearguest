// The only Sentry functions the app uses, imported by name so the bundler
// can leave the rest of the SDK out. Loaded lazily by observability.js.
export { browserTracingIntegration, captureException, init } from '@sentry/react'
