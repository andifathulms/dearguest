// Preset tables for `layered-svg` openings: which named layer (<g id="…">) of
// the opening SVG moves how, as fractions of the opening's duration. Commission
// the opening SVG with exactly these layer ids (docs/theme-packs.md §4, §5).
export const LAYERED_PRESETS = {
  // Two carved doors (gebyok, gate) part to reveal the cover.
  'doors-part': [
    { layer: 'glow', keyframes: [{ opacity: 0 }, { opacity: 1 }], from: 0, to: 0.4 },
    { layer: 'door-left', keyframes: [{ transform: 'translateX(0)' }, { transform: 'translateX(-102%)' }], from: 0.25, to: 1, easing: 'cubic-bezier(.6,0,.2,1)' },
    { layer: 'door-right', keyframes: [{ transform: 'translateX(0)' }, { transform: 'translateX(102%)' }], from: 0.25, to: 1, easing: 'cubic-bezier(.6,0,.2,1)' },
  ],
  // Envelope: flap lifts, letter rises, seal fades.
  'envelope-open': [
    { layer: 'seal', keyframes: [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(1.3)' }], from: 0, to: 0.25 },
    { layer: 'flap', keyframes: [{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(180deg)' }], from: 0.15, to: 0.55 },
    { layer: 'letter', keyframes: [{ transform: 'translateY(0)' }, { transform: 'translateY(-38%)' }], from: 0.45, to: 1 },
  ],
  // Depth layers rise into place one after another.
  'rise-reveal': [
    { layer: 'layer-back', keyframes: [{ opacity: 0, transform: 'translateY(6%)' }, { opacity: 1, transform: 'none' }], from: 0, to: 0.6 },
    { layer: 'layer-mid', keyframes: [{ opacity: 0, transform: 'translateY(10%)' }, { opacity: 1, transform: 'none' }], from: 0.15, to: 0.8 },
    { layer: 'layer-front', keyframes: [{ opacity: 0, transform: 'translateY(14%)' }, { opacity: 1, transform: 'none' }], from: 0.3, to: 1 },
  ],
}
