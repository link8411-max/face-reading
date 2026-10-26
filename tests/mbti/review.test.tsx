import { renderToStaticMarkup } from 'react-dom/server'
import { monthlyFor, seoulMonth } from '@/content/mbtiTypes'
import { revalidate } from '@/app/mbti/[type]/page'
import Zodiac2027Article from '@/components/Zodiac2027Article'

// 리뷰 Important 1: 이달의 운세는 한국 시간 기준 달로 판단하고, 정적 페이지는 하루마다 다시 만든다
test('이달의 운세는 한국 시간 기준 달을 쓴다 (UTC 빌드 서버에서도)', () => {
  expect(seoulMonth(new Date('2026-10-31T15:30:00Z'))).toBe('2026-11') // KST 11/1 00:30
  expect(monthlyFor('INFP', new Date('2026-10-31T15:30:00Z'))).not.toBeNull()
  expect(monthlyFor('INFP', new Date('2026-11-30T15:30:00Z'))).toBeNull() // KST 12/1
})

test('MBTI 유형 페이지는 하루 이내로 재검증된다', () => {
  expect(revalidate).toBeGreaterThan(0)
  expect(revalidate).toBeLessThanOrEqual(86400)
})

// 리뷰 Important 2: 스펙대로 띠별·사주 결과에서 MBTI 궁합으로 내부 링크
test('띠별 운세 페이지에 MBTI 궁합 링크가 있다', () => {
  const html = renderToStaticMarkup(<Zodiac2027Article slug="sheep" />)
  expect(html).toContain('href="/mbti/match"')
  expect(html).toContain('MBTI 궁합도 보기')
})
