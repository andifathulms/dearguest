// Preview tile for a registry theme card (landing, /tema). Legacy themes keep
// their hand-made `tp-*` CSS preview; packs show their screenshot once they have
// one, and fall back to a mock drawn from the registry colours.
export default function ThemePreview({ theme, className = '', badge }) {
  const label = badge ?? theme.badge
  if (theme.previewImage) {
    return (
      <div className={`lp-theme-preview tp-shot ${className}`}>
        {label && <span className="tp-badge">{label}</span>}
        <img className="tp-image" src={theme.previewImage} alt={`Pratinjau tema ${theme.name}`} loading="lazy" decoding="async" />
      </div>
    )
  }
  const style = theme.preview ? undefined : { background: theme.card.bg, color: theme.card.fg, '--tp-accent': theme.card.accent }
  return (
    <div className={`lp-theme-preview ${theme.preview || 'tp-registry'} ${className}`} style={style}>
      {label && <span className="tp-badge">{label}</span>}
      <span className="tp-label">The Wedding Of</span>
      <div className="tp-names lp-serif">
        Andini<span className="tp-amp">&amp;</span>Bagus
      </div>
      <div className="tp-rule" />
      <span className="tp-date">12 · 12 · 2026</span>
    </div>
  )
}
