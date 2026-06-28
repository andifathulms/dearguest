// Downscale + re-encode large photos before upload so invitations stay light
// on mobile data. Returns the original file if it's already small or on error.
export async function compressImage(file, maxDim = 1600, quality = 0.82) {
  if (!file || !file.type?.startsWith('image/')) return file
  const src = URL.createObjectURL(file)
  try {
    const img = await new Promise((res, rej) => {
      const i = new Image()
      i.onload = () => res(i)
      i.onerror = rej
      i.src = src
    })
    const { width, height } = img
    if (width <= maxDim && height <= maxDim && file.size < 1_000_000) return file
    const scale = Math.min(1, maxDim / Math.max(width, height))
    const w = Math.round(width * scale)
    const h = Math.round(height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    canvas.getContext('2d').drawImage(img, 0, 0, w, h)
    const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', quality))
    if (!blob || blob.size >= file.size) return file
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' })
  } catch {
    return file
  } finally {
    URL.revokeObjectURL(src)
  }
}
