// Shared marketing constants: the admin's WhatsApp line and the sitemap the
// header and footer both render.
const ADMIN_WA = import.meta.env.VITE_ADMIN_WHATSAPP_NUMBER || '628123456789'

export const waLink = (msg) => `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(msg)}`
export const WA_HELP = waLink('Halo, saya ingin dibantu membuat undangan digital')

// Header menu. Hash links point at landing sections; from other pages they
// lead back to the landing page first.
export const NAV = [
  { label: 'Tema', to: '/tema' },
  { label: 'Cara Kerja', to: '/#cara-kerja' },
  { label: 'Harga', to: '/#harga' },
  { label: 'FAQ', to: '/#faq' },
]
