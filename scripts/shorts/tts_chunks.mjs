// 긴 영상 해설 TTS: 한 번에 너무 길면 응답이 비어 오므로(긴 영상 1편에서 확인) 박자 4~5개씩 묶어 몇 번에 나눠 만든다.
// 묶음마다 work/voice/chunk_N.pcm + chunk_N.json(묶인 박자 id). 나누기는 split_chunks.py가 쉼 위치로 한다.
//   node --env-file=.env.local scripts/shorts/tts_chunks.mjs docs/videos/long01-samgo [묶음 크기=5]
import fs from 'node:fs';
import path from 'node:path';
const ep = process.argv[2]; const size = +(process.argv[3] || 5);
const spec = JSON.parse(fs.readFileSync(path.join(ep, 'episode.json'), 'utf8'));
const V = path.join(ep, 'work/voice'); fs.mkdirSync(V, {recursive: true});
const items = [...spec.beats.map((b) => ({id: b.id, text: b.narration})), {id: 'end', text: spec.end.narration}];
const model = process.env.TTS_MODEL || 'gemini-3.1-flash-tts-preview';
for (let c = 0; c * size < items.length; c++) {
  const group = items.slice(c * size, (c + 1) * size);
  const out = path.join(V, `chunk_${c}.pcm`);
  if (fs.existsSync(out)) { console.log('있음', out); continue; }
  const text = '[warm storytelling] ' + group.map((x) => x.text).join('\n\n...\n\n');
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST', headers: {'content-type': 'application/json'},
    body: JSON.stringify({contents: [{parts: [{text}]}], generationConfig: {responseModalities: ['AUDIO'], speechConfig: {voiceConfig: {prebuiltVoiceConfig: {voiceName: spec.voice || 'Charon'}}}}}),
  });
  const d = await r.json();
  const part = d.candidates?.[0]?.content?.parts?.[0];
  if (!part) { console.log('실패', c, JSON.stringify(d).slice(0, 300)); process.exit(1); }
  fs.writeFileSync(out, Buffer.from(part.inlineData.data, 'base64'));
  fs.writeFileSync(path.join(V, `chunk_${c}.json`), JSON.stringify(group.map((x) => x.id)));
  console.log('묶음', c, group.map((x) => x.id).join(','), (fs.statSync(out).size / 48000).toFixed(1) + '초');
}
