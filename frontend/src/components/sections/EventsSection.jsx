import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

function gcalUrl(event) {
  const start = new Date(event.datetime)
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000)
  const fmt = d => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const text = encodeURIComponent(event.event_type === 'akad' ? 'Akad Nikah' : 'Resepsi')
  const details = encodeURIComponent(`Acara pernikahan di ${event.venue_name}`)
  const loc = encodeURIComponent(event.address || event.venue_name)
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${fmt(start)}/${fmt(end)}&details=${details}&location=${loc}`
}

function EventCard({ event }) {
  const dt = new Date(event.datetime)
  const dateStr = format(dt, 'EEEE, d MMMM yyyy', { locale: id })
  const timeStr = format(dt, 'HH:mm') + ' WIB'

  return (
    <motion.div
      className="event-card"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <h3 className="event-type">
        {event.event_type === 'akad' ? 'Akad Nikah' : 'Resepsi'}
      </h3>
      <p className="event-date">{dateStr}</p>
      <p className="event-time">{timeStr}</p>
      <p className="event-venue">{event.venue_name}</p>
      <p className="event-address">{event.address}</p>
      <div className="event-actions">
        {event.gmaps_url && (
          <a href={event.gmaps_url} target="_blank" rel="noopener noreferrer" className="event-maps-link">
            Lihat Lokasi →
          </a>
        )}
        <a href={gcalUrl(event)} target="_blank" rel="noopener noreferrer" className="event-maps-link event-calendar-link">
          + Tambah ke Kalender
        </a>
      </div>
    </motion.div>
  )
}

export default function EventsSection({ events }) {
  if (!events || events.length === 0) return null
  return (
    <section className="events-section">
      <h2 className="section-title">Rangkaian Acara</h2>
      <div className="events-grid">
        {events.map(event => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  )
}
