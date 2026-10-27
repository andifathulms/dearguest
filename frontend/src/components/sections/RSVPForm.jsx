import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../../api/client.js'
import SectionTitle from './SectionTitle.jsx'
import { useCopy } from '../../copy/CopyContext.jsx'

export default function RSVPForm({ slug }) {
  const [searchParams] = useSearchParams()
  const guestCode = searchParams.get('g') || ''
  const [form, setForm] = useState({
    guest_name: searchParams.get('to') || '',
    whatsapp: '',
    attending: true,
    pax: 1,
    wishes: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const { t } = useCopy()
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
      setError(t('rsvp.nameRequired'))
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.post(`/invitations/${slug}/rsvp/`, {
        ...form,
        pax: form.attending ? parseInt(form.pax, 10) : 1,
        guest_code: guestCode,
      })
      setSubmitted(true)
    } catch (err) {
      const msg = err.response?.data?.detail || t('rsvp.failed')
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
          <p>{t('rsvp.thanks')}</p>
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
      <SectionTitle>{t('rsvp.title')}</SectionTitle>
      <form className="rsvp-form" onSubmit={handleSubmit}>
        <input
          className="rsvp-input"
          name="guest_name"
          placeholder={t('rsvp.name')}
          aria-label="Nama lengkap"
          value={form.guest_name}
          onChange={handleChange}
          required
        />
        <input
          className="rsvp-input"
          name="whatsapp"
          placeholder={t('rsvp.whatsapp')}
          aria-label="Nomor WhatsApp"
          value={form.whatsapp}
          onChange={handleChange}
        />
        <div className="rsvp-attending-toggle">
          <button
            type="button"
            className={`rsvp-toggle-btn ${form.attending ? 'active' : ''}`}
            onClick={() => setAttending(true)}
          >
            {t('rsvp.attending')}
          </button>
          <button
            type="button"
            className={`rsvp-toggle-btn ${!form.attending ? 'active' : ''}`}
            onClick={() => setAttending(false)}
          >
            {t('rsvp.notAttending')}
          </button>
        </div>
        {form.attending && (
          <div className="rsvp-pax">
            <label className="rsvp-pax-label">{t('rsvp.pax')}</label>
            <input
              className="rsvp-input"
              type="number"
              name="pax"
              min="1"
              max="10"
              aria-label="Jumlah tamu"
              value={form.pax}
              onChange={handleChange}
            />
          </div>
        )}
        <textarea
          className="rsvp-textarea"
          name="wishes"
          placeholder={t('rsvp.wishes')}
          aria-label="Doa dan ucapan"
          rows="4"
          value={form.wishes}
          onChange={handleChange}
        />
        {error && <p className="rsvp-error">{error}</p>}
        <button className="rsvp-submit" type="submit" disabled={loading}>
          {loading ? t('rsvp.sending') : t('rsvp.submit')}
        </button>
      </form>
    </motion.section>
  )
}
