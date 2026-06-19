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

export default function GallerySection({ photos }) {
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
        {photos.map(photo => (
          <motion.div key={photo.id} className="gallery-item" variants={item}>
            <img src={photo.image} alt={photo.caption || 'Foto'} loading="lazy" />
            {photo.caption && <p className="gallery-caption">{photo.caption}</p>}
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
