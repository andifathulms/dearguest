// Preview tile for a registry theme card (landing, /tema): the pack's
// screenshot once it has one, else a mock drawn from the registry colours.
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
  const style = { background: theme.card.bg, color: theme.card.fg, '--tp-accent': theme.card.accent }
  return (
    <div className={`lp-theme-preview tp-registry ${className}`} style={style}>
      {label && <span className="tp-badge">{label}</span>}
      <span className="tp-label">Undangan Pernikahan</span>
      <div className="tp-names lp-serif">
        Andini<span className="tp-amp">&amp;</span>Bagus
      </div>
      <div className="tp-rule" />
      <span className="tp-date">12 · 12 · 2026</span>
    </div>
  )
}
