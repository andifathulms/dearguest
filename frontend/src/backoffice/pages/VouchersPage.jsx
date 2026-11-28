import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { voucherLabel, voucherShort } from '../../utils/vouchers.js'
import {
  Badge, Card, Chips, CopyButton, Data, Empty, PageHead, Search, date, num, staffPost, useMe, useStaff, useTitle,
} from '../ui.jsx'
import VoucherForm from './VoucherForm.jsx'

export const VOUCHER_STATE = {
  active: ['Berlaku', 'good'], scheduled: ['Terjadwal', 'warn'], ended: ['Berakhir', 'muted'],
  exhausted: ['Kuota habis', 'bad'], inactive: ['Nonaktif', 'muted'],
}
const ORDER = ['active', 'scheduled', 'exhausted', 'ended', 'inactive']

export function planNames(v, plans) {
  if (!v.plans?.length) return 'Semua paket berbayar'
  return v.plans.map(slug => plans.find(p => p.slug === slug)?.name || slug).join(' & ')
}

export function windowText(v) {
  if (!v.starts_at && !v.ends_at) return 'Tanpa batas waktu'
  const at = iso => date(iso, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  if (!v.ends_at) return `Mulai ${at(v.starts_at)}`
  if (!v.starts_at) return `Sampai ${at(v.ends_at)}`
  return `${at(v.starts_at)} – ${at(v.ends_at)}`
}

// A ready-to-send line for WhatsApp or Instagram: the code is the thing to paste.
export function promoText(v, plans) {
  const until = v.ends_at ? `, berlaku sampai ${date(v.ends_at)}` : ''
  return `Pakai kode ${v.code} untuk potongan ${voucherLabel(v)} paket ${planNames(v, plans)} di Vowvella${until}. `
    + 'Tempel kodenya saat mengaktifkan undangan.'
}

export function QuotaBar({ v }) {
  if (v.quota == null) return <span className="bo-quiet">{num(v.used)} dipakai · tanpa batas</span>
  return (
    <div className="bo-quota">
      <span className="bo-bar"><i style={{ width: `${Math.min(100, (v.used / v.quota) * 100)}%` }} /></span>
      <span className="bo-quiet dg-num">{num(v.used)} / {num(v.quota)} dipakai · sisa {num(v.left)}</span>
    </div>
  )
}

export default function VouchersPage() {
  useTitle('Voucher')
  const me = useMe()
  const navigate = useNavigate()
  const [query, setQuery] = useState({ state: '', q: '' })
  const [adding, setAdding] = useState(false)
  const state = useStaff('vouchers/', query)
  const counts = state.data?.state_counts || {}

  return (
    <>
      <PageHead eyebrow="Bisnis" title="Voucher"
        lead="Kode yang ditempel pasangan saat melihat harga atau mengaktifkan undangan. Potongan persentase atau nominal, dengan kuota dan masa berlaku. Kuota terpakai sejak kode ditempel, dan kembali bila kode dilepas.">
        {me.can_manage_vouchers && !adding && (
          <button type="button" className="dg-btn dg-btn-ink dg-btn-sm" onClick={() => setAdding(true)}>Buat voucher</button>
        )}
      </PageHead>

      {adding && state.data && (
        <Card title="Voucher baru">
          <VoucherForm plans={state.data.plans} submitLabel="Simpan voucher" onCancel={() => setAdding(false)}
            onSubmit={async body => { const v = await staffPost('vouchers/', body); navigate(`/backoffice/voucher/${v.id}`) }} />
        </Card>
      )}

      <div className="bo-toolbar">
        <Chips label="Status voucher" value={query.state} onChange={s => setQuery(q => ({ ...q, state: s }))} options={[
          { value: '', label: 'Semua', count: state.data ? Object.values(counts).reduce((a, b) => a + b, 0) : null },
          ...ORDER.map(key => ({ value: key, label: VOUCHER_STATE[key][0], count: counts[key] ?? null })),
        ]} />
        <Search value={query.q} onChange={q => setQuery(s => ({ ...s, q }))} placeholder="Cari kode atau keterangan" />
      </div>

      <Data state={state}>
        {d => (d.results.length ? (
          <div className="bo-vouchers">
            {d.results.map(v => (
              <article key={v.id} className={`bo-ticket ${v.state}`}>
                <div className="bo-ticket-stub dg-dark">
                  <span className="bo-ticket-off">{voucherShort(v)}</span>
                  <span className="bo-ticket-kind">{v.discount_type === 'amount' ? 'potongan' : 'diskon'}</span>
                </div>
                <div className="bo-ticket-body">
                  <div className="bo-ticket-head">
                    <Link to={`/backoffice/voucher/${v.id}`} className="bo-ticket-code">{v.code}</Link>
                    <Badge tone={VOUCHER_STATE[v.state][1]}>{VOUCHER_STATE[v.state][0]}</Badge>
                  </div>
                  <p className="bo-quiet">
                    {planNames(v, d.plans)}{v.max_discount ? ` · maks. Rp${num(v.max_discount)}` : ''}
                    {v.once_per_account ? ' · sekali per akun' : ''}
                  </p>
                  <p className="bo-quiet">{windowText(v)}</p>
                  {v.description && <p className="bo-ticket-desc">{v.description}</p>}
                  <QuotaBar v={v} />
                  <div className="bo-row">
                    <CopyButton text={v.code}>Salin kode</CopyButton>
                    <CopyButton text={promoText(v, d.plans)}>Salin pesan promo</CopyButton>
                    <Link to={`/backoffice/voucher/${v.id}`} className="bo-more">Detail →</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Card><Empty>{query.state || query.q ? 'Tidak ada voucher yang cocok.' : 'Belum ada voucher. Buat yang pertama untuk promo atau mitra.'}</Empty></Card>
        ))}
      </Data>
    </>
  )
}
