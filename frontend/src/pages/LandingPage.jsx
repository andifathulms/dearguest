import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client.js'
import { selectableThemes } from '../themes/registry.js'
import { variantOptions } from '../copy/copy.js'
import { trackVisit } from '../utils/funnel.js'
import { rememberTheme } from '../utils/themeChoice.js'
import { useSession } from '../api/session.js'
import { SiteNav, SiteFooter, StickyBar, useHashScroll } from '../brand/SiteChrome.jsx'
import { Icon } from '../brand/icons.jsx'
import { WA_HELP, waLink } from '../brand/site.js'
import { DEFAULT_PLANS, formatRp } from '../brand/plans.js'
import '../brand/brand.css'
import './Home.css'

// Everything theme-related reads the registry, so a new pack shows up here
// (counts, categories, picker, hero) without touching this file.
const THEMES = selectableThemes().filter(t => t.previewImage)
const COUNT = selectableThemes().length
const CATEGORIES = [...new Set(THEMES.map(t => t.category))]
const VARIANTS = variantOptions()

// Hero fan: these three when they exist (a dark lacquer centre between two
// light papers reads best), else the first three themes with a cover.
const HERO_PREFERRED = ['sunda', 'minang', 'navy']
const HERO = (() => {
  const picked = HERO_PREFERRED.map(id => THEMES.find(t => t.id === id)).filter(Boolean)
  return picked.length === 3 ? picked : THEMES.slice(0, 3)
})()

const joinId = list => list.length > 1 ? `${list.slice(0, -1).join(', ')} dan ${list.at(-1)}` : (list[0] || '')

const GROUPS = [
  {
    who: 'Untuk tamu', title: 'Dibuka, lalu dikenang',
    items: ['Nama tamu tampil di sampul undangan', 'Musik, galeri foto, dan kisah kalian', 'Peta lokasi dan "Simpan ke Kalender"'],
  },
  {
    who: 'Untuk kalian', title: 'Tahu siapa yang datang',
    items: ['RSVP dan jumlah tamu langsung masuk', 'Kirim ke daftar tamu lewat WhatsApp', 'Lihat siapa yang sudah membuka undangan'],
  },
  {
    who: 'Untuk keluarga', title: 'Doa dan hadiah, tersimpan rapi',
    items: ['Amplop digital, salin rekening sekali tap', 'Dinding ucapan yang bisa kalian saring', `Teks ${joinId(VARIANTS.map(v => v.label))}`],
  },
]

const STEPS = [
  { title: 'Pilih tema, isi data', desc: 'Nama mempelai, acara, foto, dan rekening amplop. Pratinjaunya tampil langsung saat kalian mengisi.' },
  { title: 'Aktifkan', desc: 'Coba gratis dulu. Bayar sekali saat sudah yakin, tanpa biaya bulanan.' },
  { title: 'Kirim ke tamu', desc: 'Masukkan daftar tamu, lalu kirim tautan pribadi satu per satu lewat WhatsApp.' },
]

const FAQS = [
  { q: 'Berapa lama membuat undangannya?', a: 'Isi data mempelai, acara, dan foto, lalu lihat pratinjaunya langsung. Semua tersimpan, jadi bisa dilanjutkan kapan saja. Kalau ingin disiapkan oleh admin, paket Bisnis dikerjakan dalam 24 jam.' },
  { q: 'Apakah nama tamu bisa muncul otomatis?', a: 'Bisa. Masukkan daftar tamu (bisa ditempel dari Excel atau Google Sheets), dan setiap tamu mendapat tautan pribadi dengan namanya di sampul undangan.' },
  { q: 'Bagaimana cara membayar?', a: 'Coba gratis dulu. Saat siap, minta aktivasi dari editor, transfer sesuai paket, lalu kirim bukti ke admin lewat WhatsApp. Admin mengirim kode aktivasi, dan undangan langsung aktif tanpa watermark.' },
  { q: 'Apakah ada pilihan untuk agama selain Islam?', a: `Ada. Pilih gaya teks ${joinId(VARIANTS.map(v => v.label))}. Salam pembuka, nama acara, dan ayat mengikuti pilihan itu, dan bisa diubah kapan saja.` },
  { q: 'Bisakah ganti tema setelah undangan dibuat?', a: 'Bisa, kapan saja dari editor. Data, foto, dan daftar tamu tetap utuh.' },
  { q: 'Berapa lama undangan bisa diakses?', a: 'Undangan berbayar aktif hingga 3 bulan setelah tanggal pernikahan. Paket Gratis aktif 14 hari.' },
]

function useMarketing() {
  const [data, setData] = useState({ plans: DEFAULT_PLANS, testimonials: [] })
  useEffect(() => {
    let live = true
    api.get('/site/marketing/')
      .then(({ data: d }) => live && setData({ plans: d.plans?.length ? d.plans : DEFAULT_PLANS, testimonials: d.testimonials || [] }))
      .catch(() => {})
    return () => { live = false }
  }, [])
  return data
}

function Hero() {
  const [center, ...sides] = [HERO[1], HERO[0], HERO[2]]
  return (
    <section className="hm-hero dg-dark">
      <div className="dg-container hm-hero-grid">
        <div className="hm-hero-copy">
          <p className="dg-eyebrow">Undangan pernikahan digital</p>
          <h1 className="dg-display">Undangan berlukis, dengan <em>nama setiap tamu</em> di sampulnya.</h1>
          <p className="dg-lead">
            {COUNT} tema berlukis, dari {joinId(CATEGORIES)}. RSVP, peta, amplop digital, dan
            dinding ucapan sudah termasuk. Kirim satu tautan lewat WhatsApp.
          </p>
          <div className="hm-actions">
            <a href="#tema" className="dg-btn dg-btn-gold">Pilih Tema {Icon.arrow}</a>
            <Link to="/register" className="dg-btn dg-btn-line">Coba Gratis</Link>
          </div>
          <dl className="hm-proof">
            <div><dt className="dg-num">{COUNT}</dt><dd>tema berlukis</dd></div>
            <div><dt className="dg-num">{VARIANTS.length}</dt><dd>gaya teks: {VARIANTS.map(v => v.label).join(', ')}</dd></div>
            <div><dt className="dg-num">Rp0</dt><dd>untuk mencoba</dd></div>
          </dl>
        </div>
        <div className="hm-fan" aria-hidden="true">
          {sides[0] && <div className="dg-phone hm-p hm-p1"><img src={sides[0].previewImage} alt="" /></div>}
          {center && <div className="dg-phone hm-p hm-p2"><img src={center.previewImage} alt="" fetchpriority="high" /></div>}
          {sides[1] && <div className="dg-phone hm-p hm-p3"><img src={sides[1].previewImage} alt="" /></div>}
          <div className="hm-note hm-note1"><small>Kepada Yth.</small><b>Nama tamu kalian</b><small>tampil otomatis di sampul</small></div>
          <div className="hm-note hm-note2"><b><span className="hm-dot" />Hadir · 2 orang</b><small>RSVP langsung masuk ke dashboard</small></div>
        </div>
      </div>
    </section>
  )
}

function ThemePicker() {
  const session = useSession()
  const [cat, setCat] = useState(CATEGORIES[0])
  const list = useMemo(() => THEMES.filter(t => t.category === cat), [cat])
  const [id, setId] = useState(list[0]?.id)
  const theme = THEMES.find(t => t.id === id) || list[0]
  if (!theme) return null
  const useHref = `${session ? '/onboarding' : '/register'}?theme=${theme.id}`

  return (
    <section className="dg-band paper" id="tema">
      <div className="dg-container">
        <div className="dg-head hm-head-row">
          <div className="hm-head-text">
            <p className="dg-eyebrow">Galeri tema</p>
            <h2 className="dg-h2">Pilih gayanya, <em>lihat sampulnya utuh</em>.</h2>
            <p className="dg-lead">Persis seperti yang dibuka tamu di ponselnya. Nama, tanggal, dan nama tamu sudah di tempatnya.</p>
          </div>
          <Link to="/tema" className="dg-link hm-all">Lihat semua {COUNT} tema</Link>
        </div>

        <div className="hm-stage dg-dark">
          <div className="dg-phone hm-stage-phone">
            <img key={theme.id} src={theme.previewImage} alt={`Sampul tema ${theme.name}`} className="hm-fade" />
          </div>
          <div className="hm-stage-info">
            <div className="hm-tabs" role="group" aria-label="Kategori tema">
              {CATEGORIES.map(c => (
                <button key={c} type="button" className="dg-chip" aria-pressed={c === cat}
                  onClick={() => { setCat(c); setId(THEMES.find(t => t.category === c)?.id) }}>
                  {c} <span className="count">{THEMES.filter(t => t.category === c).length}</span>
                </button>
              ))}
            </div>
            <h3 className="hm-stage-name">{theme.name}</h3>
            <p className="hm-stage-desc">{theme.desc}</p>
            <div className="hm-swatches" aria-label="Warna tema">
              {theme.colors.map(c => <span key={c} style={{ background: c }} />)}
            </div>
            <div className="hm-actions">
              <Link to={useHref} className="dg-btn dg-btn-gold" onClick={() => rememberTheme(theme.id)}>Pakai Tema Ini</Link>
              <Link to={`/tema/${theme.id}`} className="dg-btn dg-btn-line">Coba Demo</Link>
            </div>
            <div className="hm-thumbs" role="group" aria-label={`Tema ${cat}`}>
              {list.map(t => (
                <button key={t.id} type="button" aria-pressed={t.id === theme.id} aria-label={t.name} onClick={() => setId(t.id)}>
                  <img src={t.previewImage} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Features() {
  return (
    <section className="dg-band" id="fitur">
      <div className="dg-container">
        <div className="dg-head">
          <p className="dg-eyebrow">Semua dalam satu tautan</p>
          <h2 className="dg-h2">Tamu merasa diundang <em>secara pribadi</em>.</h2>
        </div>
        <div className="hm-groups">
          {GROUPS.map(g => (
            <div className="hm-group" key={g.who}>
              <p className="hm-who">{g.who}</p>
              <h3 className="dg-h3">{g.title}</h3>
              <ul>{g.items.map(i => <li key={i}>{Icon.check}<span>{i}</span></li>)}</ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Steps() {
  return (
    <section className="dg-band paper" id="cara-kerja">
      <div className="dg-container">
        <div className="dg-head">
          <p className="dg-eyebrow">Cara kerja</p>
          <h2 className="dg-h2">Buat sendiri dalam <em>tiga langkah</em>.</h2>
        </div>
        <ol className="hm-steps">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <span className="hm-step-n dg-num">{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </li>
          ))}
        </ol>
        <p className="hm-help">
          Lebih suka dibantu? Admin kami bisa menyiapkan undangan untuk kalian.{' '}
          <a href={WA_HELP} target="_blank" rel="noopener noreferrer" className="dg-link">Chat lewat WhatsApp</a>
        </p>
      </div>
    </section>
  )
}

function Coupon({ coupon, setCoupon }) {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [status, setStatus] = useState('')
  async function apply(e) {
    e.preventDefault()
    if (!code.trim()) return
    setStatus('checking')
    try {
      const res = await api.get('/coupons/validate/', { params: { code } })
      if (res.data.valid) { setCoupon(res.data); setStatus('ok') } else { setCoupon(null); setStatus('bad') }
    } catch { setStatus('bad') }
  }
  if (!open && !coupon) {
    return <button type="button" className="hm-promo-toggle" onClick={() => setOpen(true)}>Punya kode promo?</button>
  }
  return (
    <form className="hm-coupon" onSubmit={apply}>
      <label htmlFor="hm-coupon" className="dg-label">Kode promo</label>
      <div className="hm-coupon-row">
        <input id="hm-coupon" className="dg-input" value={code} autoFocus={!coupon}
          onChange={e => setCode(e.target.value.toUpperCase())} placeholder="mis. CINTA20" />
        <button type="submit" className="dg-btn dg-btn-line" disabled={status === 'checking'}>Pakai</button>
      </div>
      {status === 'ok' && coupon && <p className="hm-coupon-ok">{coupon.code}: potongan {coupon.discount_percent}% diterapkan pada harga di atas.</p>}
      {status === 'bad' && <p className="hm-coupon-bad">Kode tidak berlaku. Periksa ejaannya atau tanyakan ke admin.</p>}
    </form>
  )
}

function Pricing({ plans }) {
  const [coupon, setCoupon] = useState(null)
  const pct = coupon?.discount_percent || 0
  return (
    <section className="dg-band" id="harga">
      <div className="dg-container">
        <div className="dg-head center">
          <p className="dg-eyebrow">Harga</p>
          <h2 className="dg-h2">Sekali bayar, <em>tanpa biaya bulanan</em>.</h2>
          <p className="dg-lead">Mulai gratis. Bayar saat undangan siap diaktifkan.</p>
        </div>
        <div className="hm-prices" style={{ '--cols': `repeat(${Math.min(plans.length, 3)}, minmax(0, 1fr))` }}>
          {plans.map(p => {
            const final = pct && p.price ? Math.round(p.price * (1 - pct / 100)) : p.price
            const was = pct && p.price ? p.price : p.compare_at_price
            return (
              <div key={p.slug} className={`hm-plan ${p.is_featured ? 'dg-dark featured' : ''}`}>
                <div className="hm-plan-top">
                  <span className="hm-plan-name">{p.name}</span>
                  {p.badge && <span className="hm-badge">{p.badge}</span>}
                </div>
                <div className="hm-amount">
                  {was ? <s className="dg-num">{formatRp(was)}</s> : null}
                  <span className="dg-num"><small>Rp</small>{formatRp(final, false)}</span>
                </div>
                {p.audience && <p className="hm-aud">{p.audience}</p>}
                <ul>{p.features.map(f => <li key={f}>{Icon.check}<span>{f}</span></li>)}</ul>
                <Link to="/register" className={`dg-btn dg-btn-block ${p.is_featured ? 'dg-btn-gold' : 'dg-btn-line'}`}>{p.cta_label}</Link>
              </div>
            )
          })}
        </div>
        <div className="hm-price-foot">
          <Coupon coupon={coupon} setCoupon={setCoupon} />
          <a className="dg-link" target="_blank" rel="noopener noreferrer"
            href={waLink(`Halo, saya ingin dibantu membuat undangan digital${coupon ? ` (kode promo ${coupon.code})` : ''}`)}>
            Ingin dibantu admin? Chat WhatsApp
          </a>
        </div>
      </div>
    </section>
  )
}

function Testimonials({ items }) {
  if (!items.length) return null
  const cover = id => THEMES.find(t => t.id === id)
  return (
    <section className="dg-band dg-dark hm-quotes">
      <div className="dg-container">
        <div className="dg-head">
          <p className="dg-eyebrow">Dari pasangan DearGuest</p>
          <h2 className="dg-h2">Kata mereka yang <em>sudah mengirim</em>.</h2>
        </div>
        <div className="hm-quote-grid" style={{ '--cols': `repeat(${Math.min(items.length, 3)}, minmax(0, 1fr))` }}>
          {items.map(t => {
            const th = cover(t.theme)
            return (
              <figure key={t.id} className="hm-quote">
                <span className="hm-quote-mark">{Icon.quote}</span>
                <blockquote>{t.quote}</blockquote>
                <figcaption>
                  {th && <img src={th.previewImage} alt="" loading="lazy" />}
                  <span><b>{t.names}</b>{[t.city, t.theme_name && `tema ${t.theme_name}`].filter(Boolean).join(' · ')}</span>
                </figcaption>
              </figure>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <section className="dg-band paper" id="faq">
      <div className="dg-container hm-faq-grid">
        <div className="dg-head">
          <p className="dg-eyebrow">FAQ</p>
          <h2 className="dg-h2">Yang sering <em>ditanyakan</em>.</h2>
          <p className="dg-small">Belum terjawab? <a href={WA_HELP} target="_blank" rel="noopener noreferrer" className="dg-link">Tanya admin</a></p>
        </div>
        <div className="hm-faq">
          {FAQS.map((f, i) => (
            <div key={f.q} className="hm-faq-item">
              <h3>
                <button type="button" aria-expanded={open === i} aria-controls={`faq-${i}`} id={`faq-q-${i}`}
                  onClick={() => setOpen(o => (o === i ? -1 : i))}>
                  <span>{f.q}</span><span className="hm-faq-ic">{Icon.plus}</span>
                </button>
              </h3>
              <div id={`faq-${i}`} role="region" aria-labelledby={`faq-q-${i}`} hidden={open !== i}>
                <p>{f.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Closing() {
  return (
    <section className="dg-band dg-dark hm-closing">
      <div className="dg-container hm-closing-inner">
        <h2 className="dg-display">Hari kalian layak <em>dirayakan dengan indah</em>.</h2>
        <div className="hm-actions">
          <Link to="/register" className="dg-btn dg-btn-gold">Buat Undangan Gratis</Link>
          <Link to="/tema" className="dg-btn dg-btn-line">Lihat Semua Tema</Link>
        </div>
      </div>
    </section>
  )
}

export default function LandingPage() {
  const { plans, testimonials } = useMarketing()
  useEffect(trackVisit, [])
  useHashScroll()
  return (
    <div className="dg hm">
      <SiteNav />
      <main>
        <Hero />
        <ThemePicker />
        <Features />
        <Steps />
        <Pricing plans={plans} />
        <Testimonials items={testimonials} />
        <Faq />
        <Closing />
      </main>
      <SiteFooter />
      <StickyBar />
    </div>
  )
}
