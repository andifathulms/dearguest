import { useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { guestUrl } from '../../utils/publicUrl.js'
import './CheckinQr.css'

// On a personal link, around the wedding days when the couple uses Mode
// Penerima Tamu (payload `checkin_qr`): a button that shows the guest's QR
// for the ushers to scan at the door. Sits outside the theme, so it looks the
// same on every pack.
export default function CheckinQr({ slug, guest }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" className="ciq-btn" onClick={() => setOpen(true)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><path d="M14 14h3v3M21 14v.01M14 21h.01M21 21v-4" /></svg>
        QR Check-in
      </button>
      {open && (
        <div className="ciq-wrap" role="dialog" aria-modal="true" aria-labelledby="ciq-title" onClick={() => setOpen(false)}>
          <div className="ciq-card" onClick={e => e.stopPropagation()}>
            <p className="ciq-label" id="ciq-title">QR Check-in</p>
            <p className="ciq-name">{guest.name}</p>
            <QRCodeCanvas value={guestUrl(slug, guest.code)} size={232} level="M" includeMargin />
            <p className="ciq-hint">Tunjukkan QR ini ke penerima tamu saat tiba. Naikkan kecerahan layar bila perlu.</p>
            <button type="button" className="ciq-close" onClick={() => setOpen(false)}>Tutup</button>
          </div>
        </div>
      )}
    </>
  )
}
