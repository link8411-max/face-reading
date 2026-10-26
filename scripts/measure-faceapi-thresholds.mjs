// 관상(face-api 68점) 구간 경계 측정: 정면 성인 dev 얼굴의 원시 측정값을 모아 특징마다 1/3·2/3 지점을 경계로 쓴다.
// 1) npx next dev -p 3311   2) node scripts/measure-faceapi-thresholds.mjs [--write]
//    저장된 측정값으로만 경계를 다시 계산: node scripts/measure-faceapi-thresholds.mjs --from-fixture --write
// --write 없이 실행하면 측정값 fixture만 갱신(tests/face/fixtures/faceapi-metrics.json)하고 경계는 출력만 한다.
import { readFileSync, writeFileSync } from 'node:fs'

let rows
if (process.argv.includes('--from-fixture')) rows = JSON.parse(readFileSync('tests/face/fixtures/faceapi-metrics.json'))
else {
  const { chromium } = await import('@playwright/test')
  const labels = JSON.parse(readFileSync(new URL('./dev-face-genders.json', import.meta.url)))
  const adults = new Set([...labels['여'], ...labels['남']].map((i) => `/dev-faces/person${i}.jpg`))
  const b = await chromium.launch(); const p = await b.newPage()
  await p.goto('http://localhost:3311/dev/face-lab')
  await p.waitForFunction(() => window.__lab && window.__faceapi, null, { timeout: 600000, polling: 1000 })
  const { lab, fa } = await p.evaluate(() => ({ lab: window.__lab, fa: window.__faceapi }))
  await b.close()
  const frontal = new Set(lab.filter((r) => r.src.includes('dev-faces') && r.frontal?.ok).map((r) => r.src))
  rows = fa.filter((r) => r.metrics && adults.has(r.src) && frontal.has(r.src)).map((r) => ({ src: r.src, metrics: r.metrics }))
  writeFileSync('tests/face/fixtures/faceapi-metrics.json', JSON.stringify(rows, null, 1) + '\n')
}

const q = (a, p) => { const s = [...a].sort((x, y) => x - y); const i = (s.length - 1) * p, lo = Math.floor(i); return s[lo] + (s[Math.ceil(i)] - s[lo]) * (i - lo) }
const r4 = (v) => Math.round(v * 10000) / 10000
const out = {}
for (const k of Object.keys(rows[0].metrics).filter((k) => k !== 'symmetry')) {
  const v = rows.map((r) => r.metrics[k])
  out[k] = [r4(q(v, 1 / 3)), r4(q(v, 2 / 3))]
}
// 얼굴형 long/round는 양 끝 20%만
const fr = rows.map((r) => r.metrics.faceRatio)
out.faceRatio = [r4(q(fr, 0.2)), r4(q(fr, 0.8))]
console.log(`표본 ${rows.length}장`)
console.log(JSON.stringify(out))
if (process.argv.includes('--write')) writeFileSync('src/lib/face/faceApiThresholds.json', JSON.stringify(out, null, 2) + '\n')
