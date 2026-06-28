import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const item = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
}

function Lightbox({ photos, index, setIndex }) {
  const open = index !== null
  const go = step => setIndex(i => (i + step + photos.length) % photos.length)

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') setIndex(null)
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey) }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null
  const photo = photos[index]
  return (
    <div className="lightbox" onClick={() => setIndex(null)}>
      <button className="lightbox-close" onClick={() => setIndex(null)} aria-label="Tutup">×</button>
      {photos.length > 1 && (
        <button className="lightbox-nav prev" onClick={e => { e.stopPropagation(); go(-1) }} aria-label="Sebelumnya">‹</button>
      )}
      <figure className="lightbox-fig" onClick={e => e.stopPropagation()}>
        <img src={photo.image} alt={photo.caption || 'Foto'} />
        {photo.caption && <figcaption>{photo.caption}</figcaption>}
      </figure>
      {photos.length > 1 && (
        <button className="lightbox-nav next" onClick={e => { e.stopPropagation(); go(1) }} aria-label="Berikutnya">›</button>
      )}
    </div>
  )
}

export default function GallerySection({ photos }) {
  const [index, setIndex] = useState(null)
  if (!photos || photos.length === 0) return null
  return (
    <section className="gallery-section">
      <h2 className="section-title">Galeri</h2>
      <motion.div
        className="gallery-grid"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
      >
        {photos.map((photo, i) => (
          <motion.div key={photo.id} className="gallery-item" variants={item}>
            <img
              src={photo.image}
              alt={photo.caption || 'Foto'}
              loading="lazy"
              style={{ cursor: 'zoom-in' }}
              onClick={() => setIndex(i)}
            />
            {photo.caption && <p className="gallery-caption">{photo.caption}</p>}
          </motion.div>
        ))}
      </motion.div>
      <Lightbox photos={photos} index={index} setIndex={setIndex} />
    </section>
  )
}
