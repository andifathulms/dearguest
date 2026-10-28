// Shared motion for every pack (docs/theme-packs.md §9). Two rules keep the
// visual suite stable and the sections' own item animations intact:
//  - every reveal ends exactly at the element's resting style (transform none,
//    clip-path none), and animates opacity with it, so tests/visual/packs/stub.js
//    waitRevealed (which waits for inline opacity 1) also waits for the reveal;
//  - reveals are Framer variants on wrappers or on elements nothing else animates,
//    never a class-based observer on the items a section already animates.

export const EASE = [0.22, 1, 0.36, 1]

// theme.json → motion.exit: how the cover leaves when the guest opens it.
export const EXITS = ['fade', 'doors', 'curtain', 'part', 'bloom']
// theme.json → motion.signature: the pack's ambient loops (_base/motion.css).
export const SIGNATURES = ['drift', 'sway', 'shimmer', 'breathe']

// Section title: the text rises out of a mask, then the ornament draws from its centre.
// The mask overhangs the box so script flourishes are never clipped at rest.
export function titleReveal(still) {
  if (still) {
    return {
      title: { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.6 } } },
      ornament: { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.6 } } },
    }
  }
  return {
    title: {
      hidden: { opacity: 0, y: 18, clipPath: 'inset(-30% -15% 130% -15%)' },
      show: {
        opacity: 1, y: 0, clipPath: 'inset(-30% -15% -30% -15%)',
        transition: { duration: 0.9, ease: EASE },
        transitionEnd: { clipPath: 'none' },
      },
    },
    ornament: {
      hidden: { opacity: 0, clipPath: 'inset(0% 50% 0% 50%)' },
      show: {
        opacity: 1, clipPath: 'inset(0% 0% 0% 0%)',
        transition: { duration: 0.9, delay: 0.35, ease: EASE },
        transitionEnd: { clipPath: 'none' },
      },
    },
  }
}

// Gallery photo: the frame unveils from its centre while the photo settles from
// a slight zoom (--pk-zoom scales the <img>, _base/motion.css).
export function photoReveal(still) {
  if (still) {
    return { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.5 } } }
  }
  return {
    hidden: { opacity: 0, clipPath: 'inset(9% 9% 9% 9%)', '--pk-zoom': 1.14 },
    show: {
      opacity: 1, clipPath: 'inset(0% 0% 0% 0%)', '--pk-zoom': 1,
      transition: { duration: 1.1, ease: EASE },
      transitionEnd: { clipPath: 'none' },
    },
  }
}
