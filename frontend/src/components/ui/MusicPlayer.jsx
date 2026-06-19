import { useRef, useState, useEffect } from 'react'

export default function MusicPlayer({ musicUrl }) {
  const audioRef = useRef(null)
  const [unmuted, setUnmuted] = useState(false)

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = true
      audioRef.current.play().catch(() => {})
    }
  }, [musicUrl])

  function toggle() {
    if (!audioRef.current) return
    audioRef.current.muted = unmuted
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
        {unmuted ? '🎵' : '🔇'}
      </button>
    </>
  )
}
