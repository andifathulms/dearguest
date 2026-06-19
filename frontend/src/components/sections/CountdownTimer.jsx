import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

function getTimeLeft(targetDate) {
  const now = new Date()
  const target = new Date(targetDate)
  const diff = target - now
  if (diff <= 0) return null
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

export default function CountdownTimer({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState(targetDate ? getTimeLeft(targetDate) : null)

  useEffect(() => {
    if (!targetDate) return
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate))
    }, 1000)
    return () => clearInterval(interval)
  }, [targetDate])

  if (!targetDate) return null

  if (!timeLeft) {
    return (
      <section className="countdown-section">
        <p className="countdown-done">Alhamdulillah, hari bahagia telah tiba 🤍</p>
      </section>
    )
  }

  const units = [
    { label: 'Hari', value: timeLeft.days },
    { label: 'Jam', value: timeLeft.hours },
    { label: 'Menit', value: timeLeft.minutes },
    { label: 'Detik', value: timeLeft.seconds },
  ]

  return (
    <motion.section
      className="countdown-section"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
    >
      <h2 className="section-title">Menuju Hari Bahagia</h2>
      <div className="countdown-grid">
        {units.map(({ label, value }) => (
          <div key={label} className="countdown-unit">
            <span className="countdown-value">{String(value).padStart(2, '0')}</span>
            <span className="countdown-label">{label}</span>
          </div>
        ))}
      </div>
    </motion.section>
  )
}
