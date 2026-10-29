// "Pakai tema ini" on /tema/:id: the theme survives registration (and a
// login detour) until onboarding preselects it. sessionStorage only: it's a
// convenience, so failures are ignored.
const KEY = 'dearguest.theme'

export function rememberTheme(id) {
  try { if (id) sessionStorage.setItem(KEY, id) } catch { /* private mode */ }
}

export function chosenTheme(validIds) {
  let id = new URLSearchParams(window.location.search).get('theme')
  if (!id) try { id = sessionStorage.getItem(KEY) } catch { id = null }
  return id && validIds.includes(id) ? id : null
}
