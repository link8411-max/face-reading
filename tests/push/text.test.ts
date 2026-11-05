import { buildPayload } from '@/lib/push/text'
import { dailyFortune } from '@/lib/dailyEngine'
import { 육십갑자 } from '@/lib/dailyEngine/relations'
const D = new Date('2026-11-05T03:00:00+09:00')
test('제목·본문·url 형식', () => {
  const p = buildPayload(dailyFortune({ kind: '년주', 천간: '경', 지지: '오' }, D))
  expect(p.title).toBe('🐎 경오년 말띠 오늘 운세 ★★★★☆')
  expect(p.body).toBe('말이 예쁘게 나가는 날이에요. 고백도, 제안도 오늘이에요.\n행운 시간 오후 1~3시(미시)')
  expect(p.url).toBe('/fortune/daily?gz=%EA%B2%BD%EC%98%A4&utm_source=push&utm_medium=web_push&utm_campaign=daily')
  expect(p.tag).toBe('daily-fortune')
})
test('60갑자 전수: 빈 값·undefined 없음, 제목 60자 이내', () => {
  for (const g of 육십갑자) { const p = buildPayload(dailyFortune({ kind: '년주', ...g }, D)); expect(JSON.stringify(p)).not.toContain('undefined'); expect(p.title.length).toBeLessThanOrEqual(60); expect(p.body.length).toBeGreaterThan(10) }
})
