import { useEffect, useState } from 'react'
import api from '../../api/client.js'
import { useCopy } from '../../copy/CopyContext.jsx'
import { useGuest } from '../../copy/GuestContext.jsx'
import './GiftConfirm.css'

const digits = value => String(value || '').replace(/\D/g, '').slice(0, 11)
const rupiah = value => (value ? Number(value).toLocaleString('id-ID') : '')

// "Saya sudah kirim hadiah": a closed button under the gift cards that opens
// a short form. The couple sees it in the dashboard's "Kado" tab. Uses the
// RSVP form's classes, so every pack already styles it.
export default function GiftConfirm({ slug, channels }) {
  const { t } = useCopy()
  const guest = useGuest()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ sender_name: '', channel: '', amount: '', note: '' })
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (guest) setForm(f => ({ ...f, sender_name: f.sender_name || guest.name }))
  }, [guest])

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }))

  async function submit(e) {
    e.preventDefault()
    if (!form.sender_name.trim()) { setError(t('rsvp.nameRequired')); return }
    setLoading(true)
    setError('')
    try {
      await api.post(`/invitations/${slug}/gift/`, {
        ...form, amount: form.amount ? Number(form.amount) : null, guest_code: guest?.code || '',
      })
      setSent(true)
    } catch (err) {
      const data = err.response?.data || {}
      setError(data.detail || data.amount?.[0] || data.sender_name?.[0] || t('rsvp.failed'))
    } finally {
      setLoading(false)
    }
  }

  if (sent) return <p className="gift-confirm-thanks rsvp-success" role="status">{t('gift.confirm.thanks')}</p>

  if (!open) {
    return (
      <div className="gift-confirm">
        <button type="button" className="bank-copy-btn" onClick={() => setOpen(true)}>{t('gift.confirm.open')}</button>
      </div>
    )
  }

  return (
    <form className="gift-confirm gift-confirm-form rsvp-form" onSubmit={submit}>
      <p className="gift-confirm-intro">{t('gift.confirm.intro')}</p>
      <input className="rsvp-input" id="gift-name" aria-label={t('gift.confirm.name')} placeholder={t('gift.confirm.name')}
        value={form.sender_name} onChange={e => set('sender_name', e.target.value)} maxLength={200} />
      <select className="rsvp-input" id="gift-channel" aria-label={t('gift.confirm.channel')}
        value={form.channel} onChange={e => set('channel', e.target.value)}>
        <option value="">{t('gift.confirm.channel')}: {t('gift.confirm.channelNone')}</option>
        {channels.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <input className="rsvp-input" id="gift-amount" inputMode="numeric" aria-label={t('gift.confirm.amount')}
        placeholder={t('gift.confirm.amount')} value={rupiah(form.amount)} onChange={e => set('amount', digits(e.target.value))} />
      <textarea className="rsvp-textarea" id="gift-note" aria-label={t('gift.confirm.note')} placeholder={t('gift.confirm.note')}
        value={form.note} onChange={e => set('note', e.target.value)} maxLength={500} rows={3} />
      {error && <p className="rsvp-error">{error}</p>}
      <button className="rsvp-submit" type="submit" disabled={loading}>{loading ? t('rsvp.sending') : t('gift.confirm.submit')}</button>
      <button className="gift-confirm-cancel" type="button" onClick={() => setOpen(false)}>{t('gift.confirm.cancel')}</button>
    </form>
  )
}
