import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import SectionTitle from './SectionTitle.jsx'
import { useCopy } from '../../copy/CopyContext.jsx'
import ResponsiveImg, { preloadImage } from '../ui/ResponsiveImg.jsx'

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

const SWIPE_PX = 50

// Full-screen viewer: swipe, arrow keys, Escape, and the phone's back button
// (opening pushes a history entry) all work. Neighbours are preloaded.
function Lightbox({ photos, index, setIndex, returnFocus }) {
  const { t } = useCopy()
  const open = index !== null
  const closeRef = useRef(null)
  const swipe = useRef(null)
  const swiped = useRef(false)
  const go = step => setIndex(i => (i + step + photos.length) % photos.length)

  // Back button closes: one history entry per opening, popped on close.
  useEffect(() => {
    if (!open) return
    window.history.pushState({ dgLightbox: true }, '')
    const onPop = () => setIndex(null)
    window.addEventListener('popstate', onPop)
    return () => {
      window.removeEventListener('popstate', onPop)
      if (window.history.state?.dgLightbox) window.history.back()
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') setIndex(null)
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
    }
    const opener = returnFocus.current
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
      opener?.focus()
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open || photos.length < 2) return
    preloadImage(photos[(index + 1) % photos.length])
    preloadImage(photos[(index - 1 + photos.length) % photos.length])
  }, [open, index, photos])

  if (!open) return null
  const photo = photos[index]

  const onPointerDown = e => { swipe.current = { x: e.clientX, y: e.clientY } }
  const onPointerUp = e => {
    const start = swipe.current
    swipe.current = null
    if (!start || photos.length < 2) return
    const dx = e.clientX - start.x
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(e.clientY - start.y)) {
      swiped.current = true   // the click that follows a swipe must not close the viewer
      go(dx < 0 ? 1 : -1)
    }
  }
  const onBackdropClick = () => {
    if (swiped.current) swiped.current = false
    else setIndex(null)
  }

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={t('gallery.title')}
      onClick={onBackdropClick}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => { swipe.current = null }}
    >
      <button ref={closeRef} className="lightbox-close" onClick={() => setIndex(null)} aria-label={t('gallery.close')}>×</button>
      {photos.length > 1 && (
        <p className="lightbox-counter" aria-live="polite">{t('gallery.counter', { n: index + 1, total: photos.length })}</p>
      )}
      {photos.length > 1 && (
        <button className="lightbox-nav prev" onClick={e => { e.stopPropagation(); go(-1) }} aria-label={t('gallery.prev')}>‹</button>
      )}
      <figure className="lightbox-fig" onClick={e => { e.stopPropagation(); swiped.current = false }}>
        <ResponsiveImg key={photo.id} src={photo.image} meta={photo.image_meta} sizes="100vw" alt={photo.caption || t('gallery.photo')} draggable="false" />
        {photo.caption && <figcaption>{photo.caption}</figcaption>}
      </figure>
      {photos.length > 1 && (
        <button className="lightbox-nav next" onClick={e => { e.stopPropagation(); go(1) }} aria-label={t('gallery.next')}>›</button>
      )}
    </div>
  )
}

export default function GallerySection({ photos }) {
  const { t } = useCopy()
  const [index, setIndex] = useState(null)
  const opener = useRef(null)

  if (!photos || photos.length === 0) return null
  return (
    <section className="gallery-section">
      <SectionTitle>{t('gallery.title')}</SectionTitle>
      <motion.div
        className="gallery-grid"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
      >
        {photos.map((photo, i) => (
          <motion.div key={photo.id} className="gallery-item" variants={item}>
            <ResponsiveImg
              src={photo.image}
              meta={photo.image_meta}
              sizes="(min-width: 900px) 33vw, 50vw"
              alt={photo.caption || t('gallery.photo')}
              loading="lazy"
              decoding="async"
              tabIndex={0}
              role="button"
              style={{ cursor: 'zoom-in' }}
              onClick={e => { opener.current = e.currentTarget; setIndex(i) }}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); opener.current = e.currentTarget; setIndex(i) } }}
            />
            {photo.caption && <p className="gallery-caption">{photo.caption}</p>}
          </motion.div>
        ))}
      </motion.div>
      <Lightbox photos={photos} index={index} setIndex={setIndex} returnFocus={opener} />
    </section>
  )
}
