import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'
import api from '../../api/client.js'
import SectionTitle, { useEmoji } from './SectionTitle.jsx'

const POLL_MS = 30000

// Newest first; a poll of page 1 is merged in front of what's already loaded.
function mergeNewest(fresh, current) {
  const seen = new Set(fresh.map(w => w.id))
  return [...fresh, ...current.filter(w => !seen.has(w.id))]
}

export default function WishesWall({ slug }) {
  const [wishes, setWishes] = useState([])
  const [nextPage, setNextPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const heart = useEmoji(' 🤍')

  async function fetchLatest() {
    try {
      const res = await api.get(`/invitations/${slug}/wishes/`)
      setWishes(current => mergeNewest(res.data.results || [], current))
      setNextPage(page => page ?? (res.data.next ? 2 : null))
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  async function loadMore() {
    if (!nextPage) return
    setLoadingMore(true)
    try {
      const res = await api.get(`/invitations/${slug}/wishes/?page=${nextPage}`)
      setWishes(current => mergeNewest(current, res.data.results || []))
      setNextPage(res.data.next ? nextPage + 1 : null)
    } catch {
      // silent
    } finally {
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    // Poll only while the tab is visible; catch up as soon as it comes back.
    let interval = null
    const start = () => { if (!interval) interval = setInterval(fetchLatest, POLL_MS) }
    const stop = () => { clearInterval(interval); interval = null }
    function onVisibility() {
      if (document.hidden) stop()
      else { fetchLatest(); start() }
    }
    fetchLatest()
    if (!document.hidden) start()
    document.addEventListener('visibilitychange', onVisibility)
    return () => { stop(); document.removeEventListener('visibilitychange', onVisibility) }
  }, [slug]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="wishes-section">
      <SectionTitle>Doa &amp; Ucapan</SectionTitle>
      {loading ? (
        <p className="wishes-loading">Memuat ucapan...</p>
      ) : wishes.length === 0 ? (
        <p className="wishes-empty">Jadilah yang pertama memberikan doa{heart}</p>
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
                key={wish.id}
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
      {nextPage && (
        // Reuses the themed secondary-button style every theme already ships.
        <div className="wa-share">
          <button type="button" className="wa-share-btn" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? 'Memuat…' : 'Lihat ucapan lainnya'}
          </button>
        </div>
      )}
    </section>
  )
}
