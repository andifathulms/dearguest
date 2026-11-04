// Tropis monogram frame: a hairline oval with a small moth orchid (anggrek bulan) at
// its crown and two crossed leaves at its foot, drawn in code (currentColor). The
// initials are live text in the centre.
export default function MonogramFrame({ className }) {
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
        <ellipse cx="50" cy="52" rx="40" ry="42" vectorEffect="non-scaling-stroke" />
        <ellipse cx="50" cy="52" rx="36" ry="38" vectorEffect="non-scaling-stroke" opacity="0.4" />
        <path d="M50 9c-2.6-1-3.4-4.4-1.4-6.2 1.6 1 1.8 3.8 1.4 6.2zM50 9c2.6-1 3.4-4.4 1.4-6.2-1.6 1-1.8 3.8-1.4 6.2zM50 9c-4.4.6-7.6-1.4-8-4.4 3-.6 6.2 1.4 8 4.4zM50 9c4.4.6 7.6-1.4 8-4.4-3-.6-6.2 1.4-8 4.4z" fill="currentColor" stroke="none" opacity="0.9" />
        <circle cx="50" cy="9.6" r="1.2" fill="currentColor" stroke="none" />
        <path d="M50 96c-5-.6-9.4-3-11-7 4.6-.4 9 2.2 11 7zM50 96c5-.6 9.4-3 11-7-4.6-.4-9 2.2-11 7z" vectorEffect="non-scaling-stroke" />
      </svg>
    </span>
  )
}
