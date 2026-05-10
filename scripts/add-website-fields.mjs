// scripts/add-website-fields.mjs
// Adds `website` and `imageUrl` fields to devices.json and reagents.json
// Run: node scripts/add-website-fields.mjs

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// ── Known product page URLs for each device ───────────────────────────────
const DEVICE_WEBSITES = {
  d1:  'https://www.beckmancoulter.com/en/products/liquid-handling/automated-liquid-handlers/biomek-i-series-automated-workstations',
  d2:  'https://www.hamiltoncompany.com/automated-liquid-handling/platforms/microlab-star-liquid-handling-workstation',
  d3:  'https://www.eppendorf.com/global/en/products/centrifugation/centrifuges/eppendorf-centrifuge-5810-r/',
  d4:  'https://www.agilent.com/en/product/microplate-instrumentation/microplate-readers/synergy-h1-hybrid-multi-mode-reader-228126',
  d5:  'https://www.azenta.com/products/shasta-synthesizer',
  d6:  'https://www.bluecatbio.com/bluewasher/',
  d7:  '',
  d8:  'https://www.agilent.com/en/product/cell-analysis/cell-imaging-systems/cytation-5-cell-imaging-multi-mode-reader-228099',
  d9:  'https://www.agilent.com/en/product/cell-analysis/cell-imaging-systems/cytation-9-cell-imaging-multi-mode-reader',
  d10: 'https://www.thermofisher.com/us/en/home/life-science/lab-equipment/automated-cell-culture-systems/cytomat-automated-incubators-plate-hotels.html',
  d11: 'https://www.thermofisher.com/us/en/home/life-science/lab-equipment/automated-cell-culture-systems/cytomat-automated-incubators-plate-hotels.html',
  d12: 'https://www.thermofisher.com/us/en/home/life-science/lab-equipment/automated-cell-culture-systems/cytomat-automated-incubators-plate-hotels.html',
  d13: '',
  d14: '',
  d15: '',
  d16: 'https://www.tecan.com/fluent-automated-workstation',
  d17: 'https://www.tecan.com/fluent-automated-workstation',
  d18: '',
  d19: 'https://www.azenta.com/products/automated-plate-sealer-peeler',
  d20: 'https://www.unchainedlabs.com/lunatic/',
  d21: 'https://www.thermofisher.com/us/en/home/life-science/pcr/real-time-pcr/real-time-pcr-instruments/quantstudio-3-5-real-time-pcr-system.html',
}

// ── Known product page URLs for reagents ──────────────────────────────────
const REAGENT_WEBSITES = {
  r1:  'https://www.thermofisher.com/order/catalog/product/10010023',
  r2b: 'https://www.thermofisher.com/order/catalog/product/14025092',
  r2c: 'https://www.thermofisher.com/order/catalog/product/15630080',
  r2:  'https://www.thermofisher.com/order/catalog/product/11965092',
  r2a: 'https://www.thermofisher.com/order/catalog/product/11875093',
  r2d: 'https://www.thermofisher.com/order/catalog/product/10270106',
  r3:  'https://www.thermofisher.com/order/catalog/product/L3000001',
  r3a: 'https://www.thermofisher.com/order/catalog/product/31985070',
  r4:  'https://www.bio-rad.com/en-us/sku/1725121',
  r4a: 'https://www.neb.com/en-us/products/m3003-luna-universal-qpcr-master-mix',
}

// ── Patch devices.json ────────────────────────────────────────────────────
const devicesPath = join(ROOT, 'src/data/defaultLibraries/devices.json')
const devices = JSON.parse(readFileSync(devicesPath, 'utf8'))
const updatedDevices = devices.map((d) => ({
  ...d,
  website:  d.website  !== undefined ? d.website  : (DEVICE_WEBSITES[d.id] ?? ''),
  imageUrl: d.imageUrl !== undefined ? d.imageUrl : '',
}))
writeFileSync(devicesPath, JSON.stringify(updatedDevices, null, 2))
console.log(`✓ devices.json  — ${updatedDevices.length} entries patched`)

// ── Patch reagents.json ───────────────────────────────────────────────────
const reagentsPath = join(ROOT, 'src/data/defaultLibraries/reagents.json')
const reagents = JSON.parse(readFileSync(reagentsPath, 'utf8'))
const updatedReagents = reagents.map((r) => ({
  ...r,
  website: r.website !== undefined ? r.website : (REAGENT_WEBSITES[r.id] ?? ''),
}))
writeFileSync(reagentsPath, JSON.stringify(updatedReagents, null, 2))
console.log(`✓ reagents.json — ${updatedReagents.length} entries patched`)

console.log('\nNext: node scripts/fetch-product-info.mjs  (to download og:image for each entry with a website)')
