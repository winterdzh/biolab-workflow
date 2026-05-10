// scripts/fetch-product-info.mjs
// Fetches og:image from each device/reagent's `website` field,
// downloads the image to public/device-images/, and writes `imageUrl` back to JSON.
//
// Usage:
//   node scripts/fetch-product-info.mjs              # process devices + reagents
//   node scripts/fetch-product-info.mjs --devices    # only devices
//   node scripts/fetch-product-info.mjs --reagents   # only reagents
//   node scripts/fetch-product-info.mjs --force      # overwrite existing imageUrls
//
// Requirements: Node 18+ (built-in fetch). No extra npm packages needed.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname, extname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT      = join(__dirname, '..')
const IMG_DIR   = join(ROOT, 'public', 'device-images')

if (!existsSync(IMG_DIR)) mkdirSync(IMG_DIR, { recursive: true })

const args  = process.argv.slice(2)
const FORCE = args.includes('--force')
const ONLY_DEVICES  = args.includes('--devices')
const ONLY_REAGENTS = args.includes('--reagents')
const RUN_DEVICES   = !ONLY_REAGENTS
const RUN_REAGENTS  = !ONLY_DEVICES

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ── Extract og:image from HTML ─────────────────────────────────────────────
function extractOgImage(html, baseUrl) {
  // Try both attribute orders for <meta property="og:image" content="...">
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["']og:image["'][^>]+content=["']([^"']+)["']/i,
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m?.[1]) {
      // Resolve relative URLs
      try { return new URL(m[1], baseUrl).href } catch { return m[1] }
    }
  }
  return null
}

// ── Fetch a URL, following redirects, with timeout ────────────────────────
async function fetchText(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, 'Accept': 'text/html,*/*' },
    redirect: 'follow',
    signal: AbortSignal.timeout(12000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return { text: await res.text(), finalUrl: res.url }
}

// ── Download binary to file ────────────────────────────────────────────────
async function downloadBinary(url, destPath) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA },
    redirect: 'follow',
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  writeFileSync(destPath, Buffer.from(await res.arrayBuffer()))
}

// ── Guess file extension from URL or Content-Type ─────────────────────────
function guessExt(imgUrl) {
  const m = imgUrl.match(/\.(png|jpe?g|webp|gif|svg)(\?|$)/i)
  if (m) return '.' + m[1].toLowerCase().replace('jpeg', 'jpg')
  return '.jpg'
}

// ── Process one JSON file ─────────────────────────────────────────────────
async function processFile(jsonPath, label) {
  console.log(`\n${'─'.repeat(55)}`)
  console.log(`Processing ${label}: ${jsonPath}`)
  console.log('─'.repeat(55))

  const items = JSON.parse(readFileSync(jsonPath, 'utf8'))
  let changed = false

  for (const item of items) {
    if (!item.website) continue
    if (!FORCE && item.imageUrl) {
      console.log(`  [${item.id}] ${item.name} — skip (already has imageUrl)`)
      continue
    }

    process.stdout.write(`  [${item.id}] ${item.name} — fetching page… `)

    let ogImg = null
    try {
      const { text, finalUrl } = await fetchText(item.website)
      ogImg = extractOgImage(text, finalUrl)
    } catch (err) {
      console.log(`✗ page fetch failed: ${err.message}`)
      await sleep(1000)
      continue
    }

    if (!ogImg) {
      console.log('✗ no og:image found')
      await sleep(800)
      continue
    }

    const ext      = guessExt(ogImg)
    const filename = `${item.id}${ext}`
    const destPath = join(IMG_DIR, filename)

    process.stdout.write(`→ downloading image… `)
    try {
      await downloadBinary(ogImg, destPath)
      item.imageUrl = `/device-images/${filename}`
      changed = true
      console.log(`✓  saved as ${filename}`)
    } catch (err) {
      console.log(`✗ download failed: ${err.message}`)
    }

    await sleep(1800) // polite delay
  }

  if (changed) {
    writeFileSync(jsonPath, JSON.stringify(items, null, 2))
    console.log(`\nWrote updated ${label} JSON.`)
  } else {
    console.log(`\nNo changes needed.`)
  }
}

// ── Main ──────────────────────────────────────────────────────────────────
const devicesPath  = join(ROOT, 'src/data/defaultLibraries/devices.json')
const reagentsPath = join(ROOT, 'src/data/defaultLibraries/reagents.json')

if (RUN_DEVICES)  await processFile(devicesPath,  'devices')
if (RUN_REAGENTS) await processFile(reagentsPath, 'reagents')

console.log('\n✅  Done.')
console.log('Tip: after downloading images, restart the dev server (npm run dev).')
