import { shareMetadata } from '@/components/share/SharePage'
import { SITEMAP_ROUTES } from '@/app/sitemap'

const run = (kind: 'animal' | 'samguk' | 'face', key: string, s?: string) =>
  shareMetadata(kind, Promise.resolve({ key }), Promise.resolve(s ? { s } : {}))

test('동물상 공유 링크 메타: 1인칭 문구, 결과 미리보기 이미지, 검색 제외, canonical은 테스트 페이지', async () => {
  const m = await run('animal', 'cat', '87')
  expect(m.openGraph?.title).toBe('나는 고양이상 87% 나왔어. 너는 무슨 상이야?')
  expect(JSON.stringify(m.openGraph?.images)).toContain('/api/og/result?kind=animal&key=cat&s=87')
  expect(m.robots).toEqual({ index: false, follow: true })
  expect(m.alternates?.canonical).toBe('https://unse-ai.com/animal')
})

test('삼국지·관상 메타 문구', async () => {
  expect((await run('samguk', 'zhaoyun', '84')).openGraph?.title).toBe('나는 조운이랑 84% 닮았대. 너는 삼국지 속 누구야?')
  expect((await run('face', 'wealth')).openGraph?.title).toBe('나는 재물상이래. 너 관상도 봐줄까?')
})

test('잘못된 값이면 결과 메타를 만들지 않는다', async () => {
  expect((await run('animal', 'unicorn', '87')).openGraph).toBeUndefined()
  expect((await run('samguk', 'zhaoyun', 'abc')).openGraph).toBeUndefined()
})

test('결과 공유 페이지는 사이트맵에 없다', () => {
  expect((SITEMAP_ROUTES as readonly string[]).some((r) => r.includes('/r/'))).toBe(false)
})

import * as matchPage from '@/app/mbti/match/page'
import { generateMetadata as mbtiShareMeta } from '@/app/mbti/r/[pair]/page'

test('계산기(/mbti/match)는 정적 메타 그대로 (공유 링크 때문에 동적 페이지가 되지 않는다)', () => {
  expect('generateMetadata' in matchPage).toBe(false)
  expect(matchPage.metadata.title).toContain('MBTI 궁합 계산기')
})

test('MBTI 궁합 공유 링크(/mbti/r/infp-entj): 결과 문구·미리보기·검색 제외, 잘못된 값은 빈 메타', async () => {
  const m = await mbtiShareMeta({ params: Promise.resolve({ pair: 'infp-entj' }) })
  expect(m.openGraph?.title).toBe('INFP랑 ENTJ 궁합 100점이래. 우리도 해볼까?')
  expect(JSON.stringify(m.openGraph?.images)).toContain('/api/og/result?kind=mbti&a=INFP&b=ENTJ')
  expect(m.robots).toEqual({ index: false, follow: true })
  expect((m.openGraph as { url?: string }).url).toBe('https://unse-ai.com/mbti/r/infp-entj')
  expect((await mbtiShareMeta({ params: Promise.resolve({ pair: 'infp-xxxx' }) })).openGraph).toBeUndefined()
})

// 리뷰 Important: og:url로 다시 열어도 같은 결과가 나오게 점수를 담는다
test('결과 링크 og:url에 점수가 있다(utm은 없음)', async () => {
  const m = await run('animal', 'cat', '87')
  expect((m.openGraph as { url?: string }).url).toBe('https://unse-ai.com/animal/r/cat?s=87')
})
