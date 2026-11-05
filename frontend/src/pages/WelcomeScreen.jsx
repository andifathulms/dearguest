import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/client.js'
import { getTheme } from '../themes/registry.js'
import { seatLabel } from '../utils/seat.js'
import './WelcomeScreen.css'

const POLL_MS = 4000
const SHOW_MS = 7000
const packModules = import.meta.glob('../themes/packs/*/index.js')

// The invitation's own pack: tokens and fonts (by importing it) and its
// painted cover as the backdrop.
function usePackArt(themeId) {
  const [art, setArt] = useState(null)
  useEffect(() => {
    const entry = getTheme(themeId) || getTheme('sage')
    const load = entry && packModules[`../themes/packs/${entry.pack.dir}/index.js`]
    if (!load) return
    load().then(({ default: pack }) => {
      const slot = pack.manifest.slots?.['cover-bg'] || {}
      const src = slot.desktop?.src || slot.src
      setArt({ dir: entry.pack.dir, image: src ? pack.urls[src] : null })
    }).catch(() => {})
  }, [themeId])
  return art
}

// Layar sambutan (/penerima/:token/layar): a TV or projector at the entrance.
// Each new check-in is greeted by name for a few seconds; in between it shows
// the couple's names. Opened from the usher screen, same token.
export default function WelcomeScreen() {
  const { token } = useParams()
  const [info, setInfo] = useState(null)
  const [problem, setProblem] = useState('')
  const [current, setCurrent] = useState(null)
  const queue = useRef([])
  const seen = useRef(null)   // ids already greeted (null until the first poll)
  const art = usePackArt(info?.theme)

  useEffect(() => {
    document.title = 'Layar Sambutan'
    let stopped = false
    async function poll() {
      try {
        const { data } = await api.get(`/usher/${token}/arrivals/`)
        if (stopped) return
        setInfo(data)
        setProblem('')
        if (seen.current === null) {
          // People already inside aren't greeted again when the screen opens.
          seen.current = new Set(data.arrivals.map(a => a.id))
        } else {
          const fresh = data.arrivals.filter(a => !seen.current.has(a.id)).reverse()   // oldest first
          fresh.forEach(a => seen.current.add(a.id))
          queue.current.push(...fresh)
        }
      } catch (err) {
        if (!stopped) setProblem(err.response?.data?.detail || 'Menyambung ulang…')
      }
    }
    poll()
    const timer = setInterval(poll, POLL_MS)
    return () => { stopped = true; clearInterval(timer) }
  }, [token])

  // One greeting at a time, each for SHOW_MS. The queue is read here, not in
  // a state updater: StrictMode runs updaters twice and would drop a guest.
  const shown = useRef(null)
  useEffect(() => {
    const timer = setInterval(() => {
      const cur = shown.current
      if (cur && Date.now() - cur.since < SHOW_MS) return
      const next = queue.current.shift()
      const value = next ? { ...next, since: Date.now() } : null
      if (value !== cur) {
        shown.current = value
        setCurrent(value)
      }
    }, 500)
    return () => clearInterval(timer)
  }, [])

  function fullscreen() {
    document.documentElement.requestFullscreen?.().catch(() => {})
  }

  const names = info ? [info.couple.bride, info.couple.groom].filter(Boolean) : []

  return (
    <div className="pk-root ws" data-pack={art?.dir || 'sage'} onClick={fullscreen}>
      {art?.image && <img className="ws-art" src={art.image} alt="" aria-hidden="true" />}
      <div className="ws-veil" aria-hidden="true" />
      <main className="ws-card" aria-live="polite">
        {current ? (
          <div className="ws-greet" key={current.id}>
            <p className="ws-label">Selamat datang</p>
            <p className="ws-name">{current.name}</p>
            <p className="ws-thanks">Terima kasih telah hadir</p>
            {current.table && <p className="ws-seat">Silakan menuju <strong>{seatLabel(current.table)}</strong></p>}
          </div>
        ) : (
          <div className="ws-idle">
            <p className="ws-label">Selamat datang di pernikahan</p>
            {names.length > 0 && (
              <p className="ws-couple">
                {names[0]}{names[1] && <><span className="ws-amp"> &amp; </span>{names[1]}</>}
              </p>
            )}
          </div>
        )}
      </main>
      {problem && <p className="ws-problem">{problem}</p>}
    </div>
  )
}
