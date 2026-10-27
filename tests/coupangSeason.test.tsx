import { renderToStaticMarkup } from 'react-dom/server'
import { activeSeason, seasonHeadline, SEASONS } from '@/content/coupangSeasons'
import { SeasonPicksView } from '@/components/SeasonPicks'

const kst = (s: string) => new Date(`${s}+09:00`)

test('수능 시즌: 시작일부터 수능 다음 날(11/20)까지만, 한국 시간 기준', () => {
  expect(activeSeason(kst('2026-10-27T09:00:00'))?.id).toBe('suneung-2027')
  expect(activeSeason(kst('2026-11-20T23:59:00'))?.id).toBe('suneung-2027')
  expect(activeSeason(kst('2026-11-21T00:00:00'))).toBeNull()
  expect(activeSeason(kst('2026-10-26T23:59:00'))).toBeNull()
})

test('수능 D-day 문구', () => {
  const s = SEASONS.find((x) => x.id === 'suneung-2027')!
  expect(s.exam).toBe('2026-11-19')
  expect(seasonHeadline(s, kst('2026-10-27T10:00:00'))).toBe('수능 D-23')
  expect(seasonHeadline(s, kst('2026-11-19T07:00:00'))).toBe('오늘이 수능, 모두 힘내요')
  expect(seasonHeadline(s, kst('2026-11-20T12:00:00'))).toBe('수능 끝, 고생한 수험생에게')
})

test('카드: 키워드 4개 링크(새 창·sponsored), 대가성 문구, 이모지 없음', () => {
  const s = SEASONS[0]
  const html = renderToStaticMarkup(<SeasonPicksView season={s} headline="수능 D-23" slot="daily" />)
  expect(s.links).toHaveLength(4)
  for (const l of s.links) {
    expect(html).toContain(`href="${l.url}"`)
    expect(html).toContain(l.label)
  }
  expect(html.match(/rel="sponsored noopener"/g)).toHaveLength(4)
  expect(html.match(/target="_blank"/g)).toHaveLength(4)
  expect(html).toContain('쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다')
  expect(html).not.toMatch(/\p{Extended_Pictographic}/u)
})

test('링크는 쿠팡 파트너스 단축 주소만', () => {
  for (const s of SEASONS) for (const l of s.links) expect(l.url).toMatch(/^https:\/\/link\.coupang\.com\/a\/[A-Za-z0-9]+$/)
})

import { readFileSync } from 'node:fs'
test('위치: 메인 시즌 카드·오늘의 운세 결과·띠별 운세·신년운세 결과에만, 사진 테스트 흐름에는 없음', () => {
  const has = (f: string) => readFileSync(f, 'utf8').includes('<SeasonPicks slot=')
  for (const f of ['src/app/page.tsx', 'src/app/fortune/daily/page.tsx', 'src/components/Zodiac2027Article.tsx', 'src/app/fortune/FortuneClient.tsx', 'src/components/mbti/MbtiDailyClient.tsx']) expect(has(f), f).toBe(true)
  for (const f of ['src/app/face2/page.tsx', 'src/app/animal/page.tsx', 'src/app/samguk/page.tsx', 'src/components/faceMatch/FaceMatchClient.tsx', 'src/components/samguk/TeamClient.tsx']) expect(has(f), f).toBe(false)
})
