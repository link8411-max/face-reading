import { readFileSync } from 'node:fs'
import { SEASON } from '@/content/season'
import { HOME_FAQS } from '@/content/homeFaq'

test('시즌 카드: 평소는 내 사주 풀이, 12~1월 신년운세 값은 주석으로 남아 있다', () => {
  expect(SEASON.cta.href).toBe('/saju')
  const src = readFileSync('src/content/season.ts', 'utf8')
  expect(src).toMatch(/\/\/\s+cta: \{ label: '지금 확인하기', href: '\/fortune' \}/)
})

test('홈 순서: 관상 히어로 → 시즌 카드 → 띠 → 친구랑 → 쿠팡 → 묶음 탭 → FAQ, 하단 띠 칩 목록 없음', () => {
  const src = readFileSync('src/app/page.tsx', 'utf8')
  const order = ['<FaceHero', '<SeasonCard', '<ZodiacPicker', '<PlayTogether', '<CoupangBanner', '<SeasonPicks', '<CategoryTabs', 'HOME_FAQS.map((f)'].map((k) => src.indexOf(k))
  expect(order.every((v) => v > 0)).toBe(true)
  expect([...order].sort((a, b) => a - b)).toEqual(order)
  expect(src).not.toContain('ZODIAC_SLUGS')
})

test('홈은 서버 페이지이고 시즌 설정·FAQ 데이터를 쓴다', () => {
  const src = readFileSync('src/app/page.tsx', 'utf8')
  expect(src).not.toMatch(/^"use client"/)
  expect(src).toContain('FaceHero')
  expect(src).toContain('PlayTogether')
  expect(src).toContain('SeasonCard')
  expect(src).toContain('ZodiacPicker')
  expect(src).toContain('CategoryTabs')
  expect(src).toContain('HOME_FAQS')
})

test('홈에 근거 없는 참여자 수·순위 숫자가 없다', () => {
  const all = ['src/app/page.tsx', 'src/components/home/FaceHero.tsx', 'src/components/home/PlayTogether.tsx', 'src/components/home/SeasonCard.tsx', 'src/components/home/ZodiacPicker.tsx', 'src/components/home/CategoryTabs.tsx', 'src/content/season.ts'].map((f) => readFileSync(f, 'utf8')).join('\n')
  expect(all).not.toMatch(/\d[\d,]*명\s*(확인|참여|이용)|인기\s*순위|HOT/)
})

test('FAQ는 5개 이상이고 사실과 맞는 문구다', () => {
  expect(HOME_FAQS.length).toBeGreaterThanOrEqual(5)
  const text = JSON.stringify(HOME_FAQS)
  expect(text).toContain('丁未年')
  expect(text).not.toMatch(/Gemini|하루 1회|수백 개/)
})

test('띠 고르기는 날짜를 마운트 뒤에 계산한다(서버·브라우저 날짜 불일치 방지)', () => {
  const src = readFileSync('src/components/home/ZodiacPicker.tsx', 'utf8')
  expect(src).toContain('useEffect')
  expect(src).not.toMatch(/^const .*new Date\(\)/m)
})

const HOME_FILES = ['src/app/page.tsx', 'src/components/home/FaceHero.tsx', 'src/components/home/PlayTogether.tsx', 'src/components/home/SeasonCard.tsx', 'src/components/home/ZodiacPicker.tsx', 'src/components/home/CategoryTabs.tsx', 'src/content/season.ts']

test('홈 화면 파일에 이모지가 없다 (선 아이콘·텍스트 칩)', () => {
  for (const f of HOME_FILES) expect(readFileSync(f, 'utf8'), f).not.toMatch(/\p{Extended_Pictographic}/u)
})

test('홈에 "곧 열려요" 같은 열리지 않은 기능 안내가 없다', () => {
  for (const f of HOME_FILES) expect(readFileSync(f, 'utf8'), f).not.toContain('곧 열려요')
})

test('친구랑 같이 해봐요: 동물상·얼굴 궁합·MBTI 궁합·삼국지 (관상은 히어로가 맡음)', async () => {
  const { PLAY_TOGETHER } = await import('@/components/home/PlayTogether')
  expect(PLAY_TOGETHER.map((c) => c.href)).toEqual(['/animal', '/face-match', '/mbti/match', '/samguk'])
})
