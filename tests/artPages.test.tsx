import { renderToStaticMarkup } from 'react-dom/server'
import MbtiArticle from '@/components/mbti/MbtiArticle'
import Zodiac2027Article from '@/components/Zodiac2027Article'
import Zodiac2027Hub from '@/app/(ko)/fortune/2027/page'
import MbtiDailyCard from '@/components/mbti/MbtiDailyCard'
import { mbtiDaily } from '@/lib/mbti/daily'
import { MBTI_TYPES } from '@/lib/mbti/compat'
import { ZODIAC_SLUGS } from '@/content/fortune2027Zodiac'
import { UI } from '@/content/ko/ui'

const imgs = (html: string) => html.match(/<img [^>]*>/g) ?? []

test.each(MBTI_TYPES)('/mbti/%s: 서버 HTML에 유형 그림(alt·크기)과 h1이 있다', (t) => {
  const html = renderToStaticMarkup(<MbtiArticle type={t} />)
  const big = imgs(html).find((i) => i.includes(`/images/mbti/${t.toLowerCase()}.webp`)) ?? ''
  expect(big).toMatch(new RegExp(`alt="${t} [^"]+ 캐릭터"`))
  expect(big).toContain('width="720"')
  expect(big).toContain('height="960"')
  expect(html).toMatch(new RegExp(`<h1[^>]*>${t}</h1>`))
})

test.each(ZODIAC_SLUGS)('/fortune/2027/%s: 남녀 두 장과 박수무당 말풍선이 서버 HTML에 있다', (slug) => {
  const html = renderToStaticMarkup(<Zodiac2027Article slug={slug} />)
  for (const g of ['f', 'm']) {
    const im = imgs(html).find((i) => i.includes(`/images/zodiac/${slug}-${g}.webp`)) ?? ''
    expect(im, `${slug}-${g}`).toMatch(/alt="[^"]+띠 (여성|남성) 캐릭터"/)
    expect(im).toContain('width="720"')
    expect(im).toContain('height="960"')
  }
  expect(html).toContain('박수무당 캐릭터')
  expect(html).toContain(UI['say.zodiac.intro'])
  expect(html).toContain('<h1')
})

test('/fortune/2027 허브: 띠 12개 얼굴과 저승사자 선배 말풍선', () => {
  const html = renderToStaticMarkup(<Zodiac2027Hub />)
  for (const s of ZODIAC_SLUGS) expect(html).toContain(`/images/zodiac/${s}-f-face.webp`)
  expect(html).toContain('저승사자 선배 캐릭터')
  expect(html).toContain(UI['say.zodiac2027.hub'])
})

test('오늘의 MBTI 운세 카드에 그 유형 얼굴이 있다', () => {
  const html = renderToStaticMarkup(<MbtiDailyCard type="INFP" date="2026-11-14" daily={mbtiDaily('INFP', '2026-11-14')} />)
  expect(html).toContain('/images/mbti/infp-face.webp')
  expect(html).toContain('alt="INFP 캐릭터"')
})
