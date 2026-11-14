import { renderToStaticMarkup } from 'react-dom/server'
vi.mock('@/lib/videos/fetch', () => ({ getChannelVideos: async () => [] }))
import Page, { generateMetadata, generateStaticParams } from '@/app/(ko)/samguk/people/[id]/page'
import { portraitSrc, personTitle, yearLabel } from '@/lib/people/portrait'
import { PEOPLE, PEOPLE_IDS } from '@/content/samgukPeople'
import { relationsOf } from '@/lib/people/relations'

async function render(id: string): Promise<string> {
  return renderToStaticMarkup(await Page({ params: Promise.resolve({ id }) })).replace(/<nav aria-label="단락 바로 가기"[\s\S]*?<\/nav>/, '') // 단락 탭 글자는 순서 검사에서 뺀다
}

test('portraitSrc: 한글 이름 jpg, 초상화 대기 인물은 null', () => {
  expect(portraitSrc('guanyu')).toBe('/images/samguk/관우.jpg')
  expect(portraitSrc('caojie')).toBeNull()
})

test('personTitle: 이름 열전 | 자, 브랜드 끝, 48자 이하', () => {
  const t = personTitle('caocao')
  expect(t.startsWith('조조 열전')).toBe(true)
  expect(t.endsWith(' – 운명을 읽다')).toBe(true)
  expect(t.length).toBeLessThanOrEqual(48)
  expect(t).toContain('자 맹덕')
  for (const id of PEOPLE_IDS) expect(personTitle(id).length, id).toBeLessThanOrEqual(48)
})

test('generateStaticParams는 PEOPLE_IDS', () => {
  expect(generateStaticParams()).toEqual(PEOPLE_IDS.map((id) => ({ id })))
})

test('메타: 설명 50~110자에 무기·관계·최후, canonical, OG 이미지', async () => {
  const m = await generateMetadata({ params: Promise.resolve({ id: 'guanyu' }) })
  const d = String(m.description)
  expect(d.length).toBeGreaterThanOrEqual(50)
  expect(d.length).toBeLessThanOrEqual(110)
  for (const w of ['무기', '관계', '최후']) expect(d).toContain(w)
  expect(m.alternates?.canonical).toBe('https://unse-ai.com/samguk/people/guanyu')
  const og = m.openGraph as { images?: { url: string }[] }
  expect(og.images?.[0].url).toContain(`/api/og?title=${encodeURIComponent('관우 열전')}`)
})

test('관우 페이지: 위에서 아래 순서와 details 4개', async () => {
  const html = await render('guanyu')
  const idx = (s: string) => {
    const i = html.indexOf(s)
    expect(i, s).toBeGreaterThanOrEqual(0)
    return i
  }
  const order = [idx('<h1'), idx('알고 보면 재밌는 이야기'), idx('쿠팡 추천 상품'), idx('상관도'), idx('나도 관우를 닮았을까'), idx('관우 한눈에 보기'), idx('id="cheer"'), idx('<details'), idx('id="duel-vote"'), idx('id="scene-vote"'), idx('id="verdict-vote"')]
  expect([...order].sort((a, b) => a - b)).toEqual(order)
  expect(html.match(/<details/g)).toHaveLength(4)
  for (const t of ['연의로 보는 생애', '주요 전투·사건', '관계도·혈연', '정사와 연의의 차이', '정사로 본 실제 모습']) expect(html).toContain(t)
  expect(html).toContain('/samguk/duel?me=guanyu')
  expect(html).toContain('일기토에서 싸워 보기')
  expect(html).toContain('"@type":"Person"')
  expect(html).toContain('"@type":"BreadcrumbList"')
  expect(html).toContain('연의: 청룡언월도')
  expect(html).toContain('정사 기록 없음')
  expect(html).toContain('알고 보면 재밌는 이야기')
})

test('초상화 대기 인물도 요약 → 쿠팡 → 닮은꼴 배너 순서', async () => {
  const html = await render('wangyi')
  const idx = (s: string) => {
    const i = html.indexOf(s)
    expect(i, s).toBeGreaterThanOrEqual(0)
    return i
  }
  expect(idx('<h1')).toBeLessThan(idx('쿠팡 추천 상품'))
  expect(idx('쿠팡 추천 상품')).toBeLessThan(idx('삼국지 닮은꼴 테스트 하기'))
})

test('하후돈 요약: 박망파 제갈량 화공은 연의라고 밝힌다', () => {
  const s = PEOPLE.xiaohoudun.summary
  expect(s.startsWith('하후돈은 연의에서 ')).toBe(true)
  expect(s.indexOf('연의에서')).toBeLessThan(s.indexOf('눈알'))
  expect(s.lastIndexOf('연의에서는')).toBeLessThan(s.indexOf('제갈량'))
  expect(s.lastIndexOf('연의에서는')).toBeGreaterThan(s.indexOf('눈알'))
})

test('funFacts는 요약·태그 아래, 한눈에 보기 위에 나온다', async () => {
  const html = await render('guanyu')
  const a = html.indexOf('알고 보면 재밌는 이야기')
  expect(a).toBeGreaterThan(html.indexOf('<h1'))
  expect(a).toBeLessThan(html.indexOf('한눈에 보기'))
})

test('famousQuote가 null이면 명언 칸을 숨긴다', async () => {
  const { PEOPLE } = await import('@/content/samgukPeople')
  const noQuote = Object.values(PEOPLE).find((p) => p.famousQuote === null)
  const withQuote = Object.values(PEOPLE).find((p) => p.famousQuote !== null)!
  expect(await render(withQuote.id)).toContain('대표 명언')
  if (noQuote) expect(await render(noQuote.id)).not.toContain('대표 명언')
})

test('을/를: 받침에 따라', async () => {
  expect(await render('guanyu')).toContain('나도 관우를 닮았을까')
  expect(await render('caocao')).toContain('나도 조조를 닮았을까')
})

test('일기토에 없는 인물은 일기토 버튼 없음', async () => {
  const html = await render('caocao')
  expect(html).not.toContain('일기토에서 싸워 보기')
  expect(html).not.toContain('/samguk/duel?me=')
})

test('함께 보는 인물: 열전 있으면 링크, 없으면 이름만 (데이터에서 계산)', async () => {
  const html = await render('guanyu')
  expect(html).toContain('/samguk/people/caocao')
  for (const r of relationsOf('guanyu')) {
    if (r.hasPage && r.otherId) {
      expect(html, r.otherName).toContain(`/samguk/people/${r.otherId}`)
    } else {
      expect(html, r.otherName).toContain(r.otherName)
      if (r.otherId) expect(html, r.otherName).not.toContain(`/samguk/people/${r.otherId}`)
    }
  }
})

test('열전 없는 관계(이름만, 조조의 아들 조앙)는 링크 없이 이름만', async () => {
  const rels = relationsOf('caocao').filter((r) => r.otherId === null)
  expect(rels.map((r) => r.otherName)).toContain('조앙')
  const html = await render('caocao')
  expect(html).toContain('조앙')
  // 함께 보는 인물 칸의 이름만 칩: 링크가 아니라 span
  expect(html).toMatch(/<span class="[^"]*border-dashed[^"]*"><span>조앙<\/span>/)
  expect(html).not.toMatch(/<a [^>]*>[^<]*(<span>)?조앙/)
})

test('yearLabel: 연도 미상에는 년을 붙이지 않음', () => {
  expect(yearLabel(null)).toBe('연도 미상')
  expect(yearLabel(200)).toBe('200년')
})

test('관계도 SVG와 글 목록', async () => {
  const html = await render('guanyu')
  expect(html).toContain('<svg')
  expect(html).toContain('혈연')
})

test('검색 제목 실험: 다섯 인물은 이름으로 시작하는 한 줄 제목, 48자 이하', async () => {
  const { HOOK_TITLES } = await import('@/lib/people/portrait')
  expect(Object.keys(HOOK_TITLES).sort()).toEqual(['dengai', 'guanyu', 'liubei', 'lvbu', 'zhaoyun'])
  for (const id of Object.keys(HOOK_TITLES)) {
    const t = personTitle(id)
    expect(t, id).toBe(HOOK_TITLES[id] + ' – 운명을 읽다')
    expect(t.length, id).toBeLessThanOrEqual(48)
  }
  expect(personTitle('caocao').startsWith('조조 열전')).toBe(true)
})
