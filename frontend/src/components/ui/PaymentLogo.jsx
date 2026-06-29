// Recognizable brand badges (brand colour + wordmark) for common Indonesian
// banks & e-wallets, matched by name. Clean and reliable — no external assets.
const BRANDS = [
  { keys: ['bca'], label: 'BCA', bg: '#0066ae', fg: '#fff' },
  { keys: ['mandiri'], label: 'mandiri', bg: '#163a7d', fg: '#ffc72c' },
  { keys: ['bni'], label: 'BNI', bg: '#006a65', fg: '#ff7900' },
  { keys: ['bri'], label: 'BRI', bg: '#00529c', fg: '#fff' },
  { keys: ['bsi', 'syariah indonesia'], label: 'BSI', bg: '#00a39d', fg: '#fff' },
  { keys: ['cimb'], label: 'CIMB', bg: '#7a1f2b', fg: '#fff' },
  { keys: ['permata'], label: 'Permata', bg: '#1a4f8b', fg: '#fff' },
  { keys: ['danamon'], label: 'Danamon', bg: '#f58220', fg: '#fff' },
  { keys: ['jago'], label: 'Jago', bg: '#ff6a13', fg: '#fff' },
  { keys: ['seabank'], label: 'SeaBank', bg: '#2b2c9b', fg: '#fff' },
  { keys: ['btn'], label: 'BTN', bg: '#f0592a', fg: '#fff' },
  { keys: ['gopay', 'go-pay'], label: 'gopay', bg: '#00aad2', fg: '#fff' },
  { keys: ['ovo'], label: 'OVO', bg: '#4b2a82', fg: '#fff' },
  { keys: ['dana'], label: 'DANA', bg: '#118eea', fg: '#fff' },
  { keys: ['shopee'], label: 'ShopeePay', bg: '#ee4d2d', fg: '#fff' },
  { keys: ['linkaja', 'link aja'], label: 'LinkAja', bg: '#e21f26', fg: '#fff' },
  { keys: ['qris'], label: 'QRIS', bg: '#ffffff', fg: '#e1251b', border: true },
]

function brandFor(name) {
  const n = (name || '').toLowerCase()
  return BRANDS.find(b => b.keys.some(k => n.includes(k)))
}

export default function PaymentLogo({ name }) {
  const b = brandFor(name)
  if (b) {
    return (
      <span className="pay-logo" style={{ background: b.bg, color: b.fg, border: b.border ? '1px solid #e3d9c8' : 'none' }}>
        {b.label}
      </span>
    )
  }
  // Generic wallet/card mark when the brand isn't recognized.
  return (
    <span className="pay-logo pay-logo-generic" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18" />
      </svg>
    </span>
  )
}
