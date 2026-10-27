import { shareUrl } from '../../utils/publicUrl.js'
import { useCopy } from '../../copy/CopyContext.jsx'

export default function WhatsAppShare({ slug, brideName, groomName }) {
  const { t } = useCopy()
  const url = shareUrl(slug)
  const text = encodeURIComponent(
    t('share.text', { greeting: t('share.greeting'), bride: brideName, groom: groomName, url })
  )
  const waUrl = `https://wa.me/?text=${text}`

  return (
    <div className="wa-share">
      <a href={waUrl} target="_blank" rel="noopener noreferrer" className="wa-share-btn">
        <span>{t('share.button')}</span>
      </a>
    </div>
  )
}
