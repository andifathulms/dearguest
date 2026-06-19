import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export default function StorySection({ stories }) {
  if (!stories || stories.length === 0) return null
  return (
    <section className="story-section">
      <h2 className="section-title">Kisah Kami</h2>
      <div className="story-timeline">
        {stories.map((story, index) => (
          <motion.div
            key={story.id}
            className={`story-item ${index % 2 === 0 ? 'story-left' : 'story-right'}`}
            initial={{ opacity: 0, x: index % 2 === 0 ? -40 : 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
          >
            <div className="story-dot" />
            <div className="story-content">
              {story.date && (
                <p className="story-date">
                  {format(new Date(story.date), 'MMMM yyyy', { locale: id })}
                </p>
              )}
              <h3 className="story-title">{story.title}</h3>
              <p className="story-description">{story.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
