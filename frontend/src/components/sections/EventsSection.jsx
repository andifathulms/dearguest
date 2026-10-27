import { motion } from 'framer-motion'
import SectionTitle from './SectionTitle.jsx'
import { useCopy } from '../../copy/CopyContext.jsx'
import { eventLabel } from '../../copy/copy.js'
import { API_BASE } from '../../api/client.js'
import { formatEventDate, formatEventRange, googleCalendarDates, localTimeNote } from '../../utils/dates.js'

const TWO_HOURS = 2 * 60 * 60 * 1000

function googleCalendarUrl(event, title) {
  const end = event.end || new Date(new Date(event.start).getTime() + TWO_HOURS).toISOString()
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: googleCalendarDates(event.start, end, event.timezone),
    ctz: event.timezone,
    location: [event.venue_name, event.address].filter(Boolean).join(', '),
    details: event.maps_url || '',
  })
  return `https://calendar.google.com/calendar/render?${params}`
}

// One "Simpan ke Kalender" control: Google Calendar, or an .ics file that
// iPhone / Outlook open natively.
function CalendarMenu({ event, title, slug, t }) {
  return (
    <details className="event-calendar">
      <summary className="event-maps-link event-calendar-link">+ {t('events.calendar')}</summary>
      <div className="event-calendar-menu">
        <a href={googleCalendarUrl(event, title)} target="_blank" rel="noopener noreferrer">{t('events.calendarGoogle')}</a>
        <a href={`${API_BASE}/invitations/${slug}/events/${event.id}/calendar.ics`} download>{t('events.calendarIcs')}</a>
      </div>
    </details>
  )
}

function EventCard({ event }) {
  const { t, invitation } = useCopy()
  const title = eventLabel(event, t)
  const local = localTimeNote(event.start, event.timezone)

  return (
    <motion.div
      className="event-card"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <h3 className="event-type">{title}</h3>
      <p className="event-date">{formatEventDate(event.start, event.timezone)}</p>
      <p className="event-time">{formatEventRange(event.start, event.end, event.timezone, t('events.until'))}</p>
      {local && <p className="event-local-time">{t('events.localTime', { time: local })}</p>}
      <p className="event-venue">{event.venue_name}</p>
      <p className="event-address">{event.address}</p>
      {event.dress_code && <p className="event-dresscode">{t('events.dressCode')}: <strong>{event.dress_code}</strong></p>}
      <div className="event-actions">
        {event.maps_url && (
          <a href={event.maps_url} target="_blank" rel="noopener noreferrer" className="event-maps-link">
            {t('events.openMap')} →
          </a>
        )}
        <CalendarMenu event={event} title={title} slug={invitation?.slug} t={t} />
      </div>
    </motion.div>
  )
}

export default function EventsSection({ events, dressCode }) {
  const { t } = useCopy()
  if (!events || events.length === 0) return null
  return (
    <section className="events-section">
      <SectionTitle>{t('events.title')}</SectionTitle>
      <div className="events-grid">
        {events.map(event => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
      {dressCode && (
        <p className="events-dresscode">{t('events.dressCode')}: <strong>{dressCode}</strong></p>
      )}
    </section>
  )
}
