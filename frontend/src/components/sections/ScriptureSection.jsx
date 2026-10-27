import { useCopy } from '../../copy/CopyContext.jsx'
import { blessingFor, scriptureFor } from '../../copy/copy.js'

// The couple's own verse, or their variant's default, or nothing. Scripture
// text only ever comes from scripture.json (verbatim from its named source) or
// from the couple's own wording, rendered as text.
export default function ScriptureSection() {
  const { t, invitation, variant } = useCopy()
  const scripture = scriptureFor(invitation)
  // Tanzil's terms: wherever Quran text appears, credit and link tanzil.net.
  const quranShown = scripture?.quran || Boolean(blessingFor(variant))
  const attribution = quranShown && (
    <p className="scripture-source">
      <a href="https://tanzil.net" target="_blank" rel="noopener noreferrer">{t('scripture.quranAttribution')}</a>
    </p>
  )

  if (!scripture) return attribution ? <section className="scripture-section scripture-section--credit">{attribution}</section> : null
  return (
    <section className="scripture-section">
      {scripture.arabic && <p className="scripture-arabic" lang="ar" dir="rtl">{scripture.arabic}</p>}
      {scripture.text && <blockquote className="scripture-text">{scripture.text}</blockquote>}
      {scripture.ref && <p className="scripture-ref">{scripture.ref}</p>}
      {attribution}
    </section>
  )
}
