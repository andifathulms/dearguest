// Theme registry: the one list of themes, shared with the backend.
// registry.json is GENERATED from shared/themes.json by scripts/sync_themes.py;
// edit the shared file and run `make themes`, never this copy.
import registry from './registry.json'

const ENTRIES = registry.themes
const BY_ID = Object.fromEntries(ENTRIES.map(t => [t.id, t]))

// Dev-only: list hidden themes in pickers/galleries (e.g. to test a retired pack).
const SHOW_HIDDEN = import.meta.env.DEV && import.meta.env.VITE_SHOW_HIDDEN_THEMES === '1'

export const getTheme = id => BY_ID[id] || null

// The flat card shape every picker/gallery renders.
function toCard(t) {
  return {
    id: t.id,
    name: t.name,
    status: t.status,
    kind: t.kind,
    collection: t.collection,
    tier: t.tier,
    desc: t.catalog.desc,
    category: t.catalog.category,
    colors: t.catalog.colors,
    preview: t.catalog.previewClass,
    previewImage: t.previewImage,
    swatch: t.catalog.swatch,
    card: t.catalog.card,
    badge: t.catalog.badge,
    demo: t.demoSlug,
  }
}

const visible = t => t.status === 'active' || (SHOW_HIDDEN && t.status === 'hidden')

// Themes a couple can pick (onboarding, editor).
export const selectableThemes = () => ENTRIES.filter(visible).map(toCard)

// Themes shown to buyers (landing, /tema): pickable ones plus "coming soon".
export const catalogThemes = () => ENTRIES.filter(t => visible(t) || t.status === 'coming').map(toCard)

// Display name / swatch for any registered theme, including hidden ones an
// existing invitation still uses.
export const themeName = id => BY_ID[id]?.name || id
export const themeSwatch = id => BY_ID[id]?.catalog.swatch || '#ddd'
