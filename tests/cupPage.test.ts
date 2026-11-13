import { dynamicParams, generateMetadata, generateStaticParams, revalidate } from '@/app/(ko)/samguk/cup/[board]/page'
import { BOARD_KEYS } from '@/lib/cup/boards'

test('판 페이지: 정적 4개, 목록 밖은 404, 1시간 재검증', () => {
  expect(generateStaticParams()).toEqual(BOARD_KEYS.map((board) => ({ board })))
  expect(dynamicParams).toBe(false)
  expect(revalidate).toBe(3600)
})

test('판 페이지 메타: 제목 48자 이하, canonical', async () => {
  for (const board of BOARD_KEYS) {
    const m = await generateMetadata({ params: Promise.resolve({ board }) })
    expect(String(m.title).length).toBeLessThanOrEqual(48)
    expect(String(m.title)).not.toContain('삼국지 삼국지')
    expect(String(m.title)).toMatch(/^삼국지 .+ 월드컵 – 운명을 읽다$/)
    expect(m.alternates?.canonical).toBe(`https://unse-ai.com/samguk/cup/${board}`)
  }
})
