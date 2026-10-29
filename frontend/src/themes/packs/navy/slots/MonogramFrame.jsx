// Navy monogram frame: a double hairline oval crowned by a small open rose and
// footed by a sprig of baby's breath, drawn in code (gold via currentColor). The
// initials are live text in the centre.
export default function MonogramFrame({ className }) {
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
        <ellipse cx="50" cy="52" rx="40" ry="42" vectorEffect="non-scaling-stroke" />
        <ellipse cx="50" cy="52" rx="36" ry="38" vectorEffect="non-scaling-stroke" opacity="0.45" />
        <circle cx="50" cy="8" r="4.6" vectorEffect="non-scaling-stroke" />
        <path d="M50 4.4c-2.4 1.6-2.4 5.6 0 7.2M46.4 8c1.6-2.4 5.6-2.4 7.2 0" vectorEffect="non-scaling-stroke" />
        <path d="M50 99v-5M50 95.4l-3.4-2.6M50 95.4l3.4-2.6" vectorEffect="non-scaling-stroke" />
        <g fill="currentColor" stroke="none"><circle cx="46.2" cy="92.4" r="1" /><circle cx="53.8" cy="92.4" r="1" /><circle cx="50" cy="93.2" r="1" /></g>
      </svg>
    </span>
  )
}
