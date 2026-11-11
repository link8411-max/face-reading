import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { NEXT_BY_TEST, CATEGORIES } from '@/content/navigation'
import NextSteps from '@/components/result/NextSteps'

const STEM: Record<string, 'birth' | 'photo' | 'pair'> = {
  '/saju': 'birth', '/bujeok': 'birth', '/fortune': 'birth', '/fortune/2027': 'birth', '/fortune/daily': 'birth', '/fortune/mbti': 'pair',
  '/face2': 'photo', '/animal': 'photo', '/samguk': 'photo', '/face-match': 'pair', '/mbti': 'pair', '/mbti/match': 'pair',
}
const FROM_HREF = { saju: '/saju', fortune: '/fortune', zodiac: '/fortune/2027', daily: '/fortune/daily', face: '/face2', animal: '/animal', samguk: '/samguk', mbti: '/mbti' } as const

test('결과 연결은 같은 줄기 1개 + 다른 줄기 1개, 자기 자신으로 가지 않는다', () => {
  for (const [from, [same, other]] of Object.entries(NEXT_BY_TEST)) {
    const here = FROM_HREF[from as keyof typeof FROM_HREF]
    expect(same.href, from).not.toBe(here)
    expect(other.href, from).not.toBe(here)
    expect(STEM[same.href], from).toBe(STEM[here])
    // 띠별은 설계 4절 표대로 둘 다 생년월일 줄기(신년운세 + 내 사주 풀이) — 띠만 본 사람을 내 생년월일 풀이로 잇는다
    if (from !== 'zodiac') expect(STEM[other.href], from).not.toBe(STEM[here])
  }
})

test('연결 주소는 모두 메뉴에 있는 페이지다', () => {
  const hrefs = new Set(CATEGORIES.flatMap((c) => c.items.map((i) => i.href)))
  for (const pair of Object.values(NEXT_BY_TEST)) for (const s of pair) expect(hrefs.has(s.href), s.href).toBe(true)
})

test('사진 결과에서는 같은 사진 칸을 빼고(NextTests가 맡음) 다른 줄기만 보인다', () => {
  const html = renderToStaticMarkup(<NextSteps from="face" withPhoto />)
  expect(html).toContain('href="/saju"')
  expect(html).not.toContain('href="/animal"')
  expect(renderToStaticMarkup(<NextSteps from="saju" />)).toContain('href="/bujeok"')
})

test.each([
  'src/app/saju/SajuClient.tsx', 'src/app/fortune/FortuneClient.tsx', 'src/components/Zodiac2027Article.tsx', 'src/app/fortune/daily/page.tsx',
  'src/app/face2/page.tsx', 'src/app/animal/page.tsx', 'src/app/samguk/(match)/page.tsx', 'src/components/mbti/MbtiArticle.tsx', 'src/app/mbti/match/page.tsx',
])('%s 결과에 NextSteps가 붙어 있다', (f) => {
  expect(readFileSync(f, 'utf8')).toContain('<NextSteps')
})

test('사주·신년운세 결과는 부적으로 잇는다', () => {
  expect(NEXT_BY_TEST.saju.map((s) => s.href)).toContain('/bujeok')
  expect(NEXT_BY_TEST.fortune.map((s) => s.href)).toContain('/bujeok')
  const step = NEXT_BY_TEST.saju.find((s) => s.href === '/bujeok')!
  expect(step.title).toBe('내 사주로 부적 만들기')
  expect(step.test).toBe('bujeok')
})

test.each(['src/app/saju/SajuClient.tsx', 'src/app/fortune/FortuneClient.tsx'])('%s는 NextSteps에 입력한 생년월일(birth)을 넘긴다', (f) => {
  expect(readFileSync(f, 'utf8')).toMatch(/<NextSteps from="(saju|fortune)" birth=\{/)
})

test('모든 결과 연결 아래에 오늘의 밈 능력고사 칸이 하나 붙는다(사진 결과 포함)', () => {
  for (const from of Object.keys(NEXT_BY_TEST) as (keyof typeof NEXT_BY_TEST)[]) {
    for (const withPhoto of [false, true]) {
      const html = renderToStaticMarkup(<NextSteps from={from} withPhoto={withPhoto} />)
      expect(html.match(/href="\/exam\/meme"/g), `${from} ${withPhoto}`).toHaveLength(1)
      expect(html).toContain('data-next-step="exam"')
    }
  }
})
