import { createContext, useContext } from 'react'

// Present only inside a theme pack. Shared section components check it to
// render pack-only hooks (asset slots, monogram, real hero <img>); outside a
// pack it's null and they render exactly what legacy themes always got.
export const PackContext = createContext(null)

export const usePack = () => useContext(PackContext)

// Turn a pack folder's globbed files into the lookup tables ThemeAsset uses.
// Called from each pack's index.js so Vite resolves the files at build time:
//   definePack({ manifest, urls, svgs, components })
// Keys in the globs are './assets/x.webp' etc.; the manifest uses 'assets/x.webp'.
export function definePack({ manifest, urls = {}, svgs = {}, components = {} }) {
  const strip = obj => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k.replace(/^\.\//, ''), v]))
  return { manifest, urls: strip(urls), svgs: strip(svgs), components: strip(components) }
}
