// Date and time formatting for invitations. Pure (no Vite globals) so it runs
// under `node --test`. Every call passes an explicit timeZone: event times are
// shown in the EVENT's zone (WIB / WITA / WIT), never the guest's device zone,
// and date-only values ('YYYY-MM-DD') are formatted as calendar dates, never
// parsed as UTC midnight (which shows the previous day west of UTC).

const LOCALE = 'id-ID'

export const TZ_LABEL = { 'Asia/Jakarta': 'WIB', 'Asia/Makassar': 'WITA', 'Asia/Jayapura': 'WIT' }
export const EVENT_TIMEZONES = Object.keys(TZ_LABEL)

const fmt = (opts, tz) => new Intl.DateTimeFormat(LOCALE, { ...opts, timeZone: tz })
const DATE_LONG = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
const TIME = { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }

// '2026-12-12' -> 'Sabtu, 12 Desember 2026' on every device.
export function formatDateOnly(iso, opts = DATE_LONG) {
  if (!iso) return ''
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return ''
  return fmt(opts, 'UTC').format(new Date(Date.UTC(y, m - 1, d)))
}

export const formatEventDate = (iso, tz) => (iso ? fmt(DATE_LONG, tz).format(new Date(iso)) : '')

// '08.00' (clock only)
export const formatClock = (iso, tz) => (iso ? fmt(TIME, tz).format(new Date(iso)) : '')

// '08.00 WITA'
export function formatEventTime(iso, tz) {
  if (!iso) return ''
  return `${formatClock(iso, tz)} ${TZ_LABEL[tz] || ''}`.trim()
}

// '08.00 – 10.00 WIB', or '08.00 WIB s.d. selesai' when there's no end time.
export function formatEventRange(startIso, endIso, tz, untilLabel) {
  if (!startIso) return ''
  const zone = TZ_LABEL[tz] || ''
  return endIso
    ? `${formatClock(startIso, tz)} – ${formatClock(endIso, tz)} ${zone}`.trim()
    : `${formatClock(startIso, tz)} ${zone} ${untilLabel}`.replace(/\s+/g, ' ').trim()
}

export const deviceTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone

// Minutes `tz` is ahead of UTC at `date`.
function offsetMinutes(date, tz) {
  const p = Object.fromEntries(fmt({ year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }, tz)
    .formatToParts(date).map(x => [x.type, x.value]))
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second)
  return Math.round((asUtc - date.getTime()) / 60000)
}

// The time in the guest's own zone, when it differs from the event's:
// '07.00 WIB' for a WITA event seen from Jakarta; null when they match.
export function localTimeNote(iso, tz, deviceTz = deviceTimeZone()) {
  if (!iso || !deviceTz) return null
  const date = new Date(iso)
  if (offsetMinutes(date, deviceTz) === offsetMinutes(date, tz)) return null
  const zone = TZ_LABEL[deviceTz] || fmt({ timeZoneName: 'short' }, deviceTz).formatToParts(date).find(p => p.type === 'timeZoneName')?.value || deviceTz
  return `${fmt(TIME, deviceTz).format(date)} ${zone}`
}

// Editor <input type="datetime-local"> value: wall-clock time in the event's zone.
export function toLocalInputValue(iso, tz) {
  if (!iso) return ''
  const p = Object.fromEntries(fmt({ year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }, tz)
    .formatToParts(new Date(iso)).map(x => [x.type, x.value]))
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`
}

// '2026-12-12T08:00' in 'Asia/Makassar' -> '2026-12-12T08:00:00+08:00'
export function fromLocalInput(value, tz) {
  if (!value) return null
  const [d, t] = value.split('T')
  const [y, m, day] = d.split('-').map(Number)
  const [hh, mm] = t.split(':').map(Number)
  const guess = Date.UTC(y, m - 1, day, hh, mm)
  const off = offsetMinutes(new Date(guess - offsetMinutes(new Date(guess), tz) * 60000), tz)
  const sign = off >= 0 ? '+' : '-'
  const abs = Math.abs(off)
  return `${d}T${t.slice(0, 5)}:00${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`
}

// Google Calendar "dates" value in the event's zone (used with ctz=<tz>).
export function googleCalendarDates(startIso, endIso, tz) {
  const stamp = iso => toLocalInputValue(iso, tz).replace(/[-:]/g, '') + '00'
  return `${stamp(startIso)}/${stamp(endIso)}`
}
