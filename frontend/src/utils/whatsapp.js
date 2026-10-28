// WhatsApp numbers, exactly as the backend normalises them
// (models.normalise_whatsapp): '0812-3456 789', '+62 812…', '62812…', '812…'
// -> '62812…'; '' if it can't be a number. Shared cases: whatsapp.test.js and
// tests/test_blast.py NormaliserCases.
export function normaliseWhatsapp(value) {
  let digits = String(value || '').replace(/\D/g, '')
  if (digits.startsWith('0')) digits = '62' + digits.slice(1)
  else if (digits.startsWith('8')) digits = '62' + digits
  return digits.length >= 9 && digits.length <= 15 ? digits : ''
}

// A wa.me deep link. Without a number WhatsApp asks whom to send it to.
export function waLink(number, text) {
  const n = normaliseWhatsapp(number)
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`
}
