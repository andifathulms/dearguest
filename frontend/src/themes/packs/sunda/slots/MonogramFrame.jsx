// Sunda monogram frame: a double hairline oval crowned by a small siger crest
// (three filigree points) and footed by a curl of mega mendung, drawn in code
// (gold via currentColor). The initials are live text in the centre.
export default function MonogramFrame({ className }) {
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
        <ellipse cx="50" cy="52" rx="40" ry="42" vectorEffect="non-scaling-stroke" />
        <ellipse cx="50" cy="52" rx="36" ry="38" vectorEffect="non-scaling-stroke" opacity="0.45" />
        <path d="M38 12c2-4 5-4 6-1 1-5 5-7 6-9 1 2 5 4 6 9 1-3 4-3 6 1-4 1-8 1.5-12 1.5S42 13 38 12z" fill="currentColor" stroke="none" />
        <path d="M40 95c0-3 3-4 5-2 1-3 5-3 6 0 2-2 5-1 5 2" vectorEffect="non-scaling-stroke" />
      </svg>
    </span>
  )
}
