import { useState } from 'react'
import { motion } from 'framer-motion'
import SectionTitle from './SectionTitle.jsx'
import { useCopy } from '../../copy/CopyContext.jsx'
import { eventLabel } from '../../copy/copy.js'

// "Buka Peta" is always there. The embedded map is a full Google Maps app
// (~40 requests), so it loads only when the guest asks for it. Its URL is built
// by the server from the venue (apps/invitations/maps.py), never pasted by a user.
function MapCard({ event }) {
  const { t } = useCopy()
  const [shown, setShown] = useState(false)
  return (
    <motion.div
      className="map-item"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <h3 className="map-event-label">{eventLabel(event, t)}</h3>
      <p className="map-venue">{event.venue_name}</p>
      {shown && event.embed_url ? (
        <iframe
          className="map-iframe"
          src={event.embed_url}
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          title={t('maps.frameTitle', { venue: event.venue_name })}
        />
      ) : event.embed_url && (
        <button type="button" className="map-load" onClick={() => setShown(true)}>{t('maps.show')}</button>
      )}
      {event.maps_url && (
        <a className="event-maps-link map-open" href={event.maps_url} target="_blank" rel="noopener noreferrer">
          {t('events.openMap')} →
        </a>
      )}
    </motion.div>
  )
}

export default function MapsSection({ events }) {
  const { t } = useCopy()
  const located = (events || []).filter(e => e.maps_url || e.embed_url)
  if (located.length === 0) return null
  return (
    <section className="maps-section">
      <SectionTitle>{t('maps.title')}</SectionTitle>
      <div className="maps-grid">
        {located.map(event => <MapCard key={event.id} event={event} />)}
      </div>
    </section>
  )
}
