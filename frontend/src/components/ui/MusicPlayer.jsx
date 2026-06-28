import { useRef, useState, useEffect } from 'react'

function MusicNoteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="6.5" cy="17.5" r="2.5" />
      <circle cx="17.5" cy="15.5" r="2.5" />
      <path d="M9 17.5V6l11-2v9.5" />
    </svg>
  )
}

function MutedIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5L6 9H3v6h3l5 4z" />
      <line x1="22" y1="9" x2="16" y2="15" />
      <line x1="16" y1="9" x2="22" y2="15" />
    </svg>
  )
}

export default function MusicPlayer({ musicUrl }) {
  const audioRef = useRef(null)
  const [unmuted, setUnmuted] = useState(false)

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = true
      audioRef.current.play().catch(() => {})
    }
  }, [musicUrl])

  // Start playing (unmuted) when the guest opens the invitation via the cover gate.
  useEffect(() => {
    function handleOpen() {
      const el = audioRef.current
      if (!el) return
      el.muted = false
      el.play().catch(() => {})
      setUnmuted(true)
    }
    window.addEventListener('invitation:open', handleOpen)
    return () => window.removeEventListener('invitation:open', handleOpen)
  }, [])

  function toggle() {
    if (!audioRef.current) return
    audioRef.current.muted = unmuted
    if (!unmuted) audioRef.current.play().catch(() => {})
    setUnmuted(u => !u)
  }

  if (!musicUrl) return null

  return (
    <>
      <audio ref={audioRef} src={musicUrl} autoPlay loop />
      <button
        className={`music-btn ${unmuted ? 'music-playing' : ''}`}
        onClick={toggle}
        aria-label={unmuted ? 'Matikan musik' : 'Nyalakan musik'}
      >
        {unmuted ? <MusicNoteIcon /> : <MutedIcon />}
      </button>
    </>
  )
}
