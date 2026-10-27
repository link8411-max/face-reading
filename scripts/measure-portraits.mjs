// 삼국지 초상화 얼굴 특징 측정 → src/lib/samguk/portraitFeatures.json
// 1) 개발 서버: npx next dev -p 3311
// 2) node scripts/measure-portraits.mjs
// 초상화를 바꾸거나 장수를 추가하면 다시 돌리고, calibrate-samguk.ts로 bias를 다시 만든다.
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'

const b = await chromium.launch()
const p = await b.newPage()
await p.goto('http://localhost:3311/dev/face-lab')
await p.waitForFunction(() => window.__lab, null, { timeout: 600000, polling: 2000 })
const rows = await p.evaluate(() => window.__lab.filter((r) => r.expectedId))
await b.close()

const r4 = (v) => Math.round(v * 10000) / 10000
const out = Object.fromEntries(
  rows
    .sort((a, b) => a.expectedId.localeCompare(b.expectedId))
    .map((r) => [r.expectedId, r.detected ? Object.fromEntries(Object.entries(r.features).map(([k, v]) => [k, r4(v)])) : null]),
)
writeFileSync('src/lib/samguk/portraitFeatures.json', JSON.stringify(out, null, 2) + '\n')
const missing = Object.entries(out).filter(([, v]) => !v).map(([k]) => k)
console.log(`초상화 ${rows.length}장, 얼굴 인식 실패 ${missing.length}장: ${missing.join(', ')}`)
