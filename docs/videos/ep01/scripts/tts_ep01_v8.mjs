// 8차 해설 음성 (Gemini TTS, Charon) → work/voice/v8_<id>.pcm
// node --env-file=.env.local docs/videos/ep01/scripts/tts_ep01_v8.mjs
import fs from 'node:fs'
import path from 'node:path'
const OUT = path.join(path.dirname(new URL(import.meta.url).pathname), '../work/voice')
const key = process.env.GEMINI_API_KEY
const lines = {
  hook: '여러분, 수십만 대군이요. 단 한 번의 불길에 무너집니다. 그런데 이 불이, 천하를 셋으로 나눴다는 거, 아세요?',
  map: '때는 208년. 지도 좀 보세요. 북쪽은 전부 조조 땅이에요. 남은 건 형주와 강동, 그리고 땅 한 뼘 없는 유비뿐이었죠. 마침 형주의 주인 유표가 세상을 떠납니다. 조조는 이때다 하고, 대군을 몰아 남쪽으로 내려오죠.',
  yz: '그런데요, 그 한 해 전. 제갈량은 유비에게 이런 그림을 보여 줬어요. 형주와 익주를 얻고, 손권과 손잡아 조조와 맞서십시오. 천하를, 셋으로 나누자는 거였죠.',
  chain: '연의에서는 이때 방통이 찾아와, 배를 쇠사슬로 꽁꽁 묶으라고 권합니다. 흔들림은 확 줄었죠. 그런데요, 이게 함정이었어요.',
  wind: '그런데 또 문제가 생깁니다. 겨울 장강엔 북서풍이 불어요. 불을 놓으면, 오히려 우리 쪽이 탑니다. 연의에서는 주유가, 걱정 끝에 쓰러지죠.',
  altar: '연의에서는 제갈량이 제단을 쌓고, 바람을 부릅니다. 실제 기록에도, 그날 동남풍이 거셌다고 나와요.',
  ram: '황개는 항복하는 척 다가가, 불붙인 배로 그대로 들이받죠!',
  end3: '이것이 바로 적벽대전입니다! 조조는 북쪽으로 물러나고, 유비는 형주를 얻죠. 그리고 결국, 제갈량이 그린 그림대로, 천하는 위, 촉, 오, 셋으로 나뉩니다.',
  cta: '여러분은 조조일까요, 제갈량일까요? 얼굴 사진 한 장으로 확인해 보세요!',
}
const models = (process.env.TTS_MODELS || 'gemini-2.5-flash-preview-tts,gemini-3.8-flash-tts').split(',')
fs.mkdirSync(OUT, { recursive: true })
for (const [id, text] of Object.entries(lines)) {
  const out = `${OUT}/v8_${id}.pcm`
  if (fs.existsSync(out)) continue
  let ok = false
  for (const model of models) {
    const prompt = model.includes('2.5')
      ? `인기 역사 강사가 무대에서 이야기를 들려주듯, 따뜻하고 신뢰감 있게, 생동감 있게 읽어 줘. 듣는 사람에게 말을 걸고, 쉼표에서 잠깐 멈추고, 느낌표에서는 힘을 줘: ${text}`
      : `[warm storytelling] ${text}`
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } } } },
    }
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
    })
    const d = await r.json()
    if (d.error) { console.log('ERR', id, model, d.error.status, d.error.message.slice(0, 120)); continue }
    fs.writeFileSync(out, Buffer.from(d.candidates[0].content.parts[0].inlineData.data, 'base64'))
    console.log('voice', id, model)
    ok = true
    break
  }
  if (!ok) process.exit(3)
  await new Promise((r) => setTimeout(r, 25000))
}
