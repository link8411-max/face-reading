import { pageGuides, faqJsonLd, type GuideRoute } from '@/content/pageGuides'
import { SITEMAP_ROUTES } from '@/app/sitemap'
import { FACE_TYPES } from '@/lib/shareLinks'
import { animalTypeDB, animalTypeList } from '@/lib/animalTypeDB'
import { PEOPLE_ID_LIST } from '@/content/samgukPeople/ids'
import { PENDING_PORTRAIT_IDS } from '@/lib/samgukDB'

const routes = Object.keys(pageGuides) as GuideRoute[]

test.each(routes)('%s 가이드 분량', (route) => {
  const g = pageGuides[route]!
  expect(g.intro.join("").length).toBeGreaterThanOrEqual(300)
  expect(g.highlights.length).toBeGreaterThanOrEqual(3)
  expect(g.faqs.length).toBeGreaterThanOrEqual(4)
})

test.each(routes)('%s related는 자기 자신이 아니고 sitemap에 있는 라우트', (route) => {
  const g = pageGuides[route]!
  expect(g.related.length).toBeGreaterThan(0)
  for (const r of g.related) {
    expect(r).not.toBe(route)
    expect(SITEMAP_ROUTES as readonly string[]).toContain(r)
  }
})

test('faqJsonLd는 < 를 이스케이프한다', () => {
  const faqs = pageGuides['/face2']!.faqs
  faqs.push({ q: 'x', a: '</script><b>' })
  try {
    const json = faqJsonLd('/face2')
    expect(json).not.toContain('</script>')
    const parsed = JSON.parse(json)
    expect(parsed['@type']).toBe('FAQPage')
    expect(parsed.mainEntity).toHaveLength(faqs.length)
  } finally {
    faqs.pop()
  }
})

test('모든 GuideRoute에 가이드가 있다', () => {
  const all: GuideRoute[] = ['/face2', '/animal', '/samguk', '/fortune', '/fortune/daily', '/fortune/mbti', '/saju']
  for (const r of all) expect(pageGuides[r], r).toBeDefined()
})

test('/fortune 가이드는 절기 시각 기준과 시간을 알면 시주까지 계산함을 밝힌다', () => {
  const text = JSON.stringify(pageGuides['/fortune'])
  // 사주팔자 일반 정의(여덟 글자)는 허용, 우리 계산이 여덟 글자/네 기둥이라는 주장만 금지
  expect(text).not.toContain('여덟 글자를 보여')
  expect(text).not.toContain('네 기둥의 천간')
  expect(text).not.toContain('더 자세한 풀이')
  expect(text).toContain('절기')
  expect(text).toContain('시주')
  expect(text).not.toContain('여섯 글자')
  expect(text).not.toContain('하루 정도')
  expect(text).toContain('양력')
})

test('/samguk 가이드는 브라우저 안에서만 분석함을 밝히고 Gemini를 언급하지 않는다', () => {
  const text = JSON.stringify(pageGuides['/samguk'])
  expect(text).not.toContain('Gemini')
  expect(pageGuides['/samguk'].faqs.find((f) => f.q.includes('사진'))!.a).toContain('브라우저')
})

test('운세 가이드는 바뀐 계산 방식(음력 변환, 입춘 기준, 근사)을 사실대로 말한다', () => {
  const fortune = JSON.stringify(pageGuides['/fortune'])
  const daily = JSON.stringify(pageGuides['/fortune/daily'])
  expect(fortune).not.toContain('바꿔 계산하지는 않아요')
  expect(fortune).not.toContain('지금은 양력 생일을 기준으로 계산해요')
  expect(fortune).toContain('입춘')
  expect(fortune).toContain('윤달')
  expect(fortune).toContain('절기')
  expect(daily).not.toContain('음력 설')
  expect(daily).toContain('입춘')
})

// ---- 도구 페이지 sections (결과 유형 미리보기 카드) ----
const emojiRe = /\p{Extended_Pictographic}/u
const sectionRoutes: GuideRoute[] = ['/face2', '/animal', '/samguk']

test('/face2 sections: 15유형 + 5부위', () => {
  const s = pageGuides['/face2'].sections!
  expect(s).toHaveLength(2)
  expect(s[0].heading).toBe('관상 결과 유형 15가지')
  expect(s[0].items).toHaveLength(15)
  expect(new Set(s[0].items.map((i) => i.title))).toEqual(new Set(Object.values(FACE_TYPES)))
  expect(s[1].items).toHaveLength(5)
})

test('/animal sections: 8종 전부', () => {
  const s = pageGuides['/animal'].sections!
  expect(s).toHaveLength(1)
  expect(s[0].items).toHaveLength(8)
  expect(new Set(s[0].items.map((i) => i.title))).toEqual(new Set(animalTypeList.map((k) => animalTypeDB[k].name)))
})

test('/samguk sections: 대표 장수 열전 링크 + 매칭 방식 3카드', () => {
  const s = pageGuides['/samguk'].sections!
  expect(s).toHaveLength(2)
  expect(s[0].items.length).toBeGreaterThanOrEqual(8)
  for (const it of s[0].items) {
    const m = /^\/samguk\/people\/([a-z0-9_-]+)$/.exec(it.href ?? '')
    expect(m, it.title).not.toBeNull()
    expect(PEOPLE_ID_LIST, it.href).toContain(m![1])
    expect(PENDING_PORTRAIT_IDS.has(m![1]), it.href).toBe(false)
  }
  expect(s[1].items).toHaveLength(3)
})

test.each(sectionRoutes)('%s sections 카드 글 규칙', (route) => {
  for (const sec of pageGuides[route].sections!) {
    expect(sec.heading.length).toBeGreaterThan(0)
    for (const it of sec.items) {
      expect(it.body.length, it.title).toBeGreaterThanOrEqual(40)
      expect(it.body.length, it.title).toBeLessThanOrEqual(140)
      expect(emojiRe.test(it.title + it.body + sec.heading), it.title).toBe(false)
      if (it.href) expect(it.href.startsWith('/')).toBe(true)
      for (const w of ['천문연구원', '근사', '윤달', '저장되지', '서버로 전송', 'Gemini', '당신']) {
        expect(it.title + it.body, `${it.title}: ${w}`).not.toContain(w)
      }
    }
  }
})

test('/saju 가이드: 네 기둥·절기·십신·대운·세운을 말하고 저장하지 않음을 밝힌다', () => {
  const g = pageGuides['/saju']
  expect(g.faqs.length).toBeGreaterThanOrEqual(4)
  const text = JSON.stringify(g)
  for (const t of ['네 기둥', '절기', '십신', '대운', '세운', '저장']) expect(text).toContain(t)
  expect(g.related).toEqual(['/fortune', '/fortune/daily'])
})
