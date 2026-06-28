import { motion } from 'framer-motion'

// Convert common YouTube watch links into an embeddable URL; others fall back to a link button.
function toEmbed(url) {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v')
      return v ? `https://www.youtube.com/embed/${v}` : null
    }
    if (u.hostname.includes('youtu.be')) {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`
    }
  } catch {
    return null
  }
  return null
}

export default function LiveStreamSection({ url }) {
  if (!url) return null
  const embed = toEmbed(url)

  return (
    <motion.section
      className="maps-section live-section"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <h2 className="section-title">Live Streaming</h2>
      <p className="amplod-desc">
        Tidak dapat hadir secara langsung? Saksikan momen bahagia kami melalui siaran langsung.
      </p>
      {embed ? (
        <div className="maps-grid">
          <div className="map-item">
            <iframe
              className="map-iframe"
              src={embed}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
              title="Live streaming pernikahan"
            />
          </div>
        </div>
      ) : (
        <div className="wa-share">
          <a className="wa-share-btn" href={url} target="_blank" rel="noopener noreferrer">
            Tonton Live Streaming →
          </a>
        </div>
      )}
    </motion.section>
  )
}
