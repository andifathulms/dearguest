// Palembang monogram frame: a double hairline oval crowned by a small cempaka
// (magnolia) bloom and footed by a short songket fringe, drawn in code (lak gold
// via currentColor). The initials are live text in the centre.
export default function MonogramFrame({ className }) {
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
        <ellipse cx="50" cy="52" rx="40" ry="42" vectorEffect="non-scaling-stroke" />
        <ellipse cx="50" cy="52" rx="36" ry="38" vectorEffect="non-scaling-stroke" opacity="0.45" />
        <path d="M50 2c2.4 2.6 2.4 6.4 0 9-2.4-2.6-2.4-6.4 0-9zM50 11c-3.4-.4-6-2.6-6.6-5.6 3.2-.2 5.8 2 6.6 5.6zM50 11c3.4-.4 6-2.6 6.6-5.6-3.2-.2-5.8 2-6.6 5.6z" fill="currentColor" stroke="none" />
        <path d="M44 94h12M45 94v5M47.75 94v5M50.5 94v5M53.25 94v5M56 94v5" vectorEffect="non-scaling-stroke" />
      </svg>
    </span>
  )
}
