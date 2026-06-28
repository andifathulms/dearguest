import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'

// Crop the selected area to a square JPEG File.
async function getCroppedFile(src, area, name) {
  const image = await new Promise((res, rej) => {
    const img = new Image()
    img.onload = () => res(img)
    img.onerror = rej
    img.src = src
  })
  const canvas = document.createElement('canvas')
  canvas.width = area.width
  canvas.height = area.height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height)
  const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.9))
  return new File([blob], (name || 'foto').replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' })
}

export default function ImageCropper({ file, onCancel, onDone }) {
  const [src] = useState(() => URL.createObjectURL(file))
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [area, setArea] = useState(null)
  const [busy, setBusy] = useState(false)

  const onComplete = useCallback((_, areaPixels) => setArea(areaPixels), [])

  async function done() {
    if (!area) return
    setBusy(true)
    const cropped = await getCroppedFile(src, area, file.name)
    onDone(cropped)
  }

  return (
    <div className="crop-overlay" onClick={onCancel}>
      <div className="crop-modal" onClick={e => e.stopPropagation()}>
        <p className="crop-title">Atur posisi & zoom foto</p>
        <div className="crop-area">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onComplete}
          />
        </div>
        <input className="crop-zoom" type="range" min={1} max={3} step={0.05} value={zoom} onChange={e => setZoom(Number(e.target.value))} aria-label="Zoom" />
        <div className="crop-actions">
          <button className="ed-btn-ghost ed-btn ed-btn-sm" onClick={onCancel} disabled={busy}>Batal</button>
          <button className="ed-btn ed-btn-sm" onClick={done} disabled={busy}>{busy ? 'Memproses…' : 'Gunakan Foto'}</button>
        </div>
      </div>
    </div>
  )
}
