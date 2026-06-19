import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export default function HeroSection({ brideName, groomName, weddingDate, theme }) {
  const formatted = weddingDate
    ? format(new Date(weddingDate), 'EEEE, d MMMM yyyy', { locale: id })
    : ''

  return (
    <section className="hero-section">
      <motion.div
        className="hero-content"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        <p className="hero-bismillah">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم</p>
        <p className="hero-label">We Are Getting Married</p>
        <motion.h1
          className="hero-names"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <span className="hero-bride">{brideName}</span>
          <span className="hero-ampersand">&amp;</span>
          <span className="hero-groom">{groomName}</span>
        </motion.h1>
        <motion.p
          className="hero-date"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          {formatted}
        </motion.p>
      </motion.div>
    </section>
  )
}
