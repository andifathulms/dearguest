// Inline icon set for the marketing site and app (no emoji, crisp at any size).
const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' }

export const Icon = {
  check: <svg viewBox="0 0 24 24" {...stroke} strokeWidth="2.2" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>,
  plus: <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>,
  arrow: <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>,
  back: <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>,
  external: <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>,
  menu: <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true"><path d="M4 8h16M4 16h16" /></svg>,
  close: <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>,
  quote: <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M10 7H6a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2v1a2 2 0 0 1-2 2v2a4 4 0 0 0 4-4V7zm10 0h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2v1a2 2 0 0 1-2 2v2a4 4 0 0 0 4-4V7z" /></svg>,
  whatsapp: <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-1.6-.8-2.6-1.4-3.7-3.2-.3-.5.3-.4.8-1.4.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 5 4.3 1.8.8 2.5.8 3.4.7.6-.1 1.7-.7 1.9-1.4.2-.6.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2z" /></svg>,
}
