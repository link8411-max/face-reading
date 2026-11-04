// 쇼츠 해설 음성: 장면 해설 전체를 TTS 한 번으로 만들고, 장면 사이 쉼으로 잘라 nar_<id>.wav로 나눈다.
// 끝 잡음 자르기·속도(1.1배)·받아쓰기 검사까지 한다. 무료 한도가 모델당 하루 10회라 한 편에 1~2회만 쓴다.
//   node --env-file=.env.local scripts/shorts/tts.mjs docs/videos/ep02
//   TTS_MODELS=a,b (기본: 3.1 → 3.8-lite → 2.5 → 3.8) / ONLY=s03 (그 장면만 따로 다시)
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { FF } from './ff.mjs'

const ep = process.argv[2]
const spec = JSON.parse(fs.readFileSync(path.join(ep, 'episode.json'), 'utf8'))
const V = path.join(ep, 'work/voice')
fs.mkdirSync(V, { recursive: true })
const key = process.env.GEMINI_API_KEY
const models = (process.env.TTS_MODELS || 'gemini-3.1-flash-tts-preview,gemini-3.8-flash-lite-tts,gemini-2.5-flash-preview-tts,gemini-3.8-flash-tts').split(',')
const voice = spec.voice || 'Charon'
const items = [...spec.scenes.map((s) => ({ id: s.id, text: s.narration })), { id: 'end', text: spec.end.narration }]
  .filter((x) => x.text)

async function tts(text) {
  for (const model of models) {
    // 2.5는 지시문을 따르고, 3.x는 지시문을 소리 내 읽으므로 대괄호 말투 표시만 쓴다
    const prompt = model.includes('2.5')
      ? `인기 역사 강사가 무대에서 이야기를 들려주듯, 따뜻하고 신뢰감 있게 읽어 줘. 문단 사이에서는 2초 쉬어: ${text}`
      : `[warm storytelling] ${text}`
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } } }),
    })
    const d = await r.json()
    if (d.error) { console.log('  건너뜀', model, d.error.status); continue }
    console.log('  모델', model)
    return Buffer.from(d.candidates[0].content.parts[0].inlineData.data, 'base64')
  }
  throw new Error('모든 TTS 모델 한도 초과')
}

const pcmDur = (f) => fs.statSync(f).size / 48000
function detect(pcm) {
  const r = silenceLog(pcm)
  const s = [...r.matchAll(/silence_start: ([\d.]+)/g)].map((m) => +m[1])
  const e = [...r.matchAll(/silence_end: ([\d.]+)/g)].map((m) => +m[1])
  return s.map((st, i) => ({ st, en: e[i] ?? pcmDur(pcm) })).filter((x) => x.st > 0.3 && x.en < pcmDur(pcm) - 0.3)
}
function silenceLog(pcm) {
  // ffmpeg는 결과를 stderr로 낸다
  const res = execFileSync('sh', ['-c', `"${FF}" -hide_banner -f s16le -ar 24000 -ac 1 -i "${pcm}" -af silencedetect=n=-40dB:d=0.45 -f null - 2>&1`], { encoding: 'utf8' })
  return res
}
// 끝에 붙는 0dB 잡음 덩어리를 찾아 그 앞에서 자른다
function tailNoiseEnd(pcm, st, en) {
  const res = execFileSync('sh', ['-c', `"${FF}" -hide_banner -f s16le -ar 24000 -ac 1 -i "${pcm}" -af "atrim=${st}:${en},asetnsamples=1200,astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.Peak_level" -f null - 2>&1`], { encoding: 'utf8' })
  const pk = [...res.matchAll(/Peak_level=([-0-9.inf]+)/g)].map((m) => (m[1].includes('inf') ? -200 : +m[1]))
  let j = pk.length - 1
  while (j >= 0 && pk[j] > -6) j--
  return j < pk.length - 1 && pk[j] < -45 ? st + (j + 1) * 0.05 : en
}
function cut(pcm, st, en, out) {
  en = tailNoiseEnd(pcm, st, en)
  execFileSync(FF, ['-y', '-loglevel', 'error', '-f', 's16le', '-ar', '24000', '-ac', '1', '-i', pcm, '-af',
    `atrim=${st}:${en},asetpts=PTS-STARTPTS,silenceremove=start_periods=1:start_threshold=-40dB,areverse,silenceremove=start_periods=1:start_threshold=-40dB,areverse,atempo=1.1,afade=t=in:d=0.04,areverse,afade=t=in:d=0.08,areverse`,
    '-ar', '44100', '-ac', '2', out])
}

async function transcribe(wav) {
  const b = fs.readFileSync(wav).toString('base64')
  for (let i = 0; i < 3; i++) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ inlineData: { mimeType: 'audio/wav', data: b } }, { text: '이 한국어 음성을 들리는 그대로 받아 적어 줘. 받아 적은 글만 출력.' }] }] }),
    })
    const d = await r.json()
    if (!d.error) return d.candidates[0].content.parts[0].text.trim()
    await new Promise((r) => setTimeout(r, 5000))
  }
  return '(받아쓰기 실패)'
}
const norm = (t) => t.replace(/[^가-힣0-9]/g, '')
function similarity(a, b) {
  a = norm(a); b = norm(b)
  const m = Array.from({ length: a.length + 1 }, (_, i) => [i])
  for (let j = 1; j <= b.length; j++) m[0][j] = j
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return 1 - m[a.length][b.length] / Math.max(a.length, b.length, 1)
}

const only = process.env.ONLY?.split(',')
let todo = items.filter((x) => !only || only.includes(x.id))
if (!only) {
  // 한 번 호출: 장면 사이를 빈 줄로 띄워 긴 쉼을 만든다
  const pcm = path.join(V, 'all.pcm')
  if (!fs.existsSync(pcm)) { console.log('TTS (전체 한 번)'); fs.writeFileSync(pcm, await tts(todo.map((x) => x.text).join('\n\n...\n\n'))) }
  const sil = detect(pcm).sort((a, b) => (b.en - b.st) - (a.en - a.st)).slice(0, todo.length - 1).sort((a, b) => a.st - b.st)
  if (sil.length === todo.length - 1) {
    const bounds = [0, ...sil.flatMap((s) => [s.st, s.en]), pcmDur(pcm)]
    todo.forEach((x, i) => cut(pcm, bounds[i * 2], bounds[i * 2 + 1], path.join(V, `nar_${x.id}.wav`)))
    console.log(`쉼 ${sil.length}곳으로 ${todo.length}개로 나눔`)
  } else {
    console.log(`쉼이 ${sil.length}곳뿐이라 나누지 못함 → 장면별로 따로 만든다`)
  }
}
for (const x of todo) {
  const wav = path.join(V, `nar_${x.id}.wav`)
  if (fs.existsSync(wav) && !only) continue
  console.log('TTS', x.id)
  const pcm = path.join(V, `${x.id}.pcm`)
  fs.writeFileSync(pcm, await tts(x.text))
  cut(pcm, 0, pcmDur(pcm), wav)
}
// 받아쓰기로 확인: 지시문을 읽었거나 나누기가 어긋나면 비슷한 정도가 낮게 나온다
let bad = 0
for (const x of items) {
  const wav = path.join(V, `nar_${x.id}.wav`)
  const heard = await transcribe(wav)
  const sim = similarity(x.text, heard)
  const flag = sim < 0.8 ? '확인 필요' : 'OK'
  if (sim < 0.8) bad++
  console.log(`${x.id} ${(pcmDur(wav) / 3.675).toFixed(1)}초 ${Math.round(sim * 100)}% ${flag} | ${heard}`)
}
if (bad) { console.log(`\n${bad}개 확인 필요: ONLY=<id>로 그 장면만 다시 만들 수 있어요`); process.exitCode = 2 }
