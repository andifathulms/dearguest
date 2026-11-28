import { Badge, Card, Data, PageHead, ago, dateTime, num, useStaff, useTitle } from '../ui.jsx'

const JOBS = { backup: 'Backup harian', purge: 'Retensi data', cert_check: 'Cek sertifikat' }

export default function SystemPage() {
  useTitle('Sistem')
  const state = useStaff('system/')
  return (
    <>
      <PageHead eyebrow="Bisnis" title="Sistem"
        lead="Kesehatan server, tugas terjadwal, dan antrean penghapusan data. Kalau ada yang merah atau terlambat, lihat RUNBOOK.md." />
      <Data state={state}>
        {d => (
          <div className="bo-split">
            <Card title="Pemeriksaan" aside={<span className="bo-quiet">rilis {d.release.slice(0, 7)}</span>}>
              <ul className="bo-list">
                {d.checks.map(c => (
                  <li key={c.key} className="bo-split-row">
                    <span>{c.name}</span><span className="bo-quiet">{c.detail}</span>
                    <Badge tone={c.ok ? 'good' : 'bad'}>{c.ok ? 'ok' : 'gagal'}</Badge>
                  </li>
                ))}
              </ul>
            </Card>
            <div className="bo-stack">
              <Card title="Tugas terjadwal">
                <ul className="bo-list">
                  {d.jobs.map(j => (
                    <li key={j.job} className="bo-split-row">
                      <span>{JOBS[j.job] || j.job}</span>
                      <span className="bo-quiet">{j.last ? `${dateTime(j.last)} · ${ago(j.last)}` : 'belum pernah jalan'}</span>
                      <Badge tone={j.ok ? 'good' : 'warn'}>{j.ok ? 'ok' : 'terlambat'}</Badge>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card title="Retensi data">
                <ul className="bo-list">
                  <li className="bo-split-row"><span>Undangan aktif berakhir dalam 7 hari</span><b className="dg-num">{num(d.retention.expiring_week)}</b></li>
                  <li className="bo-split-row"><span>Pemberitahuan penghapusan menunggu</span><b className="dg-num">{num(d.retention.notices_due)}</b></li>
                  <li className="bo-split-row"><span>Data tamu siap dihapus</span><b className="dg-num">{num(d.retention.purges_due)}</b></li>
                  <li className="bo-split-row"><span>Baris aktivitas tersimpan</span><b className="dg-num">{num(d.retention.activity_rows)}</b></li>
                </ul>
              </Card>
            </div>
          </div>
        )}
      </Data>
    </>
  )
}
