import { generateMetadata } from '@/app/fortune/mbti/r/[type]/page'
import { readFileSync } from 'node:fs'
import { SITEMAP_ROUTES } from '@/app/sitemap'

test('친구 링크 착지 메타: 검색 제외, canonical은 /fortune/mbti, og에 날짜 없음', async () => {
  const m = await generateMetadata({ params: Promise.resolve({ type: 'entj' }) })
  expect(m.robots).toEqual({ index: false, follow: true })
  expect(m.alternates?.canonical).toBe('https://unse-ai.com/fortune/mbti')
  const og = m.openGraph as { title: string; images: { url: string }[] }
  expect(og.title).toBe('친구의 오늘 ENTJ 운세가 도착했어요. 너는 무슨 유형이야?')
  expect(og.images[0].url).toBe('https://unse-ai.com/api/og/result?kind=mbti-daily&type=entj')
  expect(JSON.stringify(m)).not.toMatch(/\d{4}-\d{2}/)
  expect(await generateMetadata({ params: Promise.resolve({ type: 'xxxx' }) })).toEqual({})
})

test('사이트맵에는 /fortune/mbti만, 착지(r)는 없다', () => {
  expect(SITEMAP_ROUTES).toContain('/fortune/mbti')
  expect(SITEMAP_ROUTES.some((r) => r.startsWith('/fortune/mbti/r'))).toBe(false)
})

test('날짜에 따라 달라지는 내용은 마운트 뒤에 그린다 (정적 HTML·CDN 캐시의 어제 운세 방지)', () => {
  for (const f of ['src/components/mbti/MbtiDailyClient.tsx', 'src/components/mbti/MbtiDailyShared.tsx']) {
    const src = readFileSync(f, 'utf8')
    expect(src, f).toContain('"use client"')
    expect(src, f).toMatch(/useEffect\([^]*kstDate\(new Date\(\)\)/)
  }
})
