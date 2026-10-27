import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Share links, QR codes and copied invitation links are built on this origin
// (src/utils/publicUrl.js). A build without it would ship relative links that
// WhatsApp can't open, so refuse to build instead.
function requirePublicOrigin(mode) {
  const origin = loadEnv(mode, process.cwd(), 'VITE_').VITE_PUBLIC_ORIGIN
  if (!origin || !/^https?:\/\/[^/]+\/?$/.test(origin)) {
    throw new Error(
      'VITE_PUBLIC_ORIGIN must be set to the public site origin for builds, e.g. ' +
      'VITE_PUBLIC_ORIGIN=https://dearguest.id (got: ' + JSON.stringify(origin ?? null) + ')',
    )
  }
}

// Where the dev server forwards /api, /media and /share. Inside docker compose
// that's the backend service, not localhost.
const DEV_PROXY_TARGET = process.env.DEV_PROXY_TARGET || 'http://localhost:8000'

export default defineConfig(({ command, mode }) => {
  if (command === 'build') requirePublicOrigin(mode)
  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      // The Docker visual suite reaches the dev server by its compose service name.
      allowedHosts: ['frontend'],
      proxy: {
        '/api': {
          target: DEV_PROXY_TARGET,
          changeOrigin: false, // keep the browser Host so Django ALLOWED_HOSTS matches
        },
        '/media': {
          target: DEV_PROXY_TARGET,
          changeOrigin: false, // keep the browser Host so Django ALLOWED_HOSTS matches
        },
        '/share': {
          target: DEV_PROXY_TARGET,
          changeOrigin: false, // keep the browser Host so Django ALLOWED_HOSTS matches
        },
      },
    },
  }
})
