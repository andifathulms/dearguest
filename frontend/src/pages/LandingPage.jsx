import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../api/client.js'
import { FEATURED_THEMES, THEME_CATALOG } from '../data/themes.js'
import './LandingPage.css'

const ADMIN_WA = import.meta.env.VITE_ADMIN_WHATSAPP_NUMBER || '628123456789'
const wa = (msg) => `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(msg)}`
const waOrder = wa('Halo, saya ingin memesan undangan digital')

/* ---- inline SVG icon set (no emoji, crisp at any size) ---- */
const Icon = {
  rsvp: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>,
  music: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="18" r="2.5" /><circle cx="17" cy="16" r="2.5" /><path d="M8.5 18V6l11-2v10" /></svg>,
  map: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
  gift: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13M5 12v9h14v-9" /><path d="M12 8S10 3 7.5 4.5 9.5 8 12 8zM12 8s2-5 4.5-3.5S14.5 8 12 8z" /></svg>,
  chart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><rect x="7" y="11" width="3" height="6" /><rect x="13" y="7" width="3" height="10" /></svg>,
  palette: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="1" /><circle cx="17.5" cy="10.5" r="1" /><circle cx="8.5" cy="7.5" r="1" /><circle cx="6.5" cy="12.5" r="1" /><path d="M12 2a10 10 0 0 0 0 20c1 0 1.5-.8 1.5-1.6 0-.5-.2-.9-.5-1.2-.3-.4-.5-.8-.5-1.2 0-.9.7-1.5 1.6-1.5H16a6 6 0 0 0 6-6c0-4.4-4.5-8-10-8z" /></svg>,
  gallery: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>,
  heart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" /></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>,
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  whatsapp: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-1.6-.8-2.6-1.4-3.7-3.2-.3-.5.3-.4.8-1.4.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 5 4.3 1.8.8 2.5.8 3.4.7.6-.1 1.7-.7 1.9-1.4.2-.6.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2z" /></svg>,
}

const features = [
  { icon: Icon.palette, title: `${THEME_CATALOG.length} Tema Eksklusif`, desc: 'Dari Javanese emas, floral, dan minimalis hingga zamrud, marun, langit malam, arabesque, art deco, dan rose gold — semua dengan palet premium.' },
  { icon: Icon.rsvp, title: 'Konfirmasi RSVP', desc: 'Tamu mengonfirmasi kehadiran dan jumlah orang langsung dari undangan, tersimpan otomatis.' },
  { icon: Icon.music, title: 'Musik Latar', desc: 'Iringi undangan dengan lagu favorit kalian. Diputar lembut saat undangan dibuka.' },
  { icon: Icon.map, title: 'Peta Lokasi', desc: 'Google Maps terintegrasi untuk akad dan resepsi — tamu tinggal klik untuk navigasi.' },
  { icon: Icon.gift, title: 'Amplop Digital', desc: 'Terima hadiah via transfer dengan tombol salin nomor rekening yang praktis.' },
  { icon: Icon.gallery, title: 'Galeri & Kisah', desc: 'Bagikan momen prewedding dan perjalanan cinta kalian dalam galeri yang elegan.' },
  { icon: Icon.chart, title: 'Dashboard RSVP', desc: 'Pantau konfirmasi tamu real-time dan unduh data sebagai CSV kapan saja.' },
  { icon: Icon.heart, title: 'Doa & Ucapan', desc: 'Dinding ucapan langsung dari tamu, tampil cantik dan diperbarui otomatis.' },
]

const steps = [
  { n: 1, title: 'Pesan & Konsultasi', desc: 'Hubungi kami via WhatsApp, pilih tema, dan ceritakan detail acara kalian.' },
  { n: 2, title: 'Kirim Data', desc: 'Berikan foto, nama mempelai, jadwal, lokasi, dan rekening. Kami susun semuanya.' },
  { n: 3, title: 'Undangan Jadi', desc: 'Undangan siap dalam 1–2 hari, lengkap dengan link personalisasi nama tamu.' },
  { n: 4, title: 'Bagikan', desc: 'Sebar via WhatsApp ke semua tamu dan pantau RSVP dari dashboard.' },
]

const plans = [
  { name: 'Gratis', desc: 'Coba dulu, tanpa biaya.', price: '0', was: null, featured: false, cta: 'Mulai Gratis', features: ['1 undangan aktif 14 hari', 'Tema dasar', 'RSVP & dinding ucapan', 'Countdown & peta lokasi'] },
  { name: 'Premium', desc: 'Paling populer untuk pasangan.', price: '99', was: '199', featured: true, cta: 'Pilih Premium', features: ['Semua tema eksklusif', 'Galeri foto & kisah cinta', 'Musik latar & amplop digital', 'Dashboard RSVP + export CSV', 'Tanpa watermark'] },
  { name: 'Bisnis', desc: 'Untuk dua acara dalam satu akun.', price: '179', was: '299', featured: false, cta: 'Pilih Bisnis', features: ['Semua fitur Premium', '2 undangan dalam 1 akun', 'Kustomisasi warna & tata letak', 'Foto tanpa batas', 'Prioritas pengerjaan (24 jam)'] },
]

const faqs = [
  { q: 'Berapa lama undangan selesai dibuat?', a: 'Umumnya 1–2 hari kerja setelah data lengkap kami terima. Paket Eksklusif diprioritaskan dalam 24 jam.' },
  { q: 'Apakah nama tamu bisa muncul otomatis?', a: 'Bisa. Setiap tamu mendapat link personal sehingga namanya tampil di sampul undangan, terasa lebih personal.' },
  { q: 'Berapa lama undangan bisa diakses?', a: 'Undangan aktif hingga 3 bulan setelah tanggal pernikahan, cukup untuk seluruh rangkaian acara.' },
  { q: 'Bagaimana cara membayar dan memesan?', a: 'Cukup klik tombol WhatsApp, kami akan memandu pemilihan tema, pengiriman data, hingga pembayaran.' },
  { q: 'Apakah bisa request warna atau tema khusus?', a: 'Tentu. Pada paket Eksklusif kami melayani kustomisasi warna, tata letak, dan kebutuhan khusus lainnya.' },
]

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.6, delay },
})

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`lp-faq-item ${open ? 'open' : ''}`}>
      <button className="lp-faq-q" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span>{q}</span>
        <span className="ic">{Icon.plus}</span>
      </button>
      {open && <p className="lp-faq-a">{a}</p>}
    </div>
  )
}

function CouponBox({ code, setCode, coupon, setCoupon }) {
  const [status, setStatus] = useState('')
  async function apply(e) {
    e.preventDefault()
    if (!code.trim()) return
    setStatus('checking')
    try {
      const res = await api.get(`/coupons/validate/?code=${encodeURIComponent(code)}`)
      if (res.data.valid) { setCoupon(res.data); setStatus('ok') }
      else { setCoupon(null); setStatus('bad') }
    } catch { setStatus('bad') }
  }
  return (
    <form className="lp-coupon" onSubmit={apply}>
      <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="Kode promo (mis. CINTA20)" />
      <button type="submit" className="lp-btn lp-btn-ghost">Pakai</button>
      {status === 'ok' && coupon && <span className="lp-coupon-ok">✓ {coupon.code} −{coupon.discount_percent}% diterapkan</span>}
      {status === 'bad' && <span className="lp-coupon-bad">Kode tidak valid</span>}
    </form>
  )
}

export default function LandingPage() {
  const [code, setCode] = useState('')
  const [coupon, setCoupon] = useState(null)
  const pct = coupon?.discount_percent || 0

  return (
    <div className="lp">
      {/* ===== Nav ===== */}
      <nav className="lp-nav">
        <div className="lp-container lp-nav-inner">
          <a href="#top" className="lp-brand" style={{ textDecoration: 'none' }}>
            <span className="lp-brand-mark">D</span>
            <span>Dear<span style={{ fontStyle: 'italic' }}>Guest</span></span>
          </a>
          <div className="lp-nav-menu lp-nav-links">
            <a href="#tema">Tema</a>
            <a href="#fitur">Fitur</a>
            <a href="#harga">Harga</a>
            <a href="#faq">FAQ</a>
            <Link to="/dashboard">Masuk</Link>
          </div>
          <Link to="/register" className="lp-btn lp-btn-primary lp-nav-cta">
            Buat Undangan
          </Link>
        </div>
      </nav>

      {/* ===== Hero ===== */}
      <header className="lp-hero" id="top">
        <div className="lp-hero-inner">
          <motion.div {...fade(0)}>
            <span className="lp-hero-badge"><span className="dot" /> Dipercaya pasangan di seluruh Indonesia</span>
          </motion.div>
          <motion.h1 {...fade(0.05)}>
            Undangan Pernikahan <em>Digital</em> yang Elegan & Berkesan
          </motion.h1>
          <motion.p className="lp-hero-sub" {...fade(0.1)}>
            Rayakan hari bahagia kalian dengan undangan online yang indah — tema eksklusif,
            RSVP, galeri, musik, dan amplop digital. Mudah dibagikan, tanpa kertas.
          </motion.p>
          <motion.div className="lp-hero-actions" {...fade(0.15)}>
            <Link to="/register" className="lp-btn lp-btn-primary">Buat Undangan Gratis</Link>
            <a href={waOrder} target="_blank" rel="noopener noreferrer" className="lp-btn lp-btn-wa">
              {Icon.whatsapp} Konsultasi via WhatsApp
            </a>
          </motion.div>
          <motion.div className="lp-hero-trust" {...fade(0.25)}>
            <div><strong>{THEME_CATALOG.length}</strong> Tema Eksklusif</div>
            <div><strong>1–2</strong> Hari Pengerjaan</div>
            <div><strong>100%</strong> Responsif di HP</div>
          </motion.div>
        </div>
      </header>

      {/* ===== Trust metrics + sustainability ===== */}
      <section className="lp-stats">
        <div className="lp-container">
          <div className="lp-stats-grid">
            {[
              { value: `${THEME_CATALOG.length}`, label: 'Tema Eksklusif' },
              { value: '100%', label: 'Optimal di HP' },
              { value: '24 jam', label: 'Pengerjaan' },
              { value: '0', label: 'Kertas Terbuang' },
            ].map((s, i) => (
              <motion.div className="lp-stat" key={s.label} {...fade(i * 0.06)}>
                <strong className="lp-serif">{s.value}</strong>
                <span>{s.label}</span>
              </motion.div>
            ))}
          </div>
          <motion.p className="lp-stats-eco" {...fade(0.2)}>
            🌿 Setiap undangan digital membantu mengurangi limbah kertas — elegan sekaligus ramah lingkungan.
          </motion.p>
        </div>
      </section>

      {/* ===== Themes ===== */}
      <section className="lp-section lp-themes" id="tema">
        <div className="lp-container">
          <div className="lp-section-head">
            <p className="lp-eyebrow">Pilihan Tema</p>
            <h2>{THEME_CATALOG.length} tema, satu kesan: mewah</h2>
            <p>Setiap tema dirancang dengan tipografi, warna, dan ornamen yang harmonis untuk menonjolkan momen kalian. Berikut beberapa favorit kami.</p>
          </div>
          <div className="lp-theme-grid">
            {FEATURED_THEMES.map((t, i) => (
              <motion.div className="lp-theme-card" key={t.id} {...fade(i * 0.08)}>
                <div className={`lp-theme-preview ${t.preview}`}>
                  <span className="tp-label">The Wedding Of</span>
                  <div className="tp-names lp-serif">
                    Andini<span className="tp-amp">&amp;</span>Bagus
                  </div>
                  <div className="tp-rule" />
                  <span className="tp-date">12 · 12 · 2026</span>
                </div>
                <div className="lp-theme-body">
                  <h3>{t.name}</h3>
                  <p>{t.desc}</p>
                  <div className="lp-theme-swatches">
                    {t.colors.map(c => <span key={c} style={{ background: c }} />)}
                  </div>
                  <a className="lp-theme-demo" href={`/${t.demo}`} target="_blank" rel="noopener noreferrer">Lihat Demo Lengkap ↗</a>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="lp-themes-more">
            <Link className="lp-btn lp-btn-primary" to="/tema">
              Jelajahi Semua {THEME_CATALOG.length} Tema {Icon.palette}
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Features ===== */}
      <section className="lp-section" id="fitur">
        <div className="lp-container">
          <div className="lp-section-head">
            <p className="lp-eyebrow">Fitur Lengkap</p>
            <h2>Semua yang kalian butuhkan, dalam satu tautan</h2>
            <p>Dirancang untuk memudahkan kalian dan memanjakan tamu undangan.</p>
          </div>
          <div className="lp-feature-grid">
            {features.map((f, i) => (
              <motion.div className="lp-feature" key={f.title} {...fade((i % 4) * 0.06)}>
                <div className="lp-feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== How it works ===== */}
      <section className="lp-section lp-steps">
        <div className="lp-container">
          <div className="lp-section-head">
            <p className="lp-eyebrow">Cara Pesan</p>
            <h2>Hanya 4 langkah mudah</h2>
          </div>
          <div className="lp-step-grid">
            {steps.map((s, i) => (
              <motion.div className="lp-step" key={s.n} {...fade(i * 0.08)}>
                <div className="lp-step-num">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Pricing ===== */}
      <section className="lp-section" id="harga">
        <div className="lp-container">
          <div className="lp-section-head">
            <p className="lp-eyebrow">Harga</p>
            <h2>Harga terjangkau, sekali bayar</h2>
            <p>Mulai dari gratis. Tanpa biaya bulanan, tanpa biaya tersembunyi — dan setiap paket sudah termasuk pendampingan penuh via WhatsApp.</p>
          </div>
          <p className="lp-price-promo">🎉 Harga promo — hemat hingga 50% untuk periode terbatas</p>
          <CouponBox code={code} setCode={setCode} coupon={coupon} setCoupon={setCoupon} />
          <div className="lp-price-grid">
            {plans.map((p, i) => {
              const isFree = p.price === '0'
              const base = Number(p.price)
              const finalPrice = pct ? Math.round(base * (1 - pct / 100)) : base
              return (
                <motion.div className={`lp-price-card ${p.featured ? 'featured' : ''}`} key={p.name} {...fade(i * 0.08)}>
                  {p.featured && <span className="lp-price-tag">Paling Populer</span>}
                  <div className="lp-price-name lp-serif">{p.name}</div>
                  <p className="lp-price-desc">{p.desc}</p>
                  {isFree ? (
                    <div className="lp-price-amount lp-serif">Gratis</div>
                  ) : (
                    <div className="lp-price-amount lp-serif">
                      {pct ? <span className="lp-price-was">Rp{p.price}.000</span> : (p.was && <span className="lp-price-was">Rp{p.was}.000</span>)}
                      <span><small>Rp</small>{finalPrice}.000</span>
                    </div>
                  )}
                  <p className="lp-price-note">{isFree ? 'tanpa kartu kredit' : 'sekali bayar / undangan'}</p>
                  <ul className="lp-price-features">
                    {p.features.map(ft => (
                      <li key={ft}>{Icon.check}<span>{ft}</span></li>
                    ))}
                  </ul>
                  {isFree ? (
                    <Link to="/register" className="lp-btn lp-btn-ghost">{p.cta}</Link>
                  ) : (
                    <a
                      href={wa(`Halo, saya tertarik dengan paket ${p.name} untuk undangan digital${pct ? ` (kode promo ${coupon.code})` : ''}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`lp-btn ${p.featured ? 'lp-btn-primary' : 'lp-btn-ghost'}`}
                    >
                      {p.cta}
                    </a>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="lp-section" id="faq">
        <div className="lp-container">
          <div className="lp-section-head">
            <p className="lp-eyebrow">FAQ</p>
            <h2>Pertanyaan yang sering ditanyakan</h2>
          </div>
          <div className="lp-faq-list">
            {faqs.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="lp-cta">
        <motion.div {...fade(0)}>
          <h2>Siap membuat undangan <em>impian</em>?</h2>
          <p>Konsultasikan kebutuhan acara kalian sekarang. Gratis, tanpa komitmen.</p>
          <a href={waOrder} target="_blank" rel="noopener noreferrer" className="lp-btn lp-btn-wa">
            {Icon.whatsapp} Chat WhatsApp Sekarang
          </a>
        </motion.div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-inner">
            <div className="lp-brand">
              <span className="lp-brand-mark">D</span>
              <span>Dear<span style={{ fontStyle: 'italic' }}>Guest</span></span>
            </div>
            <div className="lp-footer-links">
              <a href="#tema">Tema</a>
              <a href="#fitur">Fitur</a>
              <a href="#harga">Harga</a>
              <a href="#faq">FAQ</a>
              <a href={waOrder} target="_blank" rel="noopener noreferrer">WhatsApp</a>
            </div>
          </div>
          <p className="lp-footer-copy">© {new Date().getFullYear()} Dear Guest · Undangan pernikahan online untuk pasangan Indonesia 🤍</p>
        </div>
      </footer>
    </div>
  )
}
