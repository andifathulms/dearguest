// Bali monogram frame: a double hairline oval crowned by a small five-petal jepun
// (frangipani) and footed by a short woven janur tail, drawn in code (prada red via
// currentColor). The initials are live text in the centre.
export default function MonogramFrame({ className }) {
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
        <ellipse cx="50" cy="52" rx="40" ry="42" vectorEffect="non-scaling-stroke" />
        <ellipse cx="50" cy="52" rx="36" ry="38" vectorEffect="non-scaling-stroke" opacity="0.45" />
        <g fill="currentColor" stroke="none">
          <ellipse cx="50" cy="5" rx="2" ry="3.4" />
          <ellipse cx="50" cy="5" rx="2" ry="3.4" transform="rotate(72 50 9)" />
          <ellipse cx="50" cy="5" rx="2" ry="3.4" transform="rotate(144 50 9)" />
          <ellipse cx="50" cy="5" rx="2" ry="3.4" transform="rotate(216 50 9)" />
          <ellipse cx="50" cy="5" rx="2" ry="3.4" transform="rotate(288 50 9)" />
        </g>
        <path d="M47 94l3 2 3-2M47 97l3 2 3-2" vectorEffect="non-scaling-stroke" />
      </svg>
    </span>
  )
}
