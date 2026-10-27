// An <img> that uses the server's renditions when it has them (`*_meta`
// from the API: WebP widths + the original as fallback) and reserves its box
// with width/height. Without meta it is a plain <img src>.
export default function ResponsiveImg({ src, meta, sizes, alt = '', ...rest }) {
  if (!meta) return <img src={src} alt={alt} {...rest} />
  return (
    // srcSet/sizes before src: the browser picks a candidate as soon as src is set.
    <img
      srcSet={meta.srcset}
      sizes={sizes}
      src={meta.fallback || src}
      width={meta.width}
      height={meta.height}
      alt={alt}
      {...rest}
    />
  )
}

// Warm the browser cache for a photo the guest is likely to open next.
export function preloadImage({ image, image_meta: meta }, sizes = '100vw') {
  const img = new Image()
  if (meta?.srcset) {
    img.sizes = sizes
    img.srcset = meta.srcset
  }
  img.src = meta?.fallback || image
}
