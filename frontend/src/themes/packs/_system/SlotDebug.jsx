import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// Slot debug overlay (dev only): add ?slots=1 to an invitation URL. Every
// asset slot is outlined and labelled with its name, the size it renders at
// and whether the pack fills it; empty slots show a dashed box at the nominal
// @1x size from docs/theme-packs.md §4. Used to check commissioned art.
export const SLOT_DEBUG = import.meta.env.DEV
  && typeof window !== 'undefined'
  && new URLSearchParams(window.location.search).get('slots') === '1'

// Nominal @1x boxes (CSS px) from the slot table, for empty-slot placeholders.
const NOMINAL = {
  'cover-bg': [390, 844], texture: [256, 256], 'cover-frame': [340, 520],
  'corner-tl': [180, 180], 'corner-br': [180, 180], 'monogram-frame': [120, 120],
  'heading-ornament': [120, 24], divider: [320, 24], 'photo-mask': [200, 250],
  'photo-ring': [220, 275], 'hero-overlay': [390, 844], 'hero-bg': [390, 844], 'hero-top': [390, 336], 'hero-bottom': [390, 314], 'parallax-back': [390, 844],
  'parallax-mid': [390, 844], 'parallax-front': [390, 844], particles: [32, 32],
  opening: [390, 844], 'gift-card': [320, 200], 'og-template': [1200, 630],
}

export function SlotFrame({ slot, filled, className, children }) {
  if (!SLOT_DEBUG) return filled ? children : null
  const [w, h] = NOMINAL[slot] || [80, 80]
  return (
    <span className="pk-slot-debug-marker" style={{ display: 'contents' }} data-slot={slot} data-filled={filled ? '1' : '0'}>
      {filled ? children : (
        <span className={className} style={{ display: 'block', width: Math.min(w, 390), height: Math.min(h, 844) }} />
      )}
      <SlotOutline slot={slot} filled={filled} />
    </span>
  )
}

function SlotOutline({ slot, filled }) {
  const anchor = useRef(null)
  const [box, setBox] = useState(null)

  useEffect(() => {
    let raf
    const tick = () => {
      // The marker is display:contents; measure the slot element it wraps.
      const el = anchor.current?.parentElement?.firstElementChild
      if (el && el !== anchor.current) {
        const r = el.getBoundingClientRect()
        setBox(b => (b && b.x === r.x && b.y === r.y && b.w === r.width && b.h === r.height)
          ? b : { x: r.x, y: r.y, w: r.width, h: r.height })
      }
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <>
      <span ref={anchor} hidden />
      {box && createPortal(
        <div
          className="pk-slot-debug"
          data-filled={filled ? '1' : '0'}
          style={{ left: box.x, top: box.y, width: Math.max(box.w, 2), height: Math.max(box.h, 2) }}
        >
          <span className="pk-slot-debug-label">
            {slot} · {Math.round(box.w)}×{Math.round(box.h)} · {filled ? 'filled' : 'empty'}
          </span>
        </div>,
        document.body,
      )}
    </>
  )
}

// Styles injected once, only in debug mode.
if (SLOT_DEBUG && !document.getElementById('pk-slot-debug-style')) {
  const style = document.createElement('style')
  style.id = 'pk-slot-debug-style'
  style.textContent = `
    .pk-slot-debug { position: fixed; z-index: 2147483000; pointer-events: none;
      outline: 2px solid #12a150; outline-offset: -1px; background: rgba(18,161,80,.06); }
    .pk-slot-debug[data-filled="0"] { outline: 2px dashed #d0342c; background: rgba(208,52,44,.06); }
    .pk-slot-debug-label { position: absolute; top: 0; left: 0; padding: 2px 5px;
      font: 600 10px/1.3 ui-monospace, Menlo, monospace; white-space: nowrap;
      color: #fff; background: #12a150; }
    .pk-slot-debug[data-filled="0"] .pk-slot-debug-label { background: #d0342c; }
  `
  document.head.appendChild(style)
}
