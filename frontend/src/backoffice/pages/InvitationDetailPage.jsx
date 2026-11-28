import { Link, useParams } from 'react-router-dom'
import { getTheme } from '../../themes/registry.js'
import { invitationUrl } from '../../utils/publicUrl.js'
import {
  ActionButton, Badge, Card, CopyButton, Data, Empty, PageHead, StatusBadge, TIER, date, dateTime, num, rupiah,
  staffPost, useStaff, useTitle, waLink,
} from '../ui.jsx'
import { FeedList } from './ActivityPage.jsx'

export default function InvitationDetailPage() {
  const { id } = useParams()
  const state = useStaff(`invitations/${id}/`)
  useTitle(state.data?.names || state.data?.slug || 'Undangan')
  return <Data state={state}>{d => <Detail d={d} reload={state.reload} />}</Data>
}

function Detail({ d, reload }) {
  const act = action => () => staffPost(`invitations/${d.id}/action/`, { action })
  const cover = getTheme(d.theme)?.previewImage
  return (
    <>
      <p className="bo-crumb"><Link to="/backoffice/undangan">← Semua undangan</Link></p>
      <PageHead eyebrow={d.slug} title={d.names || d.slug}
        lead={`${d.theme_name} · ${TIER[d.tier]} · menikah ${date(d.wedding_date)}`}>
        <a className="dg-btn dg-btn-line dg-btn-sm" href={invitationUrl(d.slug)} target="_blank" rel="noopener noreferrer">Buka halaman ↗</a>
        {d.whatsapp && (
          <a className="dg-btn dg-btn-wa dg-btn-sm" href={waLink(d.whatsapp.intl)} target="_blank" rel="noopener noreferrer">
            WhatsApp {d.whatsapp.number}
          </a>
        )}
      </PageHead>

      <div className="bo-detail">
        <div className="bo-stack">
          <Card title="Keadaan" aside={<StatusBadge status={d.status} />}>
            <dl className="bo-facts">
              <div><dt>Tamu</dt><dd className="dg-num">{num(d.guests)} · {num(d.sent)} dikirim</dd></div>
              <div><dt>Dibuka</dt><dd className="dg-num">{num(d.opens)} kali</dd></div>
              <div><dt>RSVP</dt><dd className="dg-num">{num(d.rsvps)} · {num(d.pax)} orang hadir</dd></div>
              <div><dt>Ucapan ditahan</dt><dd className="dg-num">{num(d.wishes_held)}</dd></div>
              <div><dt>Akun</dt><dd>{d.owner || '—'}</dd></div>
              <div><dt>Dibuat</dt><dd>{dateTime(d.created_at)}</dd></div>
              <div><dt>Terakhir diubah</dt><dd>{d.updated_at ? dateTime(d.updated_at) : '—'}</dd></div>
              <div><dt>Aktif sejak</dt><dd>{d.activated_at ? dateTime(d.activated_at) : '—'}</dd></div>
              <div><dt>Berakhir</dt><dd>{date(d.expires_at)}</dd></div>
              <div><dt>Watermark</dt><dd>{d.watermark ? 'tampil' : 'dihapus'}</dd></div>
              <div><dt>Penerima tamu</dt><dd>{d.usher_enabled ? 'aktif' : 'tidak aktif'}</dd></div>
              <div><dt>Kelengkapan</dt><dd>{d.missing.length ? `kurang ${d.missing.join(', ')}` : 'lengkap'}</dd></div>
            </dl>
          </Card>

          <Card title="Acara">
            {d.events.length ? (
              <ul className="bo-list">
                {d.events.map((e, i) => <li key={i}><b>{e.title}</b><span className="bo-quiet">{dateTime(e.start)} · {e.venue}</span></li>)}
              </ul>
            ) : <Empty>Belum ada acara. Tamu tidak akan melihat tanggal dan tempat.</Empty>}
          </Card>

          {d.payments && (
            <Card title="Pembayaran">
              {d.payments.length ? (
                <ul className="bo-list">
                  {d.payments.map(p => (
                    <li key={p.id}>
                      <b className="dg-num">{rupiah(p.amount)}</b>
                      <span className="bo-quiet">{TIER[p.tier]} · {p.channel_label}{p.coupon ? ` · ${p.coupon}` : ''} · {dateTime(p.at)} · {p.recorded_by}</span>
                    </li>
                  ))}
                </ul>
              ) : <Empty>Belum ada pembayaran tercatat.</Empty>}
            </Card>
          )}

          {d.reports.length > 0 && (
            <Card title="Laporan">
              <ul className="bo-list">
                {d.reports.map(r => (
                  <li key={r.id}><b>{r.reason_label}</b><span className="bo-quiet">{r.status_label} · {dateTime(r.created_at)}</span></li>
                ))}
              </ul>
            </Card>
          )}

          <Card title="Aktivitas"><FeedList rows={d.feed} /></Card>
        </div>

        <div className="bo-stack">
          {cover && <div className="bo-cover dg-dark"><div className="dg-phone"><img src={cover} alt={`Sampul tema ${d.theme_name}`} /></div></div>}
          <Card title="Tindakan">
            <div className="bo-actions">
              {d.status === 'live'
                ? <ActionButton run={act('deactivate')} onDone={reload}
                    confirm="Nonaktifkan undangan ini? Tamu akan melihat 'belum aktif' sampai diaktifkan lagi.">Nonaktifkan</ActionButton>
                : <ActionButton run={act('activate')} onDone={reload}>Aktifkan sekarang</ActionButton>}
              <ActionButton run={act('extend')} onDone={reload}>Perpanjang 30 hari</ActionButton>
              <ActionButton run={act(d.watermark ? 'watermark_off' : 'watermark_on')} onDone={reload}>
                {d.watermark ? 'Hapus watermark' : 'Pasang watermark'}
              </ActionButton>
              <ActionButton run={act('issue_code')} onDone={reload}
                confirm={d.activation_code ? 'Terbitkan kode baru? Kode lama tidak berlaku lagi.' : undefined}>
                {d.activation_code ? 'Terbitkan kode baru' : 'Terbitkan kode aktivasi'}
              </ActionButton>
            </div>
            {d.activation_code && (
              <div className="bo-code small">
                <div><p className="bo-quiet">Kode aktivasi</p><p className="bo-code-value dg-num">{d.activation_code}</p></div>
                <CopyButton text={d.activation_code} />
              </div>
            )}
            <p className="bo-quiet bo-note">Setiap tindakan dicatat atas nama kamu di Aktivitas.</p>
          </Card>
          {d.status === 'requested' && (
            <Card><p className="bo-note-strong">Pasangan ini minta aktivasi. Catat pembayarannya di <Link to="/backoffice/aktivasi" className="dg-link">Aktivasi</Link>.</p></Card>
          )}
          {d.wishes_held > 0 && <Badge tone="warn">{d.wishes_held} ucapan menunggu persetujuan pasangan</Badge>}
        </div>
      </div>
    </>
  )
}
