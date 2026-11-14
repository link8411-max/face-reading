import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import TestHeader from '@/components/test/TestHeader'
import CastHero from '@/components/cast/CastHero'
import ResultPreview from '@/components/test/ResultPreview'
import Face2Page from '@/app/(ko)/face2/page'
import AnimalTypePage from '@/app/(ko)/animal/page'
import SajuClient from '@/app/(ko)/saju/SajuClient'
import FaceMatchPage from '@/app/(ko)/face-match/page'
import ExamMemePage from '@/app/(ko)/exam/meme/page'
import FortuneClient from '@/app/(ko)/fortune/FortuneClient'
import DailyPage from '@/app/(ko)/fortune/daily/page'
import MbtiHub from '@/app/(ko)/mbti/page'
import { UI } from '@/content/ko/ui'
import { ANIMAL_KEYS } from '@/lib/animal/matcher'
import { GUANSANG_TYPE_KEYS } from '@/lib/face/guansangKeys'
import { MBTI_TYPES } from '@/lib/mbti/compat'
import { animalTypeDB } from '@/lib/animalTypeDB'
import { GUANSANG_TYPES } from '@/content/guansang'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: () => {}, replace: () => {}, back: () => {} }), usePathname: () => '/', useSearchParams: () => new URLSearchParams() }))

const imgs = (html: string) => html.match(/<img [^>]*>/g) ?? []
const noop = () => {}

test('CastHero: 왼쪽 캐릭터 3:4 카드(alt·크기·eager·높은 우선순위) + 오른쪽 제목(h2)·말풍선(11/14 첫 화면에 버튼이 들어오게)', () => {
  const html = renderToStaticMarkup(<CastHero cast="haetae" lineKey="say.face2.start" heading={'얼굴로 보는\n내 관상'} />)
  const big = imgs(html).find((i) => i.includes('/images/cast/haetae.webp')) ?? ''
  expect(big).toContain('alt="해태 캐릭터"')
  expect(big).toContain('width="720"')
  expect(big).toContain('height="960"')
  expect(big).toContain('fetchPriority="high"')
  expect(big).not.toContain('loading="lazy"')
  expect(html).toContain('w-[112px] aspect-[3/4]')
  expect(html).toMatch(/<h2[^>]*>얼굴로 보는\n내 관상<\/h2>/)
  expect(html.indexOf('<h2')).toBeLessThan(html.indexOf(UI['say.face2.start']))
  expect(renderToStaticMarkup(<CastHero cast="haetae" lineKey="say.face2.start" />)).not.toContain('<h2')
})

test('TestHeader: cast가 있으면 h1과 캐릭터 그림·대사, 없으면 그림이 없다', () => {
  const on = renderToStaticMarkup(<TestHeader title="무료 관상" onBack={noop} backLabel="돌아가기" cast={{ cast: 'tiger', line: 'say.animal.start' }} />)
  expect(on).toMatch(/<h1[^>]*>무료 관상<\/h1>/)
  expect(on).toContain('/images/cast/tiger.webp')
  expect(on).toContain(UI['say.animal.start'])
  const off = renderToStaticMarkup(<TestHeader title="무료 관상" onBack={noop} backLabel="돌아가기" />)
  expect(off).not.toContain('/images/cast/')
})

test('ResultPreview: 제목과 카드(그림은 모두 lazy, 크기·alt)', () => {
  const html = renderToStaticMarkup(<ResultPreview title="이 중에 너는?" items={[{ key: 'a', src: '/images/animal/dog-f.webp', name: '강아지상' }, { key: 'b', src: '/images/animal/cat-f.webp', name: '고양이상' }]} />)
  expect(html).toContain('이 중에 너는?')
  const ims = imgs(html)
  expect(ims).toHaveLength(2)
  for (const i of ims) {
    expect(i).toContain('loading="lazy"')
    expect(i).toContain('width="720"')
    expect(i).toContain('height="960"')
  }
  expect(ims[0]).toContain('alt="강아지상"')
  expect(html).toContain('grid-cols-3')
})

const previewImgs = (html: string) => imgs(html).filter((i) => /\/images\/(animal|face)\/[a-z-]+-[fm]\.webp/.test(i))

test('/animal 시작 화면: h1, 백호 말풍선, 13종 미리 보기(여 그림, 모두 lazy)가 서버 HTML에 있다', () => {
  const html = renderToStaticMarkup(<AnimalTypePage />)
  expect(html).toMatch(/<h1[^>]*>[^<]+<\/h1>/)
  expect(html).toContain(UI['say.animal.start'])
  expect(html).toContain('/images/cast/tiger.webp')
  const pv = previewImgs(html)
  expect(pv).toHaveLength(13)
  for (const k of ANIMAL_KEYS) expect(pv.some((i) => i.includes(`/images/animal/${k}-f.webp`) && i.includes(`alt="${animalTypeDB[k].name}"`)), k).toBe(true)
  for (const i of pv) expect(i).toContain('loading="lazy"')
})

test('/face2 시작 화면: h1, 해태 말풍선, 15유형 별명 미리 보기', () => {
  const html = renderToStaticMarkup(<Face2Page />)
  expect(html).toMatch(/<h1[^>]*>[^<]+<\/h1>/)
  expect(html).toContain(UI['say.face2.start'])
  const pv = previewImgs(html)
  expect(pv).toHaveLength(15)
  for (const k of GUANSANG_TYPE_KEYS) expect(pv.some((i) => i.includes(`/images/face/${k}-f.webp`) && i.includes(`alt="${GUANSANG_TYPES[k].nickname}"`)), k).toBe(true)
  for (const i of pv) expect(i).toContain('loading="lazy"')
  // 하얀 웃는 얼굴 그림 대신 사진 아이콘
  expect(html).not.toContain('fill="#F7F8FC"')
})

test('/saju 시작 화면: h1, 저승사자 말풍선, 진행 표시 "질문 1 / 3", 첫 단계(양력·음력, 생년월일)만', () => {
  const html = renderToStaticMarkup(<SajuClient />)
  expect(html).toMatch(/<h1[^>]*>내 사주 풀이<\/h1>/)
  expect(html).toContain(UI['say.saju.start'])
  expect(html).toContain('aria-label="질문 1 / 3"')
  expect(html).toContain('다음으로')
  expect(html).toContain('양력')
  expect(html).not.toContain('saju-hour')
  expect(html).not.toContain('내 사주 보기')
})

test('/face-match 시작 화면: 구미호 말풍선이 제목 위에, h1·제목은 그대로', () => {
  const html = renderToStaticMarkup(<FaceMatchPage />)
  expect(html).toMatch(/<h1[^>]*>얼굴 궁합 테스트<\/h1>/)
  expect(html).toContain(UI['say.faceMatch.start'])
  expect(html.indexOf('/images/cast/gumiho.webp')).toBeLessThan(html.indexOf('우리 둘,'))
})

test('/exam/meme: 도깨비 말풍선이 서버 HTML에 있다', () => {
  const html = renderToStaticMarkup(<ExamMemePage />)
  expect(html).toContain('<h1')
  expect(html).toContain(UI['say.exam.start'])
  expect(html).toContain('/images/cast/dokkaebi.webp')
})

test('/fortune 저승사자 선배, /fortune/daily 저승사자 막내 말풍선', () => {
  const y = renderToStaticMarkup(<FortuneClient />)
  expect(y).toContain('/images/cast/sajaElder.webp')
  expect(y).toContain(UI['say.fortuneYear.start'])
  const d = renderToStaticMarkup(<DailyPage />)
  expect(d).toContain('/images/cast/sajaF.webp')
  expect(d).toContain(UI['say.today.start'])
})

test('/mbti 허브: 구미호 말풍선과 16명 얼굴 격자(4열, 각 유형 링크)', () => {
  const html = renderToStaticMarkup(<MbtiHub />)
  expect(html).toContain(UI['say.mbti.hub'])
  expect(html).toContain('/images/cast/gumiho-face.webp')
  expect(html).toContain('grid-cols-4')
  for (const t of MBTI_TYPES) {
    const l = t.toLowerCase()
    expect(html, t).toContain(`href="/mbti/${l}"`)
    expect(html, t).toContain(`/images/mbti/${l}-face.webp`)
  }
  expect(html.indexOf(UI['say.mbti.hub'])).toBeLessThan(html.indexOf('/images/mbti/intj-face.webp'))
})

test('시작 화면이 쓰는 새 대사 세 개는 올바른 캐릭터가 말한다', () => {
  const lines = readFileSync('src/content/castLines.ts', 'utf8')
  expect(lines).toContain("'say.today.start': 'sajaF'")
  expect(lines).toContain("'say.fortuneYear.start': 'sajaElder'")
  expect(lines).toContain("'say.mbti.hub': 'gumiho'")
})
