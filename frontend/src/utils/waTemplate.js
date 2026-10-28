// WhatsApp invitation messages: the couple's templates (Invitation.wa_templates)
// over the copy variant's defaults (blast.* in shared/copy/copy.json), and the
// variables filled in per guest. Pure, so it runs under `node --test`; the
// caller passes `t` (makeT(variant)).
import { formatEventDate, formatEventTime } from './dates.js'

export const VARIABLES = [
  { key: 'nama', label: 'nama tamu' },
  { key: 'link', label: 'link undangan' },
  { key: 'pasangan', label: 'nama kalian' },
  { key: 'tanggal', label: 'tanggal & jam acara' },
  { key: 'acara', label: 'nama acara' },
]
const KNOWN = new Set(VARIABLES.map(v => v.key))
export const TEMPLATE_KEYS = ['formal', 'casual', 'group']

export function defaultTemplate(key, t) {
  return t(`blast.${key}`, { salam: t('blast.salam'), greeting: t('share.greeting') })
}

export function templateFor(key, saved, t) {
  return (saved && saved[key]) || defaultTemplate(key, t)
}

// '{nma}' and friends: shown as a warning before anything is sent.
export function unknownVariables(text) {
  const found = [...String(text || '').matchAll(/\{([^{}\s]{1,30})\}/g)].map(m => m[1])
  return [...new Set(found.filter(name => !KNOWN.has(name)))]
}

export function renderMessage(text, vars) {
  return String(text || '').replace(/\{([a-z]+)\}/g, (all, name) => (KNOWN.has(name) ? vars[name] ?? '' : all))
}

// Variables shared by every guest of an invitation. `event` is the primary event.
export function invitationVars({ couple, event, t, eventLabel }) {
  const names = [couple?.bride_name, couple?.groom_name].filter(Boolean).join(' & ')
  return {
    pasangan: names,
    acara: event ? eventLabel(event, t) : '',
    tanggal: event
      ? `${formatEventDate(event.start, event.timezone)}, ${formatEventTime(event.start, event.timezone)}`
      : '',
  }
}
