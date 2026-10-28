import { useMemo, useState } from 'react'
import api from '../api/client.js'
import { FIELDS, MAX_ROWS, guessColumns, parseTable, previewRows } from '../utils/guestImport.js'

const PREVIEW_ROWS = 50

// Paste from Excel / Google Sheets, or pick a CSV: map the columns, check the
// preview, then save. Nothing is saved until "Simpan".
export default function GuestImport({ slug, existing, onDone }) {
  const [text, setText] = useState('')
  const [guess, setGuess] = useState(null)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const rows = useMemo(() => parseTable(text), [text])
  const preview = useMemo(() => (guess ? previewRows(rows, guess, existing) : []), [rows, guess, existing])
  const ok = preview.filter(r => !r.skip)
  const width = Math.max(0, ...rows.slice(0, 20).map(r => r.length))
  const columns = Array.from({ length: width }, (_, i) => ({
    value: i,
    label: guess?.hasHeader ? (rows[0][i] || `Kolom ${i + 1}`) : `Kolom ${i + 1}${rows[0]?.[i] ? `: ${rows[0][i].slice(0, 18)}` : ''}`,
  }))

  function load(next) {
    setText(next)
    setResult(null)
    setError('')
    const parsed = parseTable(next)
    setGuess(parsed.length ? guessColumns(parsed) : null)
  }

  function readFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    file.text().then(load)
    e.target.value = ''
  }

  const setColumn = (key, col) => setGuess(g => ({ ...g, mapping: { ...g.mapping, [key]: Number(col) } }))

  async function save() {
    setSaving(true)
    setError('')
    try {
      const res = await api.post(`/invitations/${slug}/guests/import/`, {
        rows: ok.map(({ name, number, group, max_pax }) => ({ name, whatsapp: number, group, max_pax })),
      })
      setResult(res.data)
      setText('')
      setGuess(null)
      onDone?.()
    } catch (err) {
      setError(err.response?.data?.detail || 'Gagal menyimpan. Coba lagi.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="gi">
      <h3>Impor Tamu</h3>
      <p>Salin kolom dari Excel atau Google Sheets lalu tempel di sini, atau pilih file CSV. Nomor WhatsApp boleh ditulis 08…, +62… atau 62….</p>
      <textarea
        className="gi-paste"
        value={text}
        onChange={e => load(e.target.value)}
        placeholder={'Nama\tNo. WhatsApp\tGrup\nBudi Santoso\t0812 3456 7890\tKantor'}
        aria-label="Tempel daftar tamu"
      />
      <label className="gm-btn gi-file">
        Pilih file CSV
        <input type="file" accept=".csv,.tsv,.txt,text/csv" onChange={readFile} hidden />
      </label>

      {result && (
        <div className="gi-result" role="status">
          {result.created} tamu ditambahkan
          {result.skipped.length > 0 && `, ${result.skipped.length} dilewati`}.
        </div>
      )}
      {error && <div className="gi-error" role="alert">{error}</div>}

      {guess && (
        <>
          <div className="gi-map">
            {FIELDS.map(f => (
              <label key={f.key}>
                {f.label}
                <select value={guess.mapping[f.key]} onChange={e => setColumn(f.key, e.target.value)}>
                  <option value={-1}>{f.key === 'name' ? 'Pilih kolom' : 'Tidak ada'}</option>
                  {columns.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </label>
            ))}
            <label className="gi-header">
              <input type="checkbox" checked={guess.hasHeader} onChange={e => setGuess(g => ({ ...g, hasHeader: e.target.checked }))} />
              Baris pertama adalah judul kolom
            </label>
          </div>

          <div className="gi-summary">
            <strong>{ok.length}</strong> tamu siap disimpan
            {preview.length - ok.length > 0 && <> · <span className="gi-warn">{preview.length - ok.length} akan dilewati</span></>}
            {ok.length > MAX_ROWS && <> · <span className="gi-warn">maksimal {MAX_ROWS} sekali impor</span></>}
          </div>

          <div className="gi-table-wrap">
            <table className="gi-table">
              <thead><tr><th>#</th><th>Nama</th><th>WhatsApp</th><th>Grup</th><th>Orang</th><th>Status</th></tr></thead>
              <tbody>
                {preview.slice(0, PREVIEW_ROWS).map(r => (
                  <tr key={r.row} className={r.skip ? 'gi-skip' : ''}>
                    <td>{r.row}</td>
                    <td>{r.name || '—'}</td>
                    <td>{r.number ? `+${r.number}` : (r.whatsapp || '—')}</td>
                    <td>{r.group || '—'}</td>
                    <td>{r.max_pax ?? '—'}</td>
                    <td>{r.skip || 'OK'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > PREVIEW_ROWS && <div className="gi-more">dan {preview.length - PREVIEW_ROWS} baris lainnya</div>}
          </div>

          <div className="gi-actions">
            <button className="gm-btn" onClick={() => load('')}>Batal</button>
            <button className="gm-btn gm-btn-primary" onClick={save}
              disabled={saving || ok.length === 0 || ok.length > MAX_ROWS || guess.mapping.name < 0}>
              {saving ? 'Menyimpan…' : `Simpan ${ok.length} tamu`}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
