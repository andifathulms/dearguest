import { usePack } from './ThemeContext.jsx'
import { SlotFrame } from './SlotDebug.jsx'

const DESKTOP = '(min-aspect-ratio: 1/1)'

// Renders one asset slot from the active pack's theme.json (docs/theme-packs.md §4).
// Outside a pack, or for a slot the pack doesn't fill, it renders nothing and
// reserves no space, so layouts are identical with or without art.
export default function ThemeAsset({ slot, className = '' }) {
  const ctx = usePack()
  if (!ctx) return null
  const { pack, invitation } = ctx
  const slots = pack.manifest.slots || {}

  // corner-br may reuse corner-tl rotated 180° ("mirror": true on corner-tl).
  let spec = slots[slot]
  let mirrored = false
  if (!spec && slot === 'corner-br' && slots['corner-tl']?.mirror) {
    spec = slots['corner-tl']
    mirrored = true
  }

  const cls = `pk-slot pk-slot-${slot}${mirrored ? ' pk-slot-mirrored' : ''} ${className}`.trim()
  if (!spec) return <SlotFrame slot={slot} filled={false} className={cls} />

  let body
  if (spec.component) {
    const Component = pack.components[spec.component]
    body = <Component slot={slot} invitation={invitation} className={cls} />
  } else if (spec.svg) {
    // Pack SVGs are files from the repo (never user content); inlining them is
    // what lets single-colour line art follow currentColor.
    body = (
      <span
        className={cls}
        aria-hidden="true"
        style={{ '--slot-w': `${spec.width}px`, '--slot-h': `${spec.height}px` }}
        dangerouslySetInnerHTML={{ __html: pack.svgs[spec.svg] }}
      />
    )
  } else if (spec.repeat) {
    // Tileable textures are a decorative background, not content.
    body = (
      <div
        className={cls}
        aria-hidden="true"
        style={{
          backgroundImage: `url(${pack.urls[spec.src]})`,
          backgroundSize: `${spec.width}px ${spec.height}px`,
          mixBlendMode: spec.blend || 'normal',
          opacity: spec.opacity ?? 1,
        }}
      />
    )
  } else {
    body = (
      <picture className={cls} aria-hidden="true">
        {/* An optional landscape painting for wide screens ("desktop": {src, avif}). */}
        {spec.desktop?.avif && <source media={DESKTOP} type="image/avif" srcSet={pack.urls[spec.desktop.avif]} />}
        {spec.desktop && <source media={DESKTOP} srcSet={pack.urls[spec.desktop.src]} />}
        {spec.avif && <source type="image/avif" srcSet={pack.urls[spec.avif]} />}
        {spec.fallback && <source type="image/webp" srcSet={pack.urls[spec.src]} />}
        <img
          src={pack.urls[spec.fallback || spec.src]}
          width={spec.width}
          height={spec.height}
          alt=""
          loading={spec.priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      </picture>
    )
  }
  return <SlotFrame slot={slot} filled className={cls}>{body}</SlotFrame>
}
