import { useEffect, useState } from 'react'
import api from './client.js'

// Who is logged in, from the server (the session cookie is httpOnly, so the
// page can't look for itself). undefined while checking, then a user or null.
export function useSession() {
  const [user, setUser] = useState(undefined)
  useEffect(() => {
    let live = true
    api.get('/auth/me/').then(res => live && setUser(res.data)).catch(() => live && setUser(null))
    return () => { live = false }
  }, [])
  return user
}

export async function logout(navigate) {
  try { await api.post('/auth/logout/') } catch { /* cookies are cleared either way */ }
  navigate('/dashboard')
}
