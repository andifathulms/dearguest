import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE,
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Shareable URL with an Open Graph preview, served by the backend /share page
// (same host as the API). qs may include ?to=&g= for personalization.
const SHARE_ORIGIN = API_BASE.replace(/\/api\/?$/, '')
export const shareUrl = (slug, qs = '') => `${SHARE_ORIGIN}/share/${slug}${qs}`

export default api
