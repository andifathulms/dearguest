// Copy text, also where the Clipboard API is missing or refused: WhatsApp's
// in-app browser on older Android WebViews, and any non-https origin. Falls
// back to a hidden textarea + execCommand('copy'), which those still allow
// inside a tap. Resolves on success, rejects if both fail.
export function copyText(text) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).catch(() => legacyCopy(text))
  }
  return legacyCopy(text)
}

function legacyCopy(text) {
  return new Promise((resolve, reject) => {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none'
    document.body.appendChild(area)
    area.select()
    area.setSelectionRange(0, text.length)   // iOS needs an explicit range
    let ok = false
    try { ok = document.execCommand('copy') } catch { ok = false }
    area.remove()
    if (ok) resolve()
    else reject(new Error('copy failed'))
  })
}
