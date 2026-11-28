// Voucher maths, the same as the server's (backend apps/invitations/vouchers.py):
// used for price previews on the landing page, in the editor and in the
// backoffice. The server re-checks every voucher before money changes hands.

export const PAID_PLANS = ['premium', 'bisnis']

// Codes as typed or pasted: spaces and stray punctuation gone, upper case.
export const normaliseCode = code => String(code || '').toUpperCase().replace(/[^A-Z0-9-]/g, '')

export const appliesTo = (voucher, plan) => (voucher.plans?.length ? voucher.plans : PAID_PLANS).includes(plan)

// Rupiah off `price`: never more than the price, percent capped at max_discount.
export function voucherDiscount(voucher, price) {
  if (!voucher || !price) return 0
  let off
  if (voucher.discount_type === 'amount') {
    off = Number(voucher.discount_amount) || 0
  } else {
    off = Math.floor((price * (Number(voucher.discount_percent) || 0)) / 100)
    if (voucher.max_discount) off = Math.min(off, Number(voucher.max_discount))
  }
  return Math.min(off, price)
}

// The price after a voucher, for a plan it may be used on.
export const priceWith = (voucher, plan, price) => price - (voucher && appliesTo(voucher, plan) ? voucherDiscount(voucher, price) : 0)

// Short, for a badge or stub: "20%", "Rp25rb", "Rp12,5rb".
export function voucherShort(voucher) {
  if (!voucher) return ''
  if (voucher.discount_type !== 'amount') return `${voucher.discount_percent}%`
  const n = Number(voucher.discount_amount || 0)
  return n >= 1000 ? `Rp${(n / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 })}rb` : `Rp${n}`
}

// "20%" or "Rp25.000", plus the cap: "20% (maks. Rp30.000)".
export function voucherLabel(voucher, { cap = true } = {}) {
  if (!voucher) return ''
  if (voucher.discount_type === 'amount') return `Rp${Number(voucher.discount_amount || 0).toLocaleString('id-ID')}`
  const max = cap && voucher.max_discount ? ` (maks. Rp${Number(voucher.max_discount).toLocaleString('id-ID')})` : ''
  return `${voucher.discount_percent}%${max}`
}
