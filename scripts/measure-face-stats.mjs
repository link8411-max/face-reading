// 성별별 얼굴 기준값(FEATURE_STATS_BY_GENDER) 측정
// 1) 개발 서버를 띄운다: npx next dev -p 3311
// 2) node scripts/measure-face-stats.mjs            (face-lab에서 특징값을 읽음)
//    node scripts/measure-face-stats.mjs rows.json  (이미 뽑아 둔 특징값 파일 사용)
// 출력된 객체를 src/lib/face/featureStats.ts에 붙여 넣고, calibrate-samguk·calibrate-animal을 다시 돌린다.
import { readFileSync } from 'node:fs'

const labels = JSON.parse(readFileSync(new URL('./dev-face-genders.json', import.meta.url)))
let rows
if (process.argv[2]) rows = JSON.parse(readFileSync(process.argv[2]))
else {
  const { chromium } = await import('@playwright/test')
  const b = await chromium.launch(); const p = await b.newPage()
  await p.goto('http://localhost:3311/dev/face-lab')
  await p.waitForFunction(() => window.__lab, null, { timeout: 300000, polling: 1000 })
  rows = await p.evaluate(() => window.__lab.filter((r) => r.src.includes('dev-faces') && r.detected))
  await b.close()
}

const pick = (ids) => ids.map((i) => rows.find((r) => r.src.endsWith(`/person${i}.jpg`))?.features).filter(Boolean)
const F = pick(labels['여']), M = pick(labels['남'])
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length
const variance = (a) => { const u = mean(a); return a.reduce((s, x) => s + (x - u) ** 2, 0) / (a.length - 1) }
const r4 = (v) => Math.round(v * 10000) / 10000

const out = { 여: {}, 남: {} }, notes = []
for (const k of Object.keys(F[0])) {
  const a = F.map((x) => x[k]), b = M.map((x) => x[k])
  const sp = Math.sqrt(((a.length - 1) * variance(a) + (b.length - 1) * variance(b)) / (a.length + b.length - 2))
  const t = (mean(a) - mean(b)) / (sp * Math.sqrt(1 / a.length + 1 / b.length))
  const w = t * t / (1 + t * t) // 차이가 뚜렷할수록 성별 평균을 그대로, 애매하면 공통 평균 쪽으로
  const pooled = mean([...a, ...b])
  out['여'][k] = { mean: r4(pooled + w * (mean(a) - pooled)), std: r4(sp) }
  out['남'][k] = { mean: r4(pooled + w * (mean(b) - pooled)), std: r4(sp) }
  notes.push(`${k}: t=${t.toFixed(2)} w=${w.toFixed(2)}`)
}
console.log(`// 표본 여 ${F.length}장, 남 ${M.length}장\n// ${notes.join('\n// ')}`)
console.log(JSON.stringify(out, null, 2))
