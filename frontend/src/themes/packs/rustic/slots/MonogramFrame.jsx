// Rustic monogram frame: a double hairline oval of twine, a small wheat sprig
// on top and a twine bow at the foot, drawn in code (rust via currentColor).
// The initials are live text in the centre.
export default function MonogramFrame({ className }) {
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
        <ellipse cx="50" cy="52" rx="40" ry="42" vectorEffect="non-scaling-stroke" />
        <ellipse cx="50" cy="52" rx="36.5" ry="38.5" vectorEffect="non-scaling-stroke" opacity="0.4" strokeDasharray="2 2" />
        <path d="M44 12c4-1 8-3 12-8M48 10c-.6-1.8 0-3 1.6-3.8M52 8c-.4-1.8.4-3 2-3.6M48 10c1.8.2 3-.4 3.6-1.8" vectorEffect="non-scaling-stroke" />
        <path d="M50 94c-3-3.5-8-3.5-8 0s5 3.5 8 0c3 3.5 8 3.5 8 0s-5-3.5-8 0zM50 94l-3 5M50 94l3 5" vectorEffect="non-scaling-stroke" />
      </svg>
    </span>
  )
}
