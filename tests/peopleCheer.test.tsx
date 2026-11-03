import { renderToStaticMarkup } from 'react-dom/server'
import type { PersonStats } from '@/lib/people/votes'

let mockStats: PersonStats | null = null
vi.mock('@/components/people/usePersonStats', async (orig) => {
  const actual = await orig<typeof import('@/components/people/usePersonStats')>()
  return {
    ...actual,
    useMarker: () => null,
    usePersonStats: () => ({ stats: mockStats, disabled: mockStats === null, vote: async () => null }),
  }
})

import CheerButton from '@/components/people/CheerButton'
import VotePoll from '@/components/people/VotePoll'

const render = (stats: PersonStats | null) => {
  mockStats = stats
  return renderToStaticMarkup(<CheerButton id="guanyu" name="관우" />).replace(/<!-- -->/g, '')
}
const base = { duel: {}, scene: {}, verdict: {} }

describe('응원 수·순위 표시', () => {
  test('0번이면 숫자 없이 "첫 응원을 남겨 보세요", 순위도 없다', () => {
    const html = render({ cheer: 0, ...base })
    expect(html).toContain('data-cheer-count')
    expect(html).toContain('첫 응원을 남겨 보세요')
    expect(html).not.toMatch(/응원 \d/)
    expect(html).not.toContain('data-cheer-rank')
  })
  test('1번부터 실제 숫자 "응원 N번", "명"은 쓰지 않는다', () => {
    let html = render({ cheer: 1, ...base })
    expect(html).toContain('응원 1번')
    expect(html).not.toContain('첫 응원을')
    expect(html).not.toContain('명이')
    html = render({ cheer: 1234, ...base })
    expect(html).toContain('응원 1,234번')
  })
  test('순위를 알면 "지금 응원 순위 N위"', () => {
    const html = render({ cheer: 7, rank: 2, ...base })
    expect(html).toContain('data-cheer-rank')
    expect(html).toContain('지금 응원 순위 2위')
  })
  test('순위를 모르면 순위 줄을 뺀다, 응원이 0이면 rank가 있어도 보이지 않는다', () => {
    expect(render({ cheer: 7, ...base })).not.toContain('data-cheer-rank')
    expect(render({ cheer: 0, rank: 1, ...base })).not.toContain('data-cheer-rank')
  })
  test('집계를 못 읽거나 기록이 꺼져 있으면(stats null) 숫자·순위를 모두 숨긴다', () => {
    const html = render(null)
    expect(html).not.toContain('data-cheer-count')
    expect(html).not.toContain('data-cheer-rank')
    expect(html).not.toContain('첫 응원을')
    expect(html).toContain('응원하기')
  })
  test('버튼 아래에 응원 순위 보기 링크가 항상 있다', () => {
    for (const s of [null, { cheer: 0, ...base }, { cheer: 5, rank: 1, ...base }]) {
      expect(render(s)).toMatch(/<a [^>]*href="\/samguk\/people\/ranking"[^>]*>응원 순위 보기<\/a>/)
    }
  })
})

describe('투표 인원 표시(VotePoll)', () => {
  // 서버 렌더에서는 투표 전이라 문구가 나오지 않으므로, 비율 숨김 여부와 인원 문구의 계산을 함수 수준에서 확인한다.
  test('headCountText는 실제 합계를 쓴다', async () => {
    const { headCountText } = await import('@/components/people/usePersonStats')
    expect(headCountText(3)).toBe('지금 3명이 투표했어요')
    expect(headCountText(1200)).toBe('지금 1,200명이 투표했어요')
  })
  test('투표 전 서버 렌더에는 비율도 인원 문구도 없다', () => {
    mockStats = { cheer: 0, duel: { guanyu: 2, caocao: 1 }, scene: {}, verdict: {} }
    const html = renderToStaticMarkup(
      <VotePoll kind="duel" id="guanyu" target="caocao__guanyu" title="t" options={[{ key: 'guanyu', label: '관우' }, { key: 'caocao', label: '조조' }]} />,
    )
    expect(html).not.toContain('%')
    expect(html).not.toContain('명이 투표했어요')
  })
})
