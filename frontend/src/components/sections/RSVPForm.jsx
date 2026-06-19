import { useState } from 'react'
import { motion } from 'framer-motion'
import api from '../../api/client.js'

export default function RSVPForm({ slug }) {
  const [form, setForm] = useState({
    guest_name: '',
    whatsapp: '',
    attending: true,
    pax: 1,
    wishes: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  function setAttending(val) {
    setForm(f => ({ ...f, attending: val }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.guest_name.trim()) {
      setError('Nama wajib diisi.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.post(`/invitations/${slug}/rsvp/`, {
        ...form,
        pax: form.attending ? parseInt(form.pax, 10) : 1,
      })
      setSubmitted(true)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Gagal mengirim. Coba lagi.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <section className="rsvp-section">
        <motion.div
          className="rsvp-success"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <p>Jazakumullah khairan. Konfirmasi Anda telah kami terima 🤍</p>
        </motion.div>
      </section>
    )
  }

  return (
    <motion.section
      className="rsvp-section"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
    >
      <h2 className="section-title">Konfirmasi Kehadiran</h2>
      <form className="rsvp-form" onSubmit={handleSubmit}>
        <input
          className="rsvp-input"
          name="guest_name"
          placeholder="Nama Lengkap *"
          value={form.guest_name}
          onChange={handleChange}
          required
        />
        <input
          className="rsvp-input"
          name="whatsapp"
          placeholder="Nomor WhatsApp (opsional)"
          value={form.whatsapp}
          onChange={handleChange}
        />
        <div className="rsvp-attending-toggle">
          <button
            type="button"
            className={`rsvp-toggle-btn ${form.attending ? 'active' : ''}`}
            onClick={() => setAttending(true)}
          >
            Hadir
          </button>
          <button
            type="button"
            className={`rsvp-toggle-btn ${!form.attending ? 'active' : ''}`}
            onClick={() => setAttending(false)}
          >
            Tidak Hadir
          </button>
        </div>
        {form.attending && (
          <div className="rsvp-pax">
            <label className="rsvp-pax-label">Jumlah Tamu</label>
            <input
              className="rsvp-input"
              type="number"
              name="pax"
              min="1"
              max="10"
              value={form.pax}
              onChange={handleChange}
            />
          </div>
        )}
        <textarea
          className="rsvp-textarea"
          name="wishes"
          placeholder="Doa & ucapan untuk kedua mempelai..."
          rows="4"
          value={form.wishes}
          onChange={handleChange}
        />
        {error && <p className="rsvp-error">{error}</p>}
        <button className="rsvp-submit" type="submit" disabled={loading}>
          {loading ? 'Mengirim...' : 'Kirim Konfirmasi'}
        </button>
      </form>
    </motion.section>
  )
}
