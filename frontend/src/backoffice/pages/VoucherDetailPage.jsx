import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../../api/client.js'
import { voucherLabel, voucherShort } from '../../utils/vouchers.js'
import {
  ActionButton, Badge, Card, CopyButton, Data, Empty, PageHead, TIER, dateTime, num, rupiah, useMe, useStaff, useTitle,
} from '../ui.jsx'
import VoucherForm from './VoucherForm.jsx'
import { QuotaBar, VOUCHER_STATE, planNames, promoText, windowText } from './VouchersPage.jsx'

const USE_TONE = { claimed: 'warn', redeemed: 'good', released: 'muted' }

export default function VoucherDetailPage() {
  const { id } = useParams()
  const state = useStaff(`vouchers/${id}/`)
  useTitle(state.data?.code || 'Voucher')
  return <Data state={state}>{v => <Detail v={v} plans={v.plan_options} reload={state.reload} />}</Data>
}

function Detail({ v, plans, reload }) {
  const me = useMe()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const patch = body => api.patch(`/staff/vouchers/${v.id}/`, body).then(r => r.data)

  return (
    <>
      <p className="bo-crumb"><Link to="/backoffice/voucher">← Semua voucher</Link></p>
      <PageHead eyebrow={`Voucher · ${VOUCHER_STATE[v.state][0]}`} title={<span className="bo-code-title">{v.code}</span>}
        lead={`Potongan ${voucherLabel(v)} · ${planNames(v, plans)} · ${windowText(v)}`}>
        <CopyButton text={v.code}>Salin kode</CopyButton>
        <CopyButton text={promoText(v, plans)}>Salin pesan promo</CopyButton>
      </PageHead>

      <div className="bo-detail">
        <div className="bo-stack">
          {editing ? (
            <Card title="Ubah voucher">
              <VoucherForm voucher={v} plans={plans} submitLabel="Simpan perubahan" onCancel={() => setEditing(false)}
                onSubmit={async body => { await patch(body); setEditing(false); reload() }} />
            </Card>
          ) : (
            <Card title="Ketentuan" aside={me.can_manage_vouchers && (
              <button type="button" className="dg-btn dg-btn-line dg-btn-sm" onClick={() => setEditing(true)}>Ubah</button>
            )}>
              <dl className="bo-facts">
                <div><dt>Potongan</dt><dd>{voucherLabel(v)}</dd></div>
                <div><dt>Paket</dt><dd>{planNames(v, plans)}</dd></div>
                <div><dt>Masa berlaku</dt><dd>{windowText(v)}</dd></div>
                <div><dt>Kuota</dt><dd>{v.quota == null ? 'tanpa batas' : num(v.quota)}</dd></div>
                <div><dt>Per akun</dt><dd>{v.once_per_account ? 'sekali' : 'boleh berulang'}</dd></div>
                <div><dt>Status</dt><dd>{v.active ? 'aktif' : 'nonaktif'}</dd></div>
                <div><dt>Dibuat</dt><dd>{v.created_by || '—'} · {dateTime(v.created_at)}</dd></div>
                {v.description && <div><dt>Keterangan</dt><dd>{v.description}</dd></div>}
              </dl>
              <QuotaBar v={v} />
              <div className="bo-preview">
                <span className="bo-quiet">Harga dengan voucher ini</span>
                <div className="bo-preview-prices">
                  {Object.entries(v.prices).map(([slug, p]) => (
                    <span key={slug}><b>{p.name}</b> {p.discount
                      ? <><s className="dg-num">{rupiah(p.price)}</s> → <b className="dg-num">{rupiah(p.final)}</b></>
                      : <span className="bo-quiet">tidak berlaku</span>}</span>
                  ))}
                </div>
              </div>
            </Card>
          )}

          <Card title="Pemakaian" aside={<span className="bo-quiet">{num(v.claimed)} menunggu bayar · {num(v.redeemed)} lunas</span>}>
            {v.uses.length ? (
              <div className="bo-table-wrap">
                <table className="bo-table">
                  <thead><tr><th>Undangan</th><th>Status</th><th>Paket</th><th>Waktu</th>
                    {'discount' in v.uses[0] && <><th className="num">Potongan</th><th className="num">Dibayar</th></>}</tr></thead>
                  <tbody>
                    {v.uses.map(u => (
                      <tr key={u.id}>
                        <td>{u.slug ? <Link to={`/backoffice/undangan/${u.invitation_id}`} className="bo-slug">{u.slug}</Link>
                          : <span className="bo-quiet">undangan dihapus</span>}</td>
                        <td><Badge tone={USE_TONE[u.status]}>{u.status_label}</Badge></td>
                        <td>{TIER[u.tier] || '—'}</td>
                        <td className="dg-num">{dateTime(u.at)}</td>
                        {'discount' in u && <>
                          <td className="num dg-num">{u.discount ? rupiah(u.discount) : '—'}</td>
                          <td className="num dg-num">{u.paid != null ? rupiah(u.paid) : '—'}</td>
                        </>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <Empty>Belum ada yang memakai voucher ini.</Empty>}
          </Card>
        </div>

        <div className="bo-stack">
          <div className={`bo-ticket big ${v.state}`}>
            <div className="bo-ticket-stub dg-dark">
              <span className="bo-ticket-off">{voucherShort(v)}</span>
              <span className="bo-ticket-kind">{v.discount_type === 'amount' ? 'potongan' : 'diskon'}</span>
            </div>
          </div>
          {'discount_total' in v && (
            <Card><dl className="bo-facts compact">
              <div><dt>Total potongan diberikan</dt><dd className="dg-num">{rupiah(v.discount_total)}</dd></div>
              <div><dt>Lunas dengan voucher</dt><dd className="dg-num">{num(v.redeemed)}</dd></div>
            </dl></Card>
          )}
          {me.can_manage_vouchers && (
            <Card title="Tindakan">
              <div className="bo-actions">
                <ActionButton run={() => patch({ active: !v.active })} onDone={reload}
                  confirm={v.active ? 'Nonaktifkan voucher ini? Pasangan tidak bisa memakainya lagi; yang sudah menempel tetap tercatat.' : undefined}>
                  {v.active ? 'Nonaktifkan' : 'Aktifkan lagi'}
                </ActionButton>
                {!v.ever_used && (
                  <ActionButton run={() => api.delete(`/staff/vouchers/${v.id}/`)} onDone={() => navigate('/backoffice/voucher')}
                    confirm="Hapus voucher ini? Belum pernah dipakai, jadi tidak ada yang hilang.">Hapus</ActionButton>
                )}
              </div>
              {v.ever_used && <p className="bo-quiet bo-note">Sudah pernah dipakai, jadi tidak bisa dihapus. Nonaktifkan saja.</p>}
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
