import { createContext, useContext, useMemo } from 'react'
import { DEFAULT_VARIANT, makeT } from './copy.js'

// Provided once by ThemeRenderer around the cover and every theme family
// (legacy, WebGL, packs), so shared sections read copy without each theme
// passing it down.
const CopyContext = createContext({ variant: DEFAULT_VARIANT, t: makeT(DEFAULT_VARIANT), invitation: null })

export function CopyProvider({ invitation, children }) {
  const value = useMemo(() => ({
    variant: invitation.copy_variant || DEFAULT_VARIANT,
    t: makeT(invitation.copy_variant),
    invitation,
  }), [invitation])
  return <CopyContext.Provider value={value}>{children}</CopyContext.Provider>
}

export const useCopy = () => useContext(CopyContext)
