// Sage's monogram frame: a hairline circle with a small eucalyptus sprig
// curving along its lower left, drawn in code (sage via currentColor, a gold
// dot). The initials are live text in the centre.
export default function MonogramFrame({ className }) {
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
        <circle cx="50" cy="50" r="46" vectorEffect="non-scaling-stroke" opacity="0.7" />
        <path d="M14 66c6 14 18 24 34 27" vectorEffect="non-scaling-stroke" />
        <g fill="currentColor" stroke="none" opacity="0.55">
          <ellipse cx="18" cy="72" rx="4.4" ry="2" transform="rotate(-50 18 72)" />
          <ellipse cx="25" cy="81" rx="4.4" ry="2" transform="rotate(-35 25 81)" />
          <ellipse cx="34" cy="88" rx="4.2" ry="1.9" transform="rotate(-18 34 88)" />
        </g>
        <circle cx="50" cy="4" r="1.8" fill="#b89a5e" stroke="none" />
      </svg>
    </span>
  )
}
