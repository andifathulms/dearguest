import { createContext, useContext } from 'react'

// The guest a personal link (/<slug>/<code>, legacy ?g=) belongs to, resolved
// once by InvitationPage from the couple's guest list: { code, name, maxPax },
// or null for a general link. Read by the RSVP form.
const GuestContext = createContext(null)

export const GuestProvider = GuestContext.Provider
export const useGuest = () => useContext(GuestContext)
