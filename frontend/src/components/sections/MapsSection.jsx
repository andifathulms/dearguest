import { motion } from 'framer-motion'

export default function MapsSection({ events }) {
  const eventsWithMap = (events || []).filter(e => e.gmaps_embed_url)
  if (eventsWithMap.length === 0) return null

  return (
    <section className="maps-section">
      <h2 className="section-title">Lokasi Acara</h2>
      <div className="maps-grid">
        {eventsWithMap.map(event => (
          <motion.div
            key={event.id}
            className="map-item"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="map-event-label">
              {event.event_type === 'akad' ? 'Akad Nikah' : 'Resepsi'}
            </h3>
            <p className="map-venue">{event.venue_name}</p>
            <iframe
              className="map-iframe"
              src={event.gmaps_embed_url}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`Peta ${event.venue_name}`}
            />
          </motion.div>
        ))}
      </div>
    </section>
  )
}
