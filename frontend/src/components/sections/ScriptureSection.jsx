import { useCopy } from '../../copy/CopyContext.jsx'
import { blessingFor, scriptureFor } from '../../copy/copy.js'

// The couple's own verse, or their variant's default, or nothing. Scripture
// text only ever comes from scripture.json (verbatim from its named source) or
// from the couple's own wording, rendered as text.
export default function ScriptureSection() {
  const { t, invitation, variant } = useCopy()
  const scripture = scriptureFor(invitation)
  // No verse: nothing here. (With only the hero Bismillah, the Tanzil credit
  // sits under it in HeroSection instead.)
  if (!scripture) return null
  // Tanzil's terms: wherever Quran text appears, credit and link tanzil.net.
  const quranShown = scripture.quran || Boolean(blessingFor(variant))
  const attribution = quranShown && <QuranCredit t={t} className="scripture-source" />
  return (
    <section className="scripture-section">
      {scripture.arabic && <p className="scripture-arabic" lang="ar" dir="rtl">{scripture.arabic}</p>}
      {scripture.text && <blockquote className="scripture-text">{scripture.text}</blockquote>}
      {scripture.ref && <p className="scripture-ref">{scripture.ref}</p>}
      {attribution}
    </section>
  )
}

export function QuranCredit({ t, className }) {
  return (
    <p className={className}>
      <a href="https://tanzil.net" target="_blank" rel="noopener noreferrer">{t('scripture.quranAttribution')}</a>
    </p>
  )
}
