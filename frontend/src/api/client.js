import axios from 'axios'

export const API_BASE = import.meta.env.VITE_API_URL || '/api'

// The session lives in httpOnly cookies set by the server (backend
// apps/auth_api/cookies.py): scripts on the page never see a token. Writes
// carry Django's CSRF token from the readable `csrftoken` cookie.
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
})

// Sessions from before cookies kept tokens here; they're useless now.
try {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
} catch { /* private mode */ }

// Access tokens live 15 minutes. On a 401 we refresh once (the refresh cookie
// rotates), retry the original request, and only give up if that fails --
// the page then sends the couple to the login screen.
let refreshing = null

api.interceptors.response.use(
  response => response,
  async error => {
    const original = error.config
    if (
      error.response?.status !== 401 ||
      !original ||
      original._retried ||
      // Login, logout and refresh failing must not loop (/auth/me/ may refresh).
      /\/auth\/(login|logout|refresh|register)\//.test(original.url || '')
    ) {
      return Promise.reject(error)
    }
    original._retried = true

    // Concurrent 401s share one refresh instead of racing to spend the token.
    if (!refreshing) {
      refreshing = api.post('/auth/refresh/').finally(() => { refreshing = null })
    }
    try {
      await refreshing
      return api(original)
    } catch {
      return Promise.reject(error)
    }
  },
)

export default api
