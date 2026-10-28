// Bugis monogram frame: a sulapa eppa (four-sided) square turned on its point,
// with a walasuji double border and small diamonds at the corners, drawn in
// code (gold via currentColor). The initials are live text in the centre.
export default function MonogramFrame({ className }) {
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M50 4 96 50 50 96 4 50z" vectorEffect="non-scaling-stroke" />
        <path d="M50 11 89 50 50 89 11 50z" vectorEffect="non-scaling-stroke" opacity="0.5" strokeDasharray="3 3" />
        <g fill="currentColor" stroke="none">
          <path d="M50 0l3 4-3 4-3-4z" />
          <path d="M100 50l-4 3-4-3 4-3z" />
          <path d="M50 100l-3-4 3-4 3 4z" />
          <path d="M0 50l4-3 4 3-4 3z" />
        </g>
      </svg>
    </span>
  )
}
