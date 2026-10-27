// 검색 결과 제목·설명(스니펫): 클릭률 위주 문구, 길이 상한, 옛 문구 금지 (2026-10-27)
import type { Metadata } from 'next'

// 루트 레이아웃의 next/font는 테스트 환경에서 동작하지 않으므로 가짜로 바꾼다
vi.mock('next/font/google', () => { const f = () => ({ variable: '', className: '' }); return { Noto_Sans_KR: f, Gowun_Batang: f, Silkscreen: f } })
import { renderToStaticMarkup } from 'react-dom/server'
import { metadata as root } from '@/app/layout'
import { metadata as face2 } from '@/app/face2/layout'
import { metadata as animal } from '@/app/animal/layout'
import { metadata as samguk } from '@/app/samguk/layout'
import { metadata as fortune } from '@/app/fortune/layout'
import { metadata as mbtiDaily } from '@/app/fortune/mbti/layout'
import { generateMetadata as zodiacMeta } from '@/app/fortune/2027/[zodiac]/page'
import { generateMetadata as mbtiMeta } from '@/app/mbti/[type]/page'
import Zodiac2027Article from '@/components/Zodiac2027Article'
import { ZODIAC_SLUGS, SAMJAE_2027 } from '@/content/fortune2027Zodiac'
import { MBTI_TYPES } from '@/lib/mbti/compat'

const TITLE_MAX = 48 // 구글은 약 30~35자 뒤를 자를 수 있다. 핵심어를 앞에 두고 잘려도 되는 브랜드를 끝에 둔다
const DESC_MAX = 110
const BANNED = [/2026/, /토정비결/, /하루 1회/, /Gemini/i, /AI가 당신의 얼굴을/, /!/]
const BRAND = ' – 운명을 읽다'

async function pages(): Promise<[string, Metadata][]> {
  const list: [string, Metadata][] = [['/', root], ['/face2', face2], ['/animal', animal], ['/samguk', samguk], ['/fortune', fortune], ['/fortune/mbti', mbtiDaily]]
  for (const z of ZODIAC_SLUGS) list.push([`/fortune/2027/${z}`, await zodiacMeta({ params: Promise.resolve({ zodiac: z }) })])
  for (const t of MBTI_TYPES) list.push([`/mbti/${t.toLowerCase()}`, await mbtiMeta({ params: Promise.resolve({ type: t.toLowerCase() }) })])
  return list
}

test('제목·설명 길이 상한, 브랜드는 끝에 " – 운명을 읽다" 하나, 옛 문구·느낌표 없음 (og 포함)', async () => {
  for (const [path, m] of await pages()) {
    const title = String(m.title)
    const desc = String(m.description)
    expect(title.length, `${path} title(${title.length}): ${title}`).toBeLessThanOrEqual(TITLE_MAX)
    expect(desc.length, `${path} desc(${desc.length}): ${desc}`).toBeLessThanOrEqual(DESC_MAX)
    expect(desc.length, `${path} desc 너무 짧음`).toBeGreaterThanOrEqual(50)
    expect(title.endsWith(BRAND), `${path} 브랜드: ${title}`).toBe(true)
    expect(title.split('운명을 읽다').length, `${path} 브랜드 중복`).toBe(2)
    const og = m.openGraph as { title?: string; description?: string } | undefined
    expect(og?.title, `${path} og:title`).toBe(title)
    expect(og?.description, `${path} og:description`).toBe(desc)
    const tw = m.twitter as { title?: string; description?: string } | undefined
    if (tw?.title) expect(tw.title, `${path} twitter`).toBe(title)
    if (tw?.description) expect(tw.description, `${path} twitter`).toBe(desc)
    for (const b of BANNED) for (const t of [title, desc]) expect(t, `${path}: ${t}`).not.toMatch(b)
  }
})

test('메인은 관상·동물상을 신년운세보다 앞에, 가입 없이·사진 저장 안 함', () => {
  const t = String(root.title), d = String(root.description)
  expect(t.indexOf('관상')).toBeGreaterThanOrEqual(0)
  expect(t.indexOf('관상')).toBeLessThan(t.indexOf('운명을 읽다'))
  expect(t).not.toContain('신년운세')
  expect(d).toContain('가입 없이')
  expect(d).toContain('저장하지 않아요')
  expect(d).toContain('2027 신년운세')
})

test('관상·동물상·삼국지 설명은 가입 없이·사진 저장 안 함, 동물상은 남녀 따로, 삼국지는 52명·회사생활 스탯', () => {
  for (const m of [face2, animal, samguk]) {
    expect(String(m.description)).toContain('가입 없이')
    expect(String(m.description)).toContain('저장하지 않아요')
  }
  expect(String(face2.title)).toContain('AI 관상 테스트')
  expect(String(animal.title)).toMatch(/남녀|남자·여자/)
  expect(String(samguk.title)).toContain('52명')
  expect(String(samguk.description)).toMatch(/칼퇴력|꼰대력/)
  expect(String(fortune.title).startsWith('2027 신년운세')).toBe(true)
})

test('띠별 제목: 출생연도(두 자리)와 날삼재(돼지·토끼·양) 또는 올해 키워드, 본문과 일치', async () => {
  expect(Object.keys(SAMJAE_2027).sort()).toEqual(['pig', 'rabbit', 'sheep'])
  const sheep = String((await zodiacMeta({ params: Promise.resolve({ zodiac: 'sheep' }) })).title)
  expect(sheep).toContain('(55·67·79·91·03년생)')
  for (const z of ZODIAC_SLUGS) {
    const title = String((await zodiacMeta({ params: Promise.resolve({ zodiac: z }) })).title)
    const body = renderToStaticMarkup(<Zodiac2027Article slug={z} />)
    expect(title, z).toMatch(/\((\d{2}·){3,4}\d{2}년생\)/)
    if (z in SAMJAE_2027) {
      expect(title, z).toContain('날삼재')
      expect(body, z).toContain('날삼재')
    } else {
      expect(title, z).not.toContain('삼재')
      expect(body, z).not.toContain('삼재')
    }
  }
})

test('오늘의 MBTI 운세: 제목 앞에 핵심어, 설명에 가입 없이·MBTI만 고르면', () => {
  expect(String(mbtiDaily.title).startsWith('오늘의 MBTI 운세')).toBe(true)
  expect(String(mbtiDaily.description)).toContain('가입 없이')
  expect(String(mbtiDaily.description)).toContain('MBTI만 고르면')
})
