// Guest-facing copy per religion variant (islam, kristen, katolik, umum, ...).
// copy.json and scripture.json are GENERATED from shared/copy/ by
// scripts/sync_themes.py; edit the shared files, never these copies.
// Lookup: the invitation's variant first, then base. Scripture text is only
// ever read from scripture.json (verbatim from named sources), never written here.
import copyData from './copy.json'
import scriptureData from './scripture.json'

const LOCALE = copyData.defaultLocale
const { base, variants } = copyData.locales[LOCALE]
const SCRIPTURE = Object.fromEntries(scriptureData.entries.map(e => [e.id, e]))

export const DEFAULT_VARIANT = 'umum'
export const VARIANTS = copyData.variantsOrder

export const variantOptions = () => VARIANTS.map(id => ({ id, label: variants[id]._label }))

const known = variant => (variants[variant] ? variant : DEFAULT_VARIANT)

// t('rsvp.thanks') / t('share.text', { bride, groom, url })
export function makeT(variant) {
  const v = variants[known(variant)]
  return (key, values) => {
    let text = v[key] ?? base[key] ?? key
    if (values) for (const [name, value] of Object.entries(values)) text = text.split(`{${name}}`).join(value ?? '')
    return text
  }
}

export const variantMeta = variant => variants[known(variant)]

export const eventLabel = (event, t) => event.title || t(`events.type.${event.event_type}`)

// The Arabic hero blessing for the variant (islam: the Bismillah), or null.
export function blessingFor(variant) {
  const id = variantMeta(variant)._blessing
  return id ? SCRIPTURE[id] || null : null
}

// The scripture block to show: the couple's own wording, the variant's default
// verse, or nothing. { ref, text, arabic, quran }.
export function scriptureFor(invitation) {
  const mode = invitation.scripture_mode || 'default'
  if (mode === 'none') return null
  if (mode === 'custom') {
    if (!invitation.scripture_ref && !invitation.scripture_text) return null
    return { ref: invitation.scripture_ref, text: invitation.scripture_text, arabic: '', quran: false }
  }
  const entry = SCRIPTURE[variantMeta(invitation.copy_variant)._scripture]
  if (!entry) return null
  return { ref: entry.ref, text: entry.text, arabic: entry.arabic, quran: Boolean(entry.arabic) }
}

// Greeting and closing: the couple's own text, else the variant default.
export function withDefaultTexts(invitation) {
  const t = makeT(invitation.copy_variant)
  return {
    ...invitation,
    opening_text: invitation.opening_text || t('greeting.default'),
    closing_text: invitation.closing_text || t('closing.default'),
  }
}
