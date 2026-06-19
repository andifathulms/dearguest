import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'
import api from '../../api/client.js'

export default function WishesWall({ slug }) {
  const [wishes, setWishes] = useState([])
  const [loading, setLoading] = useState(true)

  async function fetchWishes() {
    try {
      const res = await api.get(`/invitations/${slug}/wishes/`)
      setWishes((res.data || []).slice(0, 20))
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWishes()
    const interval = setInterval(fetchWishes, 30000)
    return () => clearInterval(interval)
  }, [slug])

  return (
    <section className="wishes-section">
      <h2 className="section-title">Doa &amp; Ucapan</h2>
      {loading ? (
        <p className="wishes-loading">Memuat ucapan...</p>
      ) : wishes.length === 0 ? (
        <p className="wishes-empty">Jadilah yang pertama memberikan doa 🤍</p>
      ) : (
        <motion.div
          className="wishes-list"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.07 } },
          }}
        >
          <AnimatePresence>
            {wishes.map((wish, i) => (
              <motion.div
                key={`${wish.guest_name}-${wish.submitted_at}`}
                className="wish-card"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
                }}
              >
                <p className="wish-name">{wish.guest_name}</p>
                <p className="wish-text">{wish.wishes}</p>
                <p className="wish-time">
                  {formatDistanceToNow(new Date(wish.submitted_at), { locale: id, addSuffix: true })}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </section>
  )
}
