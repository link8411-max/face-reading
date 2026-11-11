import { existsSync, readFileSync } from 'node:fs'
import { samgukCharacters } from '@/lib/samgukDB'
// 검색 결과 제목·설명(스니펫): 클릭률 위주 문구, 길이 상한, 옛 문구 금지 (2026-10-27)
import type { Metadata } from 'next'

// 루트 레이아웃의 next/font는 테스트 환경에서 동작하지 않으므로 가짜로 바꾼다
vi.mock('next/font/local', () => ({ default: () => ({ variable: '', className: '' }) }))
import { renderToStaticMarkup } from 'react-dom/server'
import { metadata as root } from '@/app/layout'
import { metadata as face2 } from '@/app/face2/layout'
import { metadata as animal } from '@/app/animal/layout'
import { metadata as samguk } from '@/app/samguk/layout'
import { metadata as duel } from '@/app/samguk/duel/layout'
import { metadata as bujeok } from '@/app/bujeok/layout'
import { metadata as examMeme } from '@/app/exam/meme/layout'
import { generateMetadata as duelGeneralMeta } from '@/app/samguk/duel/generals/[id]/page'
import { DUEL_GENERALS } from '@/lib/duel/generals'
import { metadata as fortune } from '@/app/fortune/layout'
import { metadata as mbtiDaily } from '@/app/fortune/mbti/layout'
import { generateMetadata as personMeta } from '@/app/samguk/people/[id]/page'
import { generateMetadata as peopleHubMeta } from '@/app/samguk/people/page'
import { generateMetadata as peopleRankingMeta } from '@/app/samguk/people/ranking/page'
import { PEOPLE_IDS } from '@/content/samgukPeople'
import { generateMetadata as zodiacMeta } from '@/app/fortune/2027/[zodiac]/page'
import { generateMetadata as mbtiMeta } from '@/app/mbti/[type]/page'
import Zodiac2027Article from '@/components/Zodiac2027Article'
import { ZODIAC_SLUGS, SAMJAE_2027 } from '@/content/fortune2027Zodiac'
import { MBTI_TYPES, bestMatches } from '@/lib/mbti/compat'
import { mbtiProfiles } from '@/content/mbtiTypes'
import MbtiArticle from '@/components/mbti/MbtiArticle'

const TITLE_MAX = 48 // 구글은 약 30~35자 뒤를 자를 수 있다. 핵심어를 앞에 두고 잘려도 되는 브랜드를 끝에 둔다
const DESC_MAX = 110
const BANNED = [/2026/, /토정비결/, /하루 1회/, /Gemini/i, /AI가 당신의 얼굴을/, /!/]
const BRAND = ' – 운명을 읽다'

async function pages(): Promise<[string, Metadata][]> {
  const list: [string, Metadata][] = [['/', root], ['/face2', face2], ['/animal', animal], ['/samguk', samguk], ['/fortune', fortune], ['/fortune/mbti', mbtiDaily], ['/samguk/duel', duel], ['/exam/meme', examMeme], ['/bujeok', bujeok]]
  for (const g of DUEL_GENERALS.filter((x) => x.role !== 'mob')) list.push([`/samguk/duel/generals/${g.id}`, await duelGeneralMeta({ params: Promise.resolve({ id: g.id }) })])
  list.push(['/samguk/people', await peopleHubMeta()], ['/samguk/people/ranking', await peopleRankingMeta()])
  for (const id of PEOPLE_IDS) list.push([`/samguk/people/${id}`, await personMeta({ params: Promise.resolve({ id }) })])
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

test('관상·동물상·삼국지 설명은 가입 없이·사진 저장 안 함, 동물상은 남녀 따로, 삼국지는 장수 수·회사생활 스탯', () => {
  for (const m of [face2, animal, samguk]) {
    expect(String(m.description)).toContain('가입 없이')
    expect(String(m.description)).toContain('저장하지 않아요')
  }
  expect(String(face2.title)).toContain('AI 관상 테스트')
  expect(String(animal.title)).toMatch(/남녀|남자·여자/)
  expect(String(samguk.title)).toContain(`${samgukCharacters.length}명`)
  expect(String(samguk.title), '실제 검색어(삼국지 인물 테스트)를 제목 앞에 둔다').toMatch(/^삼국지 인물 테스트/)
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

test('삼국지 장수 수 문구는 실제 장수 수와 같다 (옛 52명이 남지 않음)', () => {
  for (const f of ['src/app/samguk/layout.tsx', 'src/app/samguk/(match)/page.tsx', 'src/content/navigation.ts']) {
    const src = readFileSync(f, 'utf8')
    expect(src, f).not.toContain('52명')
    expect(src, f).not.toContain('간신')
  }
  expect(readFileSync('src/content/navigation.ts', 'utf8')).toContain(`${samgukCharacters.length}명`)
})

// 검색 제목 실험(2026-11-11): ESFP·ISFJ·ISFP만 유형 코드를 앞에 둔 제목과 주변 평 설명. 나머지 13유형은 대조군으로 그대로.
const MBTI_HOOK = new Set(['ESFP', 'ISFJ', 'ISFP'])

test('MBTI 16개: 대조군은 "별명 유형 특징·궁합 1위 <1위>", 실험 세 유형은 "유형 별명 특징 | 찰떡 궁합 <1위>"', async () => {
  for (const T of MBTI_TYPES) {
    const m = await mbtiMeta({ params: Promise.resolve({ type: T.toLowerCase() }) })
    const title = String(m.title)
    const desc = String(m.description)
    const best = bestMatches(T, 'love', 1)[0]
    const nick = mbtiProfiles[T].nickname
    if (MBTI_HOOK.has(T)) {
      expect(title.startsWith(`${T} ${nick} 특징 | 찰떡 궁합 ${best}`), `${T}: ${title}`).toBe(true)
      expect(desc, T).toMatch(new RegExp(`^"[^"]+" 소리 자주 듣는 ${T}\\. 연애로 잘 맞는 1위는 ${best}`))
      expect(desc.length, T).toBeLessThanOrEqual(110)
    } else {
      expect(title.startsWith(`${nick} ${T} 특징·궁합 1위 ${best}`), `${T}: ${title}`).toBe(true)
      expect(desc.startsWith(`${nick} ${T}와 연애로 잘 맞는 유형 1위는 ${best}`), `${T}: ${desc}`).toBe(true)
    }
  }
})

test('MBTI 유형 페이지 위쪽에 사진 테스트(/face2) 연결 한 줄', () => {
  const html = renderToStaticMarkup(<MbtiArticle type="ISFP" />)
  expect(html).toContain('내 얼굴은 무슨 상일까')
  expect(html).toContain('href="/face2"')
})

test('/bujeok: 미리보기 이미지는 정지 그림 1200×630(og·twitter 같음), 설명에 옛 다섯 소원 문구·효험 단정 없음', () => {
  const og = bujeok.openGraph as { images?: { url: string; width: number; height: number }[] }
  const tw = bujeok.twitter as { images?: string[] }
  expect(og.images?.[0]).toMatchObject({ url: '/bujeok/og-bujeok.png', width: 1200, height: 630 })
  expect(tw.images).toEqual(['/bujeok/og-bujeok.png'])
  expect(existsSync('public/bujeok/og-bujeok.png')).toBe(true)
  const d = String(bujeok.description)
  expect(d).toContain('소원 11가지')
  expect(d).not.toContain('재물·합격·건강·연애·액막이')
  expect(d).not.toMatch(/반드시|100%|보장|틀림없이/)
})
