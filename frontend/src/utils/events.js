// The event the countdown targets: the one the couple marked primary (the
// server keeps exactly one), falling back to the first for older data.
export const primaryEvent = events => (events || []).find(e => e.is_primary) || (events || [])[0] || null
