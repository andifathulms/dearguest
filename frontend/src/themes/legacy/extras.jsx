// Theme-specific markup three classic themes added on top of the common
// template, moved here unchanged so LegacyTheme can reproduce them exactly.
// Each is switched on by the theme's `legacy.extras` list in the registry.

// floral-light: decorative corners around the hero.
export const FloralSVG = () => (
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" fill="none">
    <circle cx="100" cy="100" r="40" fill="#c4847a" opacity="0.3" />
    <circle cx="60" cy="80" r="28" fill="#d4a09a" opacity="0.25" />
    <circle cx="140" cy="80" r="28" fill="#d4a09a" opacity="0.25" />
    <circle cx="80" cy="140" r="28" fill="#d4a09a" opacity="0.25" />
    <circle cx="130" cy="140" r="28" fill="#d4a09a" opacity="0.25" />
    <circle cx="100" cy="55" r="22" fill="#c4847a" opacity="0.2" />
    <circle cx="100" cy="100" r="15" fill="#c4847a" opacity="0.4" />
  </svg>
)

// modern-minimalist: a hairline rule before every section.
export const Rule = () => <div className="section-rule" />
