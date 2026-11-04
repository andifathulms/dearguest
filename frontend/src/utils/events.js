// The event the countdown targets: the one the couple marked primary (the
// server keeps exactly one), falling back to the first for older data.
export const primaryEvent = events => (events || []).find(e => e.is_primary) || (events || [])[0] || null

// Who sees an event: no `groups` = every guest; otherwise only guests in one
// of the groups (case and extra spaces ignored). Same rule as the backend's
// audience.py. `group` is null for a general link or the WhatsApp group message.
const normGroup = name => String(name || '').split(/\s+/).filter(Boolean).join(' ').toLowerCase()
export const seesEvent = (event, group) =>
  !event.groups?.length || (group != null && event.groups.some(g => normGroup(g) === normGroup(group)))
export const eventsFor = (events, group) => (events || []).filter(e => seesEvent(e, group))
