import { useEffect, useRef, useState } from 'react'

const SCAN_EVERY_MS = 150
const SCAN_WIDTH = 480   // frames are scaled down first: faster, and plenty for a phone screen QR

function cameraError(err) {
  if (!navigator.mediaDevices?.getUserMedia) return 'Kamera tidak tersedia di browser ini. Cari tamu dengan nama.'
  if (err?.name === 'NotAllowedError') return 'Izin kamera ditolak. Izinkan kamera untuk situs ini di pengaturan browser, atau cari tamu dengan nama.'
  if (err?.name === 'NotFoundError') return 'Kamera tidak ditemukan. Cari tamu dengan nama.'
  return 'Kamera tidak bisa dibuka. Tutup aplikasi lain yang memakai kamera, atau cari tamu dengan nama.'
}

// Full-screen camera that reads QR codes with jsQR (works on iPhone Safari,
// which has no BarcodeDetector). Calls onCode(text) once per code; the parent
// closes it. jsQR (~45 KB gz) loads only when the scanner opens.
export default function QrScanner({ onCode, onClose }) {
  const videoRef = useRef(null)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const onCodeRef = useRef(onCode)
  onCodeRef.current = onCode

  useEffect(() => {
    let stream = null
    let timer = null
    let stopped = false
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    async function start() {
      try {
        const [{ default: jsQR }, media] = await Promise.all([
          import('jsqr'),
          navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false }),
        ])
        stream = media
        if (stopped) return
        const video = videoRef.current
        video.srcObject = stream
        await video.play()
        setReady(true)
        let last = ''
        const tick = () => {
          if (stopped) return
          if (video.readyState >= 2 && video.videoWidth) {
            canvas.width = SCAN_WIDTH
            canvas.height = Math.round(SCAN_WIDTH * video.videoHeight / video.videoWidth)
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            const frame = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const code = jsQR(frame.data, frame.width, frame.height, { inversionAttempts: 'dontInvert' })
            if (code?.data && code.data !== last) {
              last = code.data
              navigator.vibrate?.(60)
              onCodeRef.current(code.data)
            }
          }
          timer = setTimeout(tick, SCAN_EVERY_MS)
        }
        tick()
      } catch (err) {
        if (!stopped) setError(cameraError(err))
      }
    }
    start()
    return () => {
      stopped = true
      clearTimeout(timer)
      stream?.getTracks().forEach(t => t.stop())
    }
  }, [])

  return (
    <div className="us-scan" role="dialog" aria-modal="true" aria-label="Scan QR tamu">
      <video ref={videoRef} className="us-scan-video" playsInline muted />
      {!error && <div className="us-scan-frame" aria-hidden="true" />}
      <p className="us-scan-hint" role="status">
        {error || (ready ? 'Arahkan ke QR di HP atau kartu undangan tamu' : 'Membuka kamera…')}
      </p>
      <button type="button" className="dg-btn dg-btn-gold us-scan-close" onClick={onClose}>Tutup kamera</button>
    </div>
  )
}
