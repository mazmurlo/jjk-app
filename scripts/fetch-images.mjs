import { mkdir, writeFile } from 'node:fs/promises'

const OUT = new URL('../src/assets/characters', import.meta.url).pathname
const UA = 'jjk-fan-app/1.0 (personal fan project)'
const API = 'https://jujutsu-kaisen.fandom.com/api.php'

const TITLES = {
  gojo: 'Satoru Gojo',
  yuji: 'Yuji Itadori',
  megumi: 'Megumi Fushiguro',
  nobara: 'Nobara Kugisaki',
  nanami: 'Kento Nanami',
  sukuna: 'Sukuna',
  mahito: 'Mahito',
  maki: 'Maki Zenin',
  toge: 'Toge Inumaki',
  panda: 'Panda',
  geto: 'Suguru Geto',
  todo: 'Aoi Todo',
  jogo: 'Jogo',
  hanami: 'Hanami',
  // Generic curses — any curse art reads fine for these mooks.
  grade3: 'Eso',
  grade3b: 'Kechizu',
  finger: 'Finger Bearer',
}

await mkdir(OUT, { recursive: true })

const results = []
for (const [key, title] of Object.entries(TITLES)) {
  try {
    const url = `${API}?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&pithumbsize=600&format=json`
    const res = await fetch(url, { headers: { 'User-Agent': UA } })
    const json = await res.json()
    const page = Object.values(json.query.pages)[0]
    if (!page?.thumbnail?.source) {
      results.push([key, 'NO IMAGE', title])
      continue
    }
    // Ask the CDN for a consistent width rather than whatever the API picked.
    const src = page.thumbnail.source.replace(/\/scale-to-width-down\/\d+/, '/scale-to-width-down/420')
    const img = await fetch(src, { headers: { 'User-Agent': UA } })
    if (!img.ok) {
      results.push([key, `HTTP ${img.status}`, title])
      continue
    }
    const type = img.headers.get('content-type') || ''
    const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg'
    const buf = Buffer.from(await img.arrayBuffer())
    await writeFile(`${OUT}/${key}.${ext}`, buf)
    results.push([key, `${ext} ${(buf.length / 1024).toFixed(0)}KB`, page.pageimage])
  } catch (e) {
    results.push([key, `ERROR ${e.message}`, title])
  }
}

for (const [k, status, note] of results) console.log(`${k.padEnd(9)} ${status.padEnd(14)} ${note}`)
const ok = results.filter((r) => !/NO IMAGE|ERROR|HTTP/.test(r[1])).length
console.log(`\n${ok}/${results.length} downloaded`)
