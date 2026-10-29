// Fallback pricing if /api/site/marketing/ can't be reached: the same three
// cards migration 0045 seeds. The admin's copy (Plan) is the one shown normally.
export const DEFAULT_PLANS = [
  {
    slug: 'gratis', name: 'Gratis', price: 0, compare_at_price: null, badge: '', is_featured: false,
    audience: 'Untuk mencoba semua fitur sebelum memutuskan.', cta_label: 'Coba Gratis',
    features: ['1 undangan, aktif 14 hari', 'RSVP & dinding ucapan', 'Countdown & peta lokasi', 'Dengan watermark DearGuest'],
  },
  {
    slug: 'premium', name: 'Premium', price: 99000, compare_at_price: 199000, badge: 'Paling dipilih', is_featured: true,
    audience: 'Satu undangan lengkap, sekali bayar.', cta_label: 'Pilih Premium',
    features: ['Semua tema berlukis', 'Galeri foto & kisah cinta', 'Musik latar & amplop digital', 'Kirim WhatsApp dari daftar tamu', 'Dashboard RSVP + unduh CSV', 'Tanpa watermark'],
  },
  {
    slug: 'bisnis', name: 'Bisnis', price: 179000, compare_at_price: 299000, badge: '', is_featured: false,
    audience: 'Dua acara dalam satu akun, misalnya akad dan ngunduh mantu.', cta_label: 'Pilih Bisnis',
    features: ['Semua fitur Premium', '2 undangan dalam 1 akun', 'Kustomisasi warna & tata letak', 'Foto tanpa batas', 'Prioritas pengerjaan (24 jam)'],
  },
]

// 99000 -> "Rp99.000" (or "99.000" without the prefix).
export const formatRp = (n, prefix = true) => `${prefix ? 'Rp' : ''}${Number(n || 0).toLocaleString('id-ID')}`
