import { usePack } from '../../themes/packs/_system/ThemeContext.jsx'
import ThemeAsset from '../../themes/packs/_system/ThemeAsset.jsx'

// Section heading. Legacy themes get exactly the old <h2>; theme packs also
// get their `heading-ornament` slot under it.
export default function SectionTitle({ children }) {
  const pack = usePack()
  return (
    <>
      <h2 className="section-title">{children}</h2>
      {pack && <ThemeAsset slot="heading-ornament" className="pk-heading-ornament" />}
    </>
  )
}
