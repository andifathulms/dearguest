// Batak monogram frame: a double hairline oval crowned by a small upswept
// rumah bolon roof and footed by a short ulos fringe, drawn in code (gorga red
// via currentColor). The initials are live text in the centre.
export default function MonogramFrame({ className }) {
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
        <ellipse cx="50" cy="52" rx="40" ry="42" vectorEffect="non-scaling-stroke" />
        <ellipse cx="50" cy="52" rx="36" ry="38" vectorEffect="non-scaling-stroke" opacity="0.45" />
        <path d="M34 4c4 4 7 6 16 6s12-2 16-6c-1 4-4 8-8 9H42c-4-1-7-5-8-9z" fill="currentColor" stroke="none" />
        <path d="M43 94v5M46.5 94v5M50 94v5M53.5 94v5M57 94v5" vectorEffect="non-scaling-stroke" />
      </svg>
    </span>
  )
}
