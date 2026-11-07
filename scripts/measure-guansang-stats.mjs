// 관상 특징 성별 기준값(GUANSANG_STATS_BY_GENDER) 측정. 1) npx next dev -p 3311  2) node scripts/measure-guansang-stats.mjs [rows.json]
// 출력된 객체를 src/lib/face/guansangStats.ts에 붙여 넣고, zoneUp 최소·최대로 guansangFeatures.ts의 ZONE_UP_RANGE를 갱신한다.
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

// 실제 앱은 정면이 아닌 사진(checkFrontal)을 분석하지 않으므로, 기준값도 정면 사진으로만 잰다
const pick = (ids) => ids.map((i) => rows.find((r) => r.src.endsWith(`/person${i}.jpg`))).filter((r) => r?.frontal?.ok).map((r) => r.guansang)
const F = pick(labels['여']), M = pick(labels['남'])
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length
const variance = (a) => { const u = mean(a); return a.reduce((s, x) => s + (x - u) ** 2, 0) / (a.length - 1) }
const r4 = (v) => Math.round(v * 10000) / 10000

const out = { 여: {}, 남: {} }, notes = []
for (const k of Object.keys(F[0])) {
  const a = F.map((x) => x[k]), b = M.map((x) => x[k])
  const sp = Math.sqrt(((a.length - 1) * variance(a) + (b.length - 1) * variance(b)) / (a.length + b.length - 2))
  const t = (mean(a) - mean(b)) / (sp * Math.sqrt(1 / a.length + 1 / b.length))
  // 차이가 뚜렷할수록 성별 평균을 그대로, 애매하면 두 성별 평균의 한가운데 쪽으로 당긴다.
  // w = t²/(1+t²)는 경험적 규칙이다(James-Stein·경험적 베이즈가 아님). 표본 수로 가중한 평균을 쓰면 많은 쪽 성별로 기운다.
  const w = t * t / (1 + t * t)
  const pooled = (mean(a) + mean(b)) / 2
  out['여'][k] = { mean: r4(pooled + w * (mean(a) - pooled)), std: r4(sp) }
  out['남'][k] = { mean: r4(pooled + w * (mean(b) - pooled)), std: r4(sp) }
  notes.push(`${k}: t=${t.toFixed(2)} w=${w.toFixed(2)}`)
}
console.log(`// 표본 여 ${F.length}장, 남 ${M.length}장\n// ${notes.join('\n// ')}`)
console.log(JSON.stringify(out, null, 2))
const zu = [...F, ...M].map((x) => x.zoneUp)
console.log(`// zoneUp 관측 min ${Math.min(...zu).toFixed(4)} max ${Math.max(...zu).toFixed(4)} (n=${zu.length})`)
