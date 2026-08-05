/* Portraits are bundled at build time, so each gets a hashed, cacheable URL.
 * Characters without a file (generic curses) fall back to their kanji glyph. */
const files = import.meta.glob('./*.webp', { eager: true, import: 'default' })

export const portraits = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [
    path.replace('./', '').replace('.webp', ''),
    url,
  ]),
)

export const portraitFor = (key) => portraits[key] ?? null
