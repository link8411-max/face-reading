import { renderToStaticMarkup } from 'react-dom/server'
import { generateMetadata as resultMeta } from '@/app/face-match/r/[pair]/page'
import { generateMetadata as inviteMeta } from '@/app/face-match/i/[key]/page'
import { metadata as mainMeta } from '@/app/face-match/page'
import FaceMatchCard from '@/components/faceMatch/FaceMatchCard'
import { faceMatch } from '@/lib/faceMatch/compat'
import { SITEMAP_ROUTES } from '@/app/sitemap'

const P = <T,>(v: T) => Promise.resolve(v)

test('얼굴 궁합 본 페이지: 검색 노출, 사이트맵 포함', () => {
  expect(mainMeta.robots).toBeUndefined()
  expect(mainMeta.alternates?.canonical).toBe('https://unse-ai.com/face-match')
  expect(SITEMAP_ROUTES as readonly string[]).toContain('/face-match')
  expect((SITEMAP_ROUTES as readonly string[]).some((r) => r.startsWith('/face-match/'))).toBe(false)
})

test('결과 공유 링크 메타: 1인칭 문구·미리보기 이미지·검색 제외', async () => {
  const m = await resultMeta({ params: P({ pair: 'cat-fox' }), searchParams: P({ rel: 'crush' }) })
  expect(m.openGraph?.title).toMatch(/^나 짝사랑 성공 가능성 \d+% 나왔어/)
  expect(JSON.stringify(m.openGraph?.images)).toContain('/api/og/result?kind=face-match&a=cat&b=fox&rel=crush')
  expect(m.robots).toEqual({ index: false, follow: true })
  expect((await resultMeta({ params: P({ pair: 'cat-x' }), searchParams: P({ rel: 'crush' }) })).openGraph).toBeUndefined()
})

test('초대 링크 메타: 짝사랑은 없음', async () => {
  const m = await inviteMeta({ params: P({ key: 'cat' }), searchParams: P({ rel: 'friend' }) })
  expect(m.openGraph?.title).toBe('나는 고양이상이야. 우리 친구 궁합 볼래?')
  expect(m.robots).toEqual({ index: false, follow: true })
  expect((await inviteMeta({ params: P({ key: 'cat' }), searchParams: P({ rel: 'crush' }) })).openGraph).toBeUndefined()
})

test('궁합 카드: 두 동물상, 큰 점수 문구, 다른 관계 점수, 워터마크', () => {
  const r = faceMatch('cat', 'fox', 'crush')
  const html = renderToStaticMarkup(<FaceMatchCard a="cat" b="fox" rel="crush" result={r} />)
  expect(html).toContain('고양이상')
  expect(html).toContain('여우상')
  expect(html).toContain(r.headline)
  expect(html).toContain(`친구 ${r.others.find((o) => o.rel === 'friend')!.score}점`)
  expect(html).toContain('unse-ai.com')
  expect(html).not.toMatch(/\p{Extended_Pictographic}/u)
})
