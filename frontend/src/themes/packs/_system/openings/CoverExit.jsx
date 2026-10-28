import { motion } from 'framer-motion'
import { useCopy } from '../../../../copy/CopyContext.jsx'

// How the cover leaves once the guest opens it (theme.json → motion.exit,
// docs/theme-packs.md §9). The cover is drawn again as one or two pieces, each
// clipped to its part of the screen, which then swing, slide or part away to
// show the hero underneath. The text fades first, so it never splits mid-word.
//   fade     the cover fades out (the default; also under reduced motion)
//   bloom    it grows and fades, as if walking through it
//   doors    two doors swing open towards the guest (gebyok, carved doors)
//   curtain  two curtains gather to the sides (canopies, lamming drapes)
//   part     the top and bottom halves part (clouds, roofline and runner)
const HALF_L = 'inset(0% 50% 0% 0%)'
const HALF_R = 'inset(0% 0% 0% 50%)'
const EXITS = {
  fade: { dur: 0.7, pieces: [{ to: { opacity: 0 } }] },
  bloom: { dur: 1.1, pieces: [{ to: { opacity: 0, scale: 1.18 } }] },
  doors: {
    dur: 1.5,
    pieces: [
      { clip: HALF_L, origin: '0% 50%', to: { rotateY: -96, opacity: 0 } },
      { clip: HALF_R, origin: '100% 50%', to: { rotateY: 96, opacity: 0 } },
    ],
  },
  curtain: {
    dur: 1.4,
    pieces: [
      { clip: HALF_L, origin: '0% 50%', to: { scaleX: 0.15, opacity: 0 } },
      { clip: HALF_R, origin: '100% 50%', to: { scaleX: 0.15, opacity: 0 } },
    ],
  },
  part: {
    dur: 1.4,
    pieces: [
      { clip: 'inset(0% 0% 50% 0%)', to: { y: '-62%', opacity: 0 } },
      { clip: 'inset(50% 0% 0% 0%)', to: { y: '62%', opacity: 0 } },
    ],
  },
}

export default function CoverExit({ kind, Cover, invitation, guestName, onDone }) {
  const { t } = useCopy()
  const exit = EXITS[kind] || EXITS.fade
  const split = exit.pieces.length > 1
  return (
    <div className="pk-opening pk-opening-exit" data-exit={kind} aria-hidden="true">
      {exit.pieces.map((p, i) => (
        <motion.div
          key={i}
          className="pk-exit-piece"
          style={{ clipPath: p.clip, transformOrigin: p.origin, transformPerspective: 1400 }}
          animate={p.to}
          transition={{
            duration: exit.dur,
            ease: [0.65, 0, 0.35, 1],
            // split pieces stay solid while they move and fade only at the end
            opacity: split ? { duration: exit.dur * 0.35, delay: exit.dur * 0.65 } : { duration: exit.dur },
          }}
          onAnimationComplete={i === 0 ? onDone : undefined}
        >
          <Cover
            invitation={invitation}
            guestName={guestName}
            openButton={<button className="pk-open-btn cover-open-btn" type="button" tabIndex={-1}>{t('cover.open')}</button>}
          />
        </motion.div>
      ))}
    </div>
  )
}
