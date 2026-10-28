// Javanese monogram frame: a wajik (diamond) of double hairlines with a kawung
// flower at each point, drawn in code (gold via currentColor). The initials are
// live text in the centre.
const KAWUNG = [[50, 3], [97, 50], [50, 97], [3, 50]]

export default function MonogramFrame({ className }) {
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M50 6 94 50 50 94 6 50z" vectorEffect="non-scaling-stroke" />
        <path d="M50 12 88 50 50 88 12 50z" vectorEffect="non-scaling-stroke" opacity="0.45" />
        <g fill="currentColor" stroke="none">
          {KAWUNG.map(([x, y]) => (
            <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
              <ellipse cy="-2" rx="1.1" ry="1.8" />
              <ellipse cy="2" rx="1.1" ry="1.8" />
              <ellipse cx="-2" rx="1.8" ry="1.1" />
              <ellipse cx="2" rx="1.8" ry="1.1" />
            </g>
          ))}
        </g>
      </svg>
    </span>
  )
}
