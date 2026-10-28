// Minang monogram frame: a double hairline oval crowned by a small gonjong
// (curved roof horn) and footed by a pucuak rabuang triangle, drawn in code
// (gold via currentColor). The initials are live text in the centre.
export default function MonogramFrame({ className }) {
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
        <ellipse cx="50" cy="52" rx="40" ry="42" vectorEffect="non-scaling-stroke" />
        <ellipse cx="50" cy="52" rx="36" ry="38" vectorEffect="non-scaling-stroke" opacity="0.45" />
        <path d="M34 11c6 3 11 3 16-1 5 4 10 4 16 1-2 4-7 6-16 6s-14-2-16-6z" fill="currentColor" stroke="none" />
        <path d="M50 92l4 6h-8z" fill="currentColor" stroke="none" />
      </svg>
    </span>
  )
}
