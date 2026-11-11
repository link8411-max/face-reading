// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vitest'

const track = vi.fn()
vi.mock('@/lib/analytics', async (orig) => ({ ...(await orig<typeof import('@/lib/analytics')>()), track: (...a: unknown[]) => track(...a) }))

import GiftNudge from '@/components/bujeok/GiftNudge'
import ResultActions from '@/components/result/ResultActions'
import ArticleShare from '@/components/share/ArticleShare'
import { isSafeValue } from '@/lib/analytics'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

afterEach(() => {
  cleanup()
  track.mockClear()
})

const TEXT = '친구에게 부적 선물하기'

test('GiftNudge: /bujeok?mode=gift 링크, no-screenshot, 이모지 없음, 붉은 바탕 없음', () => {
  const html = renderToStaticMarkup(<GiftNudge from="samguk" />)
  expect(html).toContain(TEXT)
  expect(html).toContain('href="/bujeok?mode=gift"')
  expect(html).toMatch(/class="[^"]*no-screenshot/)
  expect(html).not.toMatch(/\p{Extended_Pictographic}/u)
  expect(html).not.toMatch(/red|rose|#[Cc]4|vermilion/)
})

test('GiftNudge: 누르면 next_test_click(test_name bujeok)을 보내고 출처는 result_id로만(허용 형식)', () => {
  render(<GiftNudge from="team_samguk" />)
  fireEvent.click(screen.getByRole('link', { name: TEXT }))
  expect(track).toHaveBeenCalledTimes(1)
  expect(track).toHaveBeenCalledWith('next_test_click', { test_name: 'bujeok', result_id: 'gift_team_samguk' })
  for (const from of ['face', 'animal', 'samguk', 'fortune', 'daily', 'mbti_match', 'face_match', 'team_samguk', 'mbti_daily', 'zodiac', 'mbti', 'saju', 'exam']) {
    expect(isSafeValue(`gift_${from}`), from).toBe(true)
  }
})

test('ResultActions: 공유하기 버튼 바로 아래에 GiftNudge가 정확히 한 번', () => {
  const html = renderToStaticMarkup(<ResultActions from="animal" onShare={() => {}} onSave={() => {}} onRetry={() => {}} busy={false} notice={null} />)
  expect(html.split(TEXT)).toHaveLength(2)
  const share = html.indexOf('공유하기')
  const nudge = html.indexOf(TEXT)
  const save = html.indexOf('이미지 저장')
  expect(share).toBeGreaterThan(-1)
  expect(share).toBeLessThan(nudge)
  expect(nudge).toBeLessThan(save)
})

test('ArticleShare(띠 글): 공유하기 아래 GiftNudge 한 번', () => {
  const html = renderToStaticMarkup(<ArticleShare testName="zodiac" title="t" text="x" url="https://unse-ai.com/x" imageUrl="https://unse-ai.com/y.png" giftNudge />)
  expect(html.split(TEXT)).toHaveLength(2)
  expect(html.indexOf('공유하기')).toBeLessThan(html.indexOf(TEXT))
})

// 결과 화면(공유 버튼이 있는 화면)마다 GiftNudge가 정확히 하나: ResultActions(from=…) 한 번 또는 <GiftNudge from=…> 한 번
const VIEWS: Record<string, string> = {
  samguk: 'src/app/samguk/(match)/page.tsx',
  face: 'src/app/face2/page.tsx',
  animal: 'src/app/animal/page.tsx',
  face_match: 'src/components/faceMatch/FaceMatchClient.tsx',
  team_samguk: 'src/components/samguk/TeamClient.tsx',
  mbti_match: 'src/components/mbti/MatchCalculator.tsx',
  mbti_daily: 'src/components/mbti/MbtiDailyClient.tsx',
  saju: 'src/app/saju/SajuClient.tsx',
  fortune: 'src/app/fortune/FortuneClient.tsx',
  daily: 'src/app/fortune/daily/page.tsx',
  zodiac: 'src/components/Zodiac2027Article.tsx',
  exam: 'src/components/exam/ReportCard.tsx',
}

test.each(Object.entries(VIEWS))('%s 결과 화면: GiftNudge 경로가 정확히 하나이고 from이 맞다', (from, file) => {
  const src = readFileSync(file, 'utf8')
  const direct = src.match(/<GiftNudge\b/g)?.length ?? 0
  const viaActions = src.match(/<ResultActions\b/g)?.length ?? 0
  const viaArticle = src.match(/<ArticleShare\b[^>]*\bgiftNudge\b/g)?.length ?? 0
  expect(direct + viaActions + viaArticle, file).toBe(1)
  if (direct) expect(src).toContain(`<GiftNudge from="${from}"`)
  if (viaActions) expect(src).toMatch(new RegExp(`<ResultActions[^>]*\\bfrom="${from}"|<ResultActions\\s+from="${from}"|from="${from}"`))
})

test('사진 테스트 시작 화면과 부적 화면에는 GiftNudge가 없다', () => {
  for (const f of ['src/components/test/TestStart.tsx', 'src/components/test/TestHeader.tsx', 'src/components/bujeok/BujeokDone.tsx', 'src/components/bujeok/BujeokClient.tsx', 'src/components/bujeok/GiftLanding.tsx']) {
    expect(readFileSync(f, 'utf8'), f).not.toContain('GiftNudge')
  }
})

test('GiftNudge 파일: 다른 곳에서 쓸 수 있게 TestName을 받고 효험 단정 문구가 없다', () => {
  const src = readFileSync('src/components/bujeok/GiftNudge.tsx', 'utf8')
  expect(src).toContain('TestName')
  expect(src).toContain('no-screenshot')
  expect(src).not.toMatch(/반드시|100%|보장|틀림없이/)
})
