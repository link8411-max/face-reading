import { readFileSync } from 'node:fs'
import { metadata as hubMeta } from '@/app/fortune/2027/page'
import { generateMetadata } from '@/app/fortune/2027/[zodiac]/page'
import { zodiac2027, ZODIAC_SLUGS } from '@/content/fortune2027Zodiac'
import { 띠이모지, 월주계산 } from '@/lib/saju'
import { computeFortune } from '@/lib/fortuneService'

test('홈 FAQ 한자는 丁未年', () => {
  const home = readFileSync('src/app/page.tsx', 'utf8')
  expect(home).not.toContain('丙午')
  expect(home).toContain('丁未年')
})

test('허브와 띠 페이지 OG가 자기 주소·이미지를 가진다', async () => {
  expect(hubMeta.openGraph?.url).toBe('https://unse-ai.com/fortune/2027')
  expect(hubMeta.openGraph?.images).toBeDefined()
  const m = await generateMetadata({ params: Promise.resolve({ zodiac: 'sheep' }) })
  expect(m.openGraph?.images).toBeDefined()
})

test('/fortune 메타 설명이 음력 지원과 맞다', () => {
  expect(readFileSync('src/app/fortune/layout.tsx', 'utf8')).not.toContain('양력 생년월일로')
})

test('분기 문구에 다른 분기의 달이 나오지 않는다', () => {
  const quarterOf = (m: number) => Math.ceil(m / 3)
  for (const s of ZODIAC_SLUGS) zodiac2027[s].분기.forEach((text, i) => {
    for (const mm of text.matchAll(/(\d{1,2})월/g)) expect(quarterOf(Number(mm[1])), `${s} ${i + 1}분기: ${text}`).toBe(i + 1)
  })
})

test('양띠 이모지 통일 🐑', () => {
  expect(띠이모지[7]).toBe('🐑')
})

test('월주 경계: 1/6~2/3 축월(전년 간), 12/7 이후 자월', () => {
  const p = (y: number, m: number, d: number) => { const r = 월주계산(y, m, d); return r.천간 + r.지지 }
  expect(p(2027, 1, 10)).toBe('신축')
  expect(p(2023, 12, 10)).toBe('갑자')
  expect(p(2027, 2, 4)).toBe('임인')
})

test('API: 잘못된 양력 날짜·형식은 친절한 오류, 음력 미래 날짜도 막는다', () => {
  expect(computeFortune({ year: 2001, month: 2, day: 30, isLunar: false, isLeapMonth: false, hour: '모름' })).toEqual({ error: '올바른 생년월일을 입력해 주세요.' })
  expect(computeFortune({ year: '2001' as unknown as number, month: 2, day: 3, isLunar: false, isLeapMonth: false, hour: '모름' })).toEqual({ error: '올바른 생년월일을 입력해 주세요.' })
  expect(computeFortune({ year: 2026, month: 12, day: 30, isLunar: true, isLeapMonth: false, hour: '모름' }, new Date(2026, 9, 26))).toEqual({ error: '아직 오지 않은 날짜예요.' })
})

test('다시하기는 윤달 체크도 초기화한다', () => {
  const src = readFileSync('src/app/fortune/FortuneClient.tsx', 'utf8')
  const reset = src.slice(src.indexOf('const resetAll'), src.indexOf('};', src.indexOf('const resetAll')))
  expect(reset).toContain('setIsLeapMonth(false)')
})
