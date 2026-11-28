import { useState } from 'react'
import { Link } from 'react-router-dom'
import { priceWith, voucherLabel } from '../../utils/vouchers.js'
import {
  Badge, Card, CopyButton, Data, Empty, PageHead, TIER, date, errorText, rupiah, since, staffPost, useStaff, useTitle,
  waLink,
} from '../ui.jsx'

const CHANNELS = [
  { value: 'transfer', label: 'Transfer bank' }, { value: 'qris', label: 'QRIS' },
  { value: 'ewallet', label: 'E-wallet' }, { value: 'cash', label: 'Tunai' }, { value: 'other', label: 'Lainnya' },
]

function codeMessage(slug, code) {
  return `Halo, pembayaran untuk undangan "${slug}" sudah kami terima. Kode aktivasi kamu: ${code}. `
    + 'Masukkan di editor lalu klik Aktifkan. Terima kasih!'
}

export default function ActivationsPage() {
  useTitle('Aktivasi')
  const state = useStaff('activations/')
  return (
    <>
      <PageHead eyebrow="Hari ini" title="Aktivasi"
        lead="Pasangan yang minta undangannya diaktifkan, yang paling lama menunggu di atas. Cek pembayarannya, catat di sini, lalu kirim kodenya lewat WhatsApp. Pasangan memasukkan kode itu di editor." />
      <Data state={state}>
        {d => (d.results.length
          ? <div className="bo-stack">{d.results.map(r => <Request key={r.id} r={r} coupons={d.coupons} onDone={state.reload} />)}</div>
          : <Card><Empty>Tidak ada permintaan aktivasi. Semua sudah diurus.</Empty></Card>)}
      </Data>
    </>
  )
}

function Request({ r, coupons, onDone }) {
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(null)   // { activation_code, tier } after recording
  const code = done?.activation_code || r.activation_code
  const message = code ? codeMessage(r.slug, code) : ''

  return (
    <Card className="bo-request">
      <div className="bo-request-main">
        <div className="bo-request-who">
          <h2 className="bo-request-names">{r.names || r.slug}</h2>
          <p className="bo-quiet">
            <Link to={`/backoffice/undangan/${r.id}`} className="bo-slug">{r.slug}</Link>
            {' · '}{r.theme_name}{' · '}menikah {date(r.wedding_date)}
          </p>
          {r.voucher && (
            <p className="bo-request-voucher">
              <Badge tone="warn">Voucher {r.voucher.code}</Badge>
              <span className="bo-quiet">
                potongan {voucherLabel(r.voucher)} · {Object.entries(r.prices).map(([slug, p]) => (
                  p.discount ? `${p.name} ${rupiah(p.final)}` : null)).filter(Boolean).join(' · ') || 'tidak berlaku untuk paket mana pun'}
              </span>
            </p>
          )}
        </div>
        <div className="bo-request-meta">
          {r.activation_requested_at && <span className="bo-wait">menunggu {since(r.activation_requested_at)}</span>}
          {r.whatsapp
            ? <a className="dg-btn dg-btn-wa dg-btn-sm" href={waLink(r.whatsapp.intl)} target="_blank" rel="noopener noreferrer">{r.whatsapp.number}</a>
            : <span className="bo-quiet">WhatsApp belum diisi</span>}
        </div>
      </div>

      {code ? (
        <div className="bo-code">
          <div>
            <p className="bo-quiet">{done ? `Pembayaran dicatat · ${TIER[done.tier]}` : 'Kode sudah terbit'}</p>
            <p className="bo-code-value dg-num">{code}</p>
          </div>
          <div className="bo-row">
            {r.whatsapp && (
              <a className="dg-btn dg-btn-ink dg-btn-sm" href={waLink(r.whatsapp.intl, message)} target="_blank" rel="noopener noreferrer">
                Kirim kode lewat WhatsApp
              </a>
            )}
            <CopyButton text={message}>Salin pesan</CopyButton>
            {done && <button type="button" className="dg-btn dg-btn-line dg-btn-sm" onClick={onDone}>Selesai</button>}
          </div>
        </div>
      ) : null}

      {!done && (open
        ? <FulfillForm r={r} coupons={coupons} onCancel={() => setOpen(false)} onSaved={setDone} />
        : (
          <div className="bo-row">
            <button type="button" className="dg-btn dg-btn-ink dg-btn-sm" onClick={() => setOpen(true)}>Konfirmasi lunas</button>
            {code && <span className="bo-quiet">Kode sudah ada, tapi pembayaran belum dicatat di sini.</span>}
          </div>
        ))}
    </Card>
  )
}

// The amount the couple should have paid: the plan's price after the voucher.
function expected(r, coupons, tier, couponId) {
  const base = r.prices[tier]?.price
  if (base == null) return ''
  const voucher = coupons.find(c => String(c.id) === String(couponId))
  return String(priceWith(voucher, tier, base))
}

function FulfillForm({ r, coupons: usable, onCancel, onSaved }) {
  // The couple's own voucher is offered even if it has since ended: the server
  // then explains why it can't be used.
  const coupons = r.voucher && !usable.some(c => c.id === r.voucher.id) ? [r.voucher, ...usable] : usable
  const startCoupon = r.voucher ? String(r.voucher.id) : ''
  const [form, setForm] = useState(() => ({
    tier: 'premium', channel: 'transfer', coupon: startCoupon, note: '',
    amount: expected(r, coupons, 'premium', startCoupon),
  }))
  const [typed, setTyped] = useState(false)   // once staff type an amount, stop suggesting
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = patch => setForm(f => {
    const next = { ...f, ...patch }
    return typed || 'amount' in patch ? next : { ...next, amount: expected(r, coupons, next.tier, next.coupon) }
  })
  const id = name => `bo-${name}-${r.id}`
  const suggestion = expected(r, coupons, form.tier, form.coupon)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      onSaved(await staffPost(`activations/${r.id}/fulfill/`, { ...form, amount: Number(form.amount), coupon: form.coupon || null }))
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="bo-form" onSubmit={submit}>
      <div className="dg-field">
        <span className="dg-label">Paket yang dibayar</span>
        <div className="bo-chips" role="group" aria-label="Paket">
          {['premium', 'bisnis'].map(t => (
            <button key={t} type="button" className="dg-chip" aria-pressed={form.tier === t} onClick={() => set({ tier: t })}>
              {TIER[t]}{t === 'bisnis' && <span className="count">2 undangan</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="bo-form-grid">
        <div className="dg-field">
          <label className="dg-label" htmlFor={id('amount')}>Jumlah diterima (Rp)</label>
          <input id={id('amount')} className="dg-input" inputMode="numeric" required value={form.amount}
            placeholder="mis. 99000" onChange={e => { setTyped(true); set({ amount: e.target.value.replace(/\D/g, '') }) }} />
          {suggestion && <span className="bo-quiet">Harga {TIER[form.tier]}{form.coupon ? ' setelah voucher' : ''}: {rupiah(Number(suggestion))}</span>}
        </div>
        <div className="dg-field">
          <label className="dg-label" htmlFor={id('channel')}>Lewat</label>
          <select id={id('channel')} className="dg-input" value={form.channel} onChange={e => set({ channel: e.target.value })}>
            {CHANNELS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div className="dg-field">
          <label className="dg-label" htmlFor={id('coupon')}>Voucher</label>
          <select id={id('coupon')} className="dg-input" value={form.coupon} onChange={e => set({ coupon: e.target.value })}>
            <option value="">Tanpa voucher</option>
            {coupons.map(c => <option key={c.id} value={c.id}>{c.code} (−{voucherLabel(c, { cap: false })})</option>)}
          </select>
          {r.voucher && String(form.coupon) !== String(r.voucher.id) && (
            <span className="bo-quiet">Voucher {r.voucher.code} dari pasangan akan dilepas.</span>
          )}
        </div>
        <div className="dg-field">
          <label className="dg-label" htmlFor={id('note')}>Catatan</label>
          <input id={id('note')} className="dg-input" maxLength={200} value={form.note}
            placeholder="mis. bukti transfer BCA 12.40" onChange={e => set({ note: e.target.value })} />
        </div>
      </div>
      {error && <p className="bo-action-error" role="alert">{error}</p>}
      <div className="bo-row">
        <button type="submit" className="dg-btn dg-btn-ink dg-btn-sm" disabled={busy}>
          {busy ? 'Menyimpan…' : 'Simpan dan terbitkan kode'}
        </button>
        <button type="button" className="dg-btn dg-btn-line dg-btn-sm" onClick={onCancel}>Batal</button>
      </div>
    </form>
  )
}
