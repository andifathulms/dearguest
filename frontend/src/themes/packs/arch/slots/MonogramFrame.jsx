// Arch monogram frame: a tall hairline arch (straight sides, a round top) with a second,
// fainter line inside it and one olive sprig at its foot, drawn in code (currentColor).
// The initials are live text in the centre.
export default function MonogramFrame({ className }) {
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M16 96V42a34 34 0 0 1 68 0v54z" vectorEffect="non-scaling-stroke" />
        <path d="M21 96V42a29 29 0 0 1 58 0v54" vectorEffect="non-scaling-stroke" opacity="0.4" />
        <path d="M62 95c-6-1-11-4.4-14-9.4M53 90.4c-2.6-.2-4.6-1.6-5.4-3.8 2.4-.2 4.4 1.2 5.4 3.8zM58 93.2c-.4-2.6.6-4.8 2.8-5.8.6 2.4-.6 4.6-2.8 5.8zM50 88c-.6-2.4.2-4.4 2.2-5.6.8 2.2 0 4.4-2.2 5.6z" vectorEffect="non-scaling-stroke" opacity="0.85" />
      </svg>
    </span>
  )
}
