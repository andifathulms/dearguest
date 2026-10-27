// Minimal's monogram frame: a hairline circle with a square turned 45°
// inside it, drawn in code (no commissioned art). Follows currentColor; the
// stroke stays 1 px at any size.
export default function MonogramFrame({ className }) {
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
        <circle cx="50" cy="50" r="48" vectorEffect="non-scaling-stroke" />
        <rect x="21" y="21" width="58" height="58" transform="rotate(45 50 50)" vectorEffect="non-scaling-stroke" opacity="0.55" />
      </svg>
    </span>
  )
}
