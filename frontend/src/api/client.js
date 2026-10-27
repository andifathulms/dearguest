import axios from 'axios'

export const API_BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE,
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Access tokens live a day, refresh tokens a week. Without this the second day
// of editing ends in a silent bounce to the login screen -- unsaved work and
// all -- while a perfectly good refresh token sits in localStorage. On a 401 we
// spend it once, retry the original request, and only log out if that fails.
let refreshing = null

function clearSession() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}

api.interceptors.response.use(
  response => response,
  async error => {
    const original = error.config
    const refresh = localStorage.getItem('refresh_token')

    if (
      error.response?.status !== 401 ||
      !refresh ||
      !original ||
      original._retried ||
      // The refresh call itself failing must not loop.
      original.url?.includes('/auth/refresh/')
    ) {
      return Promise.reject(error)
    }
    original._retried = true

    // Concurrent 401s share one refresh instead of racing to spend the token.
    if (!refreshing) {
      refreshing = axios
        .post(`${API_BASE}/auth/refresh/`, { refresh })
        .then(res => {
          localStorage.setItem('access_token', res.data.access)
          // SimpleJWT returns a new refresh token when rotation is enabled.
          if (res.data.refresh) localStorage.setItem('refresh_token', res.data.refresh)
          return res.data.access
        })
        .finally(() => { refreshing = null })
    }

    try {
      const token = await refreshing
      original.headers = { ...original.headers, Authorization: `Bearer ${token}` }
      return api(original)
    } catch {
      clearSession()
      return Promise.reject(error)
    }
  },
)

export default api
