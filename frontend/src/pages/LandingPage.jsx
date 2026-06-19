import { motion } from 'framer-motion'

const ADMIN_WA = import.meta.env.VITE_ADMIN_WHATSAPP_NUMBER || '628123456789'
const waUrl = `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent('Halo, saya ingin memesan undangan digital')}`

const features = [
  { icon: '🎨', title: '3 Tema Eksklusif', desc: 'Javanese Malam Emas, Taman Bunga, dan Minimalis Putih' },
  { icon: '📩', title: 'Konfirmasi RSVP', desc: 'Tamu konfirmasi kehadiran langsung dari undangan' },
  { icon: '🎵', title: 'Musik Latar', desc: 'Tambahkan lagu favorit kalian sebagai latar undangan' },
  { icon: '🗺️', title: 'Peta Lokasi', desc: 'Google Maps terintegrasi untuk kemudahan tamu' },
  { icon: '💝', title: 'Amplop Digital', desc: 'Transfer hadiah langsung via rekening bank yang tersedia' },
  { icon: '📊', title: 'Dashboard RSVP', desc: 'Pantau konfirmasi tamu secara real-time' },
]

const themes = [
  { id: 'javanese-dark', name: 'Javanese Malam Emas', desc: 'Elegan dengan sentuhan emas pada latar gelap tembakau', colors: ['#1a1208', '#c9a84c', '#f5eed6'] },
  { id: 'floral-light', name: 'Taman Bunga', desc: 'Romantis dengan nuansa mawar pada latar putih blush', colors: ['#fdf8f5', '#c4847a', '#f7ede8'] },
  { id: 'modern-minimalist', name: 'Minimalis Putih', desc: 'Bersih dan modern dengan aksen sage hijau', colors: ['#ffffff', '#1f1f1f', '#8a9e8a'] },
]

export default function LandingPage() {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#1f1f1f', overflowX: 'hidden' }}>
      {/* Hero */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '4rem 2rem', background: 'linear-gradient(180deg, #fdf8f5 0%, #fff 100%)' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <p style={{ fontSize: '0.75rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#888', marginBottom: '1rem' }}>Digital Wedding Invitation</p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2.5rem, 8vw, 5rem)', fontWeight: 400, marginBottom: '1.5rem', lineHeight: 1.1 }}>
            Undangan Digital
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#555', maxWidth: '500px', lineHeight: 1.7, marginBottom: '2.5rem' }}>
            Undangan pernikahan digital yang indah untuk pasangan Indonesia. Desain eksklusif, mudah dibagikan, tanpa kertas.
          </p>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-block', background: '#25D366', color: 'white', padding: '0.9rem 2.5rem', textDecoration: 'none', fontSize: '0.9rem', letterSpacing: '0.05em', borderRadius: '2px' }}
          >
            Pesan via WhatsApp
          </a>
        </motion.div>
      </section>

      {/* Themes */}
      <section style={{ padding: '5rem 2rem', background: '#f9f9f7' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', textAlign: 'center', marginBottom: '3rem', fontWeight: 400, fontStyle: 'italic' }}>
          Pilih Tema Favoritmu
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
          {themes.map((theme, i) => (
            <motion.div
              key={theme.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              style={{ background: 'white', padding: '2rem', border: '1px solid #e8e8e4' }}
            >
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                {theme.colors.map(c => (
                  <div key={c} style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: '1px solid #e8e8e4' }} />
                ))}
              </div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 400, marginBottom: '0.5rem' }}>{theme.name}</h3>
              <p style={{ fontSize: '0.85rem', color: '#888', lineHeight: 1.6 }}>{theme.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '5rem 2rem' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', textAlign: 'center', marginBottom: '3rem', fontWeight: 400, fontStyle: 'italic' }}>
          Fitur Lengkap
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem', maxWidth: '900px', margin: '0 auto' }}>
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              style={{ textAlign: 'center' }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{f.icon}</div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.4rem' }}>{f.title}</h3>
              <p style={{ fontSize: '0.8rem', color: '#888', lineHeight: 1.6 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '5rem 2rem', background: '#1f1f1f', textAlign: 'center', color: 'white' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 400, fontStyle: 'italic', marginBottom: '1rem' }}>
          Siap Membuat Undangan?
        </h2>
        <p style={{ color: '#aaa', marginBottom: '2rem', fontSize: '0.9rem' }}>
          Hubungi kami via WhatsApp untuk konsultasi dan pemesanan.
        </p>
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'inline-block', background: '#25D366', color: 'white', padding: '0.9rem 2.5rem', textDecoration: 'none', fontSize: '0.9rem', letterSpacing: '0.05em', borderRadius: '2px' }}
        >
          Chat WhatsApp Sekarang
        </a>
      </section>

      <footer style={{ padding: '1.5rem', textAlign: 'center', fontSize: '0.75rem', color: '#888', borderTop: '1px solid #f0f0ee' }}>
        © {new Date().getFullYear()} Undangan Digital
      </footer>
    </div>
  )
}
