// Lavender monogram frame: a double hairline oval with a small hanging wisteria
// raceme as its crest and a lavender sprig at its foot, drawn in code (violet via
// currentColor). The initials are live text in the centre.
export default function MonogramFrame({ className }) {
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
        <ellipse cx="50" cy="52" rx="40" ry="42" vectorEffect="non-scaling-stroke" />
        <ellipse cx="50" cy="52" rx="36" ry="38" vectorEffect="non-scaling-stroke" opacity="0.45" />
        <path d="M40 9c6 1.6 14 1.6 20 0" vectorEffect="non-scaling-stroke" />
        <g fill="currentColor" stroke="none">
          <ellipse cx="47.6" cy="12" rx="2" ry="1.3" /><ellipse cx="52.4" cy="12" rx="2" ry="1.3" />
          <ellipse cx="48.2" cy="15.4" rx="1.7" ry="1.1" /><ellipse cx="51.8" cy="15.4" rx="1.7" ry="1.1" />
          <ellipse cx="50" cy="18.6" rx="1.5" ry="1.2" />
        </g>
        <path d="M50 99V90M50 92l-3-2.4M50 94.4l3-2.4M50 96.8l-3-2.4" vectorEffect="non-scaling-stroke" />
      </svg>
    </span>
  )
}
