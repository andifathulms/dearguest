// Betawi monogram frame: a hairline oval with a paper flower from the kembang kelapa at
// its crown and a short tumpal band (pucuk rebung triangles) at its foot, drawn in code
// (currentColor). The initials are live text in the centre.
export default function MonogramFrame({ className }) {
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
        <ellipse cx="50" cy="51" rx="40" ry="42" vectorEffect="non-scaling-stroke" />
        <ellipse cx="50" cy="51" rx="36" ry="38" vectorEffect="non-scaling-stroke" opacity="0.4" />
        <path d="M50 4.4c1.6-2.8 4.6-2.4 4 .6 3-.6 3.4 2.4.6 4 2.8 1.6 2.4 4.6-.6 4 .6 3-2.4 3.4-4 .6-1.6 2.8-4.6 2.4-4-.6-3 .6-3.4-2.4-.6-4-2.8-1.6-2.4-4.6.6-4-.6-3 2.4-3.4 4-.6z" fill="var(--dg-bg)" vectorEffect="non-scaling-stroke" />
        <circle cx="50" cy="9" r="1.4" fill="currentColor" stroke="none" />
        <path d="M34 90l4 6 4-6 4 6 4-6 4 6 4-6 4 6 4-6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      </svg>
    </span>
  )
}
