// Floral's monogram frame: a double hairline oval with a small leaf sprig at
// the top and bottom, drawn in code (gold via currentColor). The initials are
// live text in the centre.
export default function MonogramFrame({ className }) {
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
        <ellipse cx="50" cy="50" rx="40" ry="47" vectorEffect="non-scaling-stroke" />
        <ellipse cx="50" cy="50" rx="36.5" ry="43.5" vectorEffect="non-scaling-stroke" opacity="0.45" />
        <g fill="currentColor" stroke="none" opacity="0.8">
          <path d="M50 0.8c-2.6 1.6-3.4 3.8-2.6 5.4 1.8-.6 3.2-2.6 2.6-5.4zM50 0.8c2.6 1.6 3.4 3.8 2.6 5.4-1.8-.6-3.2-2.6-2.6-5.4z" />
          <path d="M50 99.2c-2.6-1.6-3.4-3.8-2.6-5.4 1.8.6 3.2 2.6 2.6 5.4zM50 99.2c2.6-1.6 3.4-3.8 2.6-5.4-1.8.6-3.2 2.6-2.6 5.4z" />
        </g>
      </svg>
    </span>
  )
}
