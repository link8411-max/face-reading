// 단어 시간 맞추기(whisper 대신): TTS는 문장부호마다 쉬므로, 실제 쉼(무음) 위치로 문구 경계를 잡고
// 문구 안에서는 말하는 시간(무음 제외)에 글자 수 비율로 단어를 나눈다. → public/<ep>/timing.json
//   node scripts/shorts/remotion/align.mjs docs/videos/ep03
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {execFileSync} from 'node:child_process';
const EP = path.resolve(process.argv[2]);
const spec = JSON.parse(fs.readFileSync(path.join(EP, 'episode.json'), 'utf8'));
const FF = process.env.FF || path.join(os.homedir(), '.cache/shorts-tools/node_modules/ffmpeg-static/ffmpeg');
const OUT = path.join(path.dirname(new URL(import.meta.url).pathname), 'public', path.basename(EP));
fs.mkdirSync(OUT, {recursive: true});
const letters = (t) => t.replace(/[^가-힣0-9A-Za-z]/g, '').length;
import {spawnSync} from 'node:child_process';
const sh = (f, af) => spawnSync(FF, ['-hide_banner', '-i', f, '-af', af, '-f', 'null', '-'], {encoding: 'utf8'}).stderr;
function speech(f) {
  const o = sh(f, 'silencedetect=n=-38dB:d=0.15');
  const dur = (() => { const [, h, m, s] = o.match(/Duration: (\d+):(\d+):([\d.]+)/); return +h * 3600 + +m * 60 + +s; })();
  const st = [...o.matchAll(/silence_start: ([\d.]+)/g)].map((m) => +m[1]);
  const en = [...o.matchAll(/silence_end: ([\d.]+)/g)].map((m) => +m[1]);
  const segs = []; let cur = 0;
  st.forEach((s, i) => { if (s > cur + 0.05) segs.push([cur, s]); cur = en[i] ?? dur; });
  if (dur > cur + 0.05) segs.push([cur, dur]);
  return {dur, segs};
}
const result = {};
const items = [...(spec.beats ?? spec.scenes).map((s) => ({id: s.id, text: s.narration})), {id: 'end', text: spec.end.narration}];
for (const it of items) {
  const src = path.join(EP, 'work/voice', `nar_${it.id}.wav`);
  fs.copyFileSync(src, path.join(OUT, `nar_${it.id}.wav`));
  const {dur, segs} = speech(src);
  // 문구: 문장부호에서 끊는다
  const words = it.text.split(/\s+/).filter(Boolean);
  const phrases = []; let cur = [];
  for (const w of words) { cur.push(w); if (/[,.?!]$/.test(w)) { phrases.push(cur); cur = []; } }
  if (cur.length) phrases.push(cur);
  // 문구 경계 고르기: 말소리 시간(쉼 제외) 누적을 글자 수 비율과 맞춰, 가장 가까운 쉼을 경계로 삼는다
  const speechLen = segs.map(([a, b]) => b - a);
  const cum = []; let acc0 = 0; for (const l of speechLen) { acc0 += l; cum.push(acc0); }
  const totalSpeech = acc0 || dur;
  const totChars = words.reduce((x, w) => x + letters(w), 0) || 1;
  const bounds = []; // 각 문구의 [시작, 끝] (절대 시간)
  let segIdx = 0, charAcc = 0;
  for (let i = 0; i < phrases.length; i++) {
    charAcc += phrases[i].reduce((x, w) => x + letters(w), 0);
    const a = segs[segIdx]?.[0] ?? 0;
    if (i === phrases.length - 1) { bounds.push([a, segs.at(-1)?.[1] ?? dur]); break; }
    const target = totalSpeech * charAcc / totChars;
    let best = segIdx, bestD = 1e9;
    for (let k = segIdx; k < segs.length - (phrases.length - 1 - i); k++) { const d = Math.abs(cum[k] - target); if (d < bestD) { bestD = d; best = k; } }
    bounds.push([a, segs[best][1]]);
    segIdx = best + 1;
  }
  const timed = [];
  const place = (ws, [a, b]) => { const tot = ws.reduce((x, w) => x + letters(w), 0) || 1; let acc = 0;
    for (const w of ws) { const s = a + (b - a) * acc / tot; acc += letters(w); timed.push({text: w, start: +s.toFixed(3), end: +(a + (b - a) * acc / tot).toFixed(3)}); } };
  phrases.forEach((p, i) => place(p, bounds[i]));
  const groups = true;
  result[it.id] = {duration: +dur.toFixed(3), words: timed};
  console.log(it.id, `문구 ${phrases.length}/쉼 ${segs.length - 1}`, timed.filter((w) => /[,.?!]$/.test(w.text)).map((w) => `${w.text}@${w.end}`).join(' '));
}
fs.writeFileSync(path.join(OUT, 'timing.json'), JSON.stringify(result, null, 1));
