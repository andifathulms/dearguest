import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../../api/client.js'
import { fromLocalInput, toLocalInputValue } from '../../utils/dates.js'
import { publicUrl } from '../../utils/publicUrl.js'
import { Badge, Data, dateTime, errorText, staffPost, useStaff, useTitle } from '../ui.jsx'
import { ARTICLE_STATE } from './ArticlesPage.jsx'

const TZ = 'Asia/Jakarta'
const FIELDS = ['title', 'slug', 'category', 'excerpt', 'body', 'cover_alt', 'theme', 'author_name', 'seo_title']

export default function ArticleEditorPage() {
  const { id } = useParams()
  const article = useStaff(`articles/${id}/`)
  useTitle(article.data?.title || 'Artikel')
  return <Data state={article}>{a => <Editor key={a.id} initial={a} options={a.options} />}</Data>
}

function Editor({ initial, options }) {
  const navigate = useNavigate()
  const [saved, setSaved] = useState(initial)
  const [form, setForm] = useState(() => Object.fromEntries(FIELDS.map(f => [f, initial[f] ?? ''])))
  const [when, setWhen] = useState(() => (initial.state === 'scheduled' ? toLocalInputValue(initial.published_at, TZ) : ''))
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState('')
  const [notice, setNotice] = useState('')
  const [preview, setPreview] = useState(null)
  const [tab, setTab] = useState('write')
  const body = useRef(null)
  const set = patch => setForm(f => ({ ...f, ...patch }))
  const dirty = FIELDS.some(f => (form[f] ?? '') !== (saved[f] ?? ''))
  const live = saved.state === 'live'

  // Warn before leaving with unsaved text.
  useEffect(() => {
    if (!dirty) return undefined
    const warn = e => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  // Live preview from the server's renderer (what readers and search engines get).
  useEffect(() => {
    const t = setTimeout(() => {
      staffPost('articles/preview/', { body: form.body }).then(setPreview).catch(() => {})
    }, 400)
    return () => clearTimeout(t)
  }, [form.body])

  async function save(extra = {}, message = 'Tersimpan.') {
    setBusy(extra.status || 'save')
    setErrors({})
    setNotice('')
    try {
      const changed = Object.fromEntries(FIELDS.filter(f => (form[f] ?? '') !== (saved[f] ?? '')).map(f => [f, form[f]]))
      const next = (await api.patch(`/staff/articles/${saved.id}/`, { ...changed, ...extra })).data
      setSaved(next)
      setForm(Object.fromEntries(FIELDS.map(f => [f, next[f] ?? ''])))
      setNotice(message)
      return next
    } catch (err) {
      const data = err?.response?.data
      setErrors(data && typeof data === 'object' && !data.detail ? data : { form: errorText(err) })
      return null
    } finally {
      setBusy('')
    }
  }

  const publishNow = () => save({ status: 'published', published_at: '' }, 'Terbit. Artikel sudah bisa dibaca di blog.')
  const schedule = () => (when
    ? save({ status: 'published', published_at: fromLocalInput(when, TZ) }, 'Dijadwalkan.')
    : setErrors({ published_at: 'Pilih tanggal dan jam terbit.' }))
  const unpublish = () => save({ status: 'draft' }, 'Kembali jadi draf; tidak tampil lagi di blog.')

  async function remove() {
    if (!window.confirm('Hapus artikel ini untuk selamanya?')) return
    await api.delete(`/staff/articles/${saved.id}/`)
    navigate('/backoffice/artikel')
  }

  async function uploadCover(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy('cover')
    try {
      const data = new FormData()
      data.append('image', file)
      setSaved((await api.post(`/staff/articles/${saved.id}/cover/`, data)).data)
    } catch (err) {
      setErrors({ cover: errorText(err) })
    } finally {
      setBusy('')
    }
  }

  const removeCover = async () => setSaved((await api.delete(`/staff/articles/${saved.id}/cover/`)).data)

  // ---- the body's toolbar: wrap the selection or insert at the cursor ----
  const edit = useCallback((fn) => {
    const el = body.current
    if (!el) return
    const { selectionStart: a, selectionEnd: b, value } = el
    const { text, cursor } = fn(value.slice(0, a), value.slice(a, b), value.slice(b))
    set({ body: text })
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(cursor, cursor) })
  }, [])
  const wrap = (mark, fallback) => edit((pre, sel, post) => {
    const inner = sel || fallback
    return { text: `${pre}${mark}${inner}${mark}${post}`, cursor: (pre + mark + inner + mark).length }
  })
  const line = (prefix, fallback) => edit((pre, sel, post) => {
    const start = pre.length && !pre.endsWith('\n') ? '\n\n' : ''
    const lines = (sel || fallback).split('\n').map((l, i) => (typeof prefix === 'function' ? prefix(i) : prefix) + l).join('\n')
    const chunk = `${start}${lines}\n\n`
    return { text: pre + chunk + post.replace(/^\n+/, ''), cursor: (pre + chunk).length }
  })
  // A block of its own (an image, a divider) after the selection, never replacing it.
  const block = text => edit((pre, sel, post) => {
    const before = pre + sel
    const chunk = `${before && !before.endsWith('\n\n') ? (before.endsWith('\n') ? '\n' : '\n\n') : ''}${text}\n\n`
    return { text: before + chunk + post.replace(/^\n+/, ''), cursor: (before + chunk).length }
  })
  const link = () => {
    const url = window.prompt('Alamat tautan (https://… atau /tema/…)', 'https://')
    if (!url) return
    edit((pre, sel, post) => {
      const md = `[${sel || 'teks tautan'}](${url.trim()})`
      return { text: pre + md + post, cursor: (pre + md).length }
    })
  }
  const imageInput = useRef(null)
  async function insertImage(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const alt = window.prompt('Teks alt gambar (untuk pembaca layar dan mesin pencari)', '') || ''
    setBusy('image')
    try {
      const data = new FormData()
      data.append('image', file)
      data.append('article', saved.id)
      data.append('alt', alt)
      const { markdown } = (await api.post('/staff/articles/images/', data)).data
      block(markdown)
    } catch (err) {
      setErrors({ body: errorText(err) })
    } finally {
      setBusy('')
    }
  }

  const url = publicUrl(`/blog/${form.slug || saved.slug}`)
  const desc = form.excerpt || saved.description || ''
  const err = name => errors[name] && <span className="bo-field-error" role="alert">{errors[name]}</span>
  const count = (value, limit) => <span className={`bo-count${value.length > limit ? ' over' : ''}`}>{value.length}/{limit}</span>

  return (
    <>
      <p className="bo-crumb"><Link to="/backoffice/artikel">← Semua artikel</Link></p>
      <div className="bo-editor-bar">
        <div className="bo-row">
          <Badge tone={ARTICLE_STATE[saved.state][1]}>{ARTICLE_STATE[saved.state][0]}</Badge>
          <span className="bo-quiet">
            {saved.state === 'draft' ? 'Belum tampil di blog.'
              : saved.state === 'scheduled' ? `Terbit otomatis ${dateTime(saved.published_at)} WIB.`
                : `Terbit ${dateTime(saved.published_at)}.`}
            {dirty ? ' Ada perubahan belum disimpan.' : ''}
          </span>
        </div>
        <div className="bo-row">
          {live && <a className="dg-btn dg-btn-line dg-btn-sm" href={url} target="_blank" rel="noopener noreferrer">Lihat di blog ↗</a>}
          <button type="button" className="dg-btn dg-btn-line dg-btn-sm" disabled={!!busy || !dirty} onClick={() => save()}>
            {busy === 'save' ? 'Menyimpan…' : 'Simpan'}
          </button>
          {saved.state !== 'live' && (
            <button type="button" className="dg-btn dg-btn-ink dg-btn-sm" disabled={!!busy} onClick={publishNow}>
              {busy === 'published' ? 'Menerbitkan…' : 'Terbitkan sekarang'}
            </button>
          )}
        </div>
      </div>
      {notice && <p className="bo-notice" role="status">{notice}</p>}
      {errors.form && <p className="bo-action-error" role="alert">{errors.form}</p>}

      <div className="bo-editor">
        <div className="bo-stack">
          <div className="dg-field">
            <label className="dg-label" htmlFor="ae-title">Judul</label>
            <input id="ae-title" className="dg-input bo-title-input" value={form.title} maxLength={140}
              onChange={e => set({ title: e.target.value })} />
            {err('title')}
          </div>
          <div className="dg-field">
            <label className="dg-label" htmlFor="ae-excerpt">Ringkasan {count(form.excerpt, 160)}</label>
            <textarea id="ae-excerpt" className="dg-input" rows={2} maxLength={200} value={form.excerpt}
              placeholder="Satu-dua kalimat: tampil di kartu artikel dan di hasil pencarian Google."
              onChange={e => set({ excerpt: e.target.value })} />
            {err('excerpt')}
          </div>

          <div className="bo-writer">
            <div className="bo-writer-tabs" role="tablist" aria-label="Isi artikel">
              {[['write', 'Tulis'], ['preview', 'Pratinjau']].map(([key, label]) => (
                <button key={key} type="button" role="tab" aria-selected={tab === key} className="bo-tab"
                  onClick={() => setTab(key)}>{label}</button>
              ))}
              <span className="bo-quiet bo-writer-count">{preview ? `${preview.words} kata · ${preview.reading_minutes} menit baca` : ''}</span>
            </div>
            {tab === 'write' ? (
              <>
                <div className="bo-md-tools" role="toolbar" aria-label="Format">
                  <button type="button" onClick={() => line('## ', 'Judul bagian')} title="Judul bagian">H2</button>
                  <button type="button" onClick={() => line('### ', 'Sub-judul')} title="Sub-judul">H3</button>
                  <button type="button" onClick={() => wrap('**', 'teks tebal')} title="Tebal"><b>B</b></button>
                  <button type="button" onClick={() => wrap('*', 'teks miring')} title="Miring"><i>I</i></button>
                  <button type="button" onClick={link} title="Tautan">Tautan</button>
                  <button type="button" onClick={() => line('- ', 'butir daftar')} title="Daftar">• Daftar</button>
                  <button type="button" onClick={() => line(i => `${i + 1}. `, 'langkah pertama')} title="Daftar bernomor">1. Daftar</button>
                  <button type="button" onClick={() => line('> ', 'kutipan')} title="Kutipan">“ Kutipan</button>
                  <button type="button" onClick={() => imageInput.current?.click()} disabled={busy === 'image'} title="Gambar">
                    {busy === 'image' ? 'Mengunggah…' : 'Gambar'}
                  </button>
                  <button type="button" onClick={() => block('---')} title="Garis pemisah">—</button>
                  <input ref={imageInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={insertImage} />
                </div>
                <textarea ref={body} className="dg-input bo-md" value={form.body} aria-label="Isi artikel"
                  placeholder={'Tulis di sini. Baris kosong memisahkan paragraf.\n\n## Judul bagian\n\nParagraf dengan **tebal**, *miring*, dan [tautan](/tema).'}
                  onChange={e => set({ body: e.target.value })} />
              </>
            ) : (
              <div className="bo-md-preview bl-prose" dangerouslySetInnerHTML={{ __html: preview?.html || '<p>Belum ada isi.</p>' }} />
            )}
            {err('body')}
          </div>
        </div>

        <aside className="bo-stack bo-editor-side">
          <section className="bo-card">
            <h2 className="bo-side-title">Terbitkan</h2>
            {saved.state !== 'live' ? (
              <>
                <div className="dg-field">
                  <label className="dg-label" htmlFor="ae-when">Jadwalkan (WIB)</label>
                  <input id="ae-when" type="datetime-local" className="dg-input" value={when} onChange={e => setWhen(e.target.value)} />
                  {err('published_at')}
                </div>
                <button type="button" className="dg-btn dg-btn-line dg-btn-sm" disabled={!!busy} onClick={schedule}>
                  {saved.state === 'scheduled' ? 'Ubah jadwal' : 'Jadwalkan'}
                </button>
              </>
            ) : <p className="bo-quiet">Terbit sejak {dateTime(saved.published_at)}. Alamatnya tetap, agar tautan dan hasil pencarian tidak rusak.</p>}
            {saved.state !== 'draft' && (
              <button type="button" className="dg-btn dg-btn-line dg-btn-sm" disabled={!!busy} onClick={unpublish}>Jadikan draf</button>
            )}
          </section>

          <section className="bo-card">
            <h2 className="bo-side-title">Sampul</h2>
            {saved.cover ? <img className="bo-cover-img" src={saved.cover} alt="" /> : <p className="bo-quiet">Belum ada sampul. Ukuran 1600×1000 paling pas.</p>}
            <div className="bo-row">
              <label className="dg-btn dg-btn-line dg-btn-sm bo-file">
                {busy === 'cover' ? 'Mengunggah…' : saved.cover ? 'Ganti sampul' : 'Unggah sampul'}
                <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={uploadCover} />
              </label>
              {saved.cover && <button type="button" className="dg-btn dg-btn-line dg-btn-sm" onClick={removeCover}>Hapus</button>}
            </div>
            {err('cover')}
            <div className="dg-field">
              <label className="dg-label" htmlFor="ae-alt">Teks alt sampul</label>
              <input id="ae-alt" className="dg-input" maxLength={160} value={form.cover_alt}
                placeholder="Gambarkan isinya, mis. Pelaminan Minang bernuansa emas" onChange={e => set({ cover_alt: e.target.value })} />
            </div>
          </section>

          <section className="bo-card">
            <h2 className="bo-side-title">Detail</h2>
            <div className="dg-field">
              <label className="dg-label" htmlFor="ae-cat">Kategori</label>
              <select id="ae-cat" className="dg-input" value={form.category} onChange={e => set({ category: e.target.value })}>
                {options.categories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div className="dg-field">
              <label className="dg-label" htmlFor="ae-theme">Tema terkait</label>
              <select id="ae-theme" className="dg-input" value={form.theme} onChange={e => set({ theme: e.target.value })}>
                <option value="">Tanpa tema</option>
                {options.themes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <span className="bo-quiet">Ditampilkan di akhir artikel dengan tombol ke tema itu.</span>
              {err('theme')}
            </div>
            <div className="dg-field">
              <label className="dg-label" htmlFor="ae-author">Penulis</label>
              <input id="ae-author" className="dg-input" maxLength={80} value={form.author_name} onChange={e => set({ author_name: e.target.value })} />
            </div>
          </section>

          <section className="bo-card">
            <h2 className="bo-side-title">Mesin pencari</h2>
            <div className="dg-field">
              <label className="dg-label" htmlFor="ae-slug">Alamat</label>
              <input id="ae-slug" className="dg-input" value={form.slug} disabled={live}
                onChange={e => set({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} />
              {err('slug')}
            </div>
            <div className="dg-field">
              <label className="dg-label" htmlFor="ae-seo">Judul di Google {count(form.seo_title || form.title, 60)}</label>
              <input id="ae-seo" className="dg-input" maxLength={70} value={form.seo_title} placeholder={form.title}
                onChange={e => set({ seo_title: e.target.value })} />
              {err('seo_title')}
            </div>
            <div className="bo-serp" aria-label="Pratinjau hasil pencarian">
              <span className="bo-serp-url">{url.replace(/^https?:\/\//, '')}</span>
              <span className="bo-serp-title">{(form.seo_title || form.title || 'Judul artikel') + ' · Vowvella'}</span>
              <span className="bo-serp-desc">{desc || 'Isi ringkasan agar Google menampilkan kalimat yang kamu pilih.'}</span>
            </div>
          </section>

          {options.can_delete && (
            <button type="button" className="dg-btn dg-btn-line dg-btn-sm bo-danger" onClick={remove}>Hapus artikel</button>
          )}
        </aside>
      </div>
    </>
  )
}
