export default function WhatsAppShare({ slug, brideName, groomName }) {
  const url = `${window.location.origin}/${slug}`
  const text = encodeURIComponent(
    `Assalamualaikum, kami mengundang Anda ke pernikahan ${brideName} & ${groomName}. Lihat undangan kami di: ${url}`
  )
  const waUrl = `https://wa.me/?text=${text}`

  return (
    <div className="wa-share">
      <a href={waUrl} target="_blank" rel="noopener noreferrer" className="wa-share-btn">
        <span>Bagikan via WhatsApp</span>
      </a>
    </div>
  )
}
