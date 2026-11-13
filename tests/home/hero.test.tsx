import { renderToStaticMarkup } from 'react-dom/server'
import FaceHero from '@/components/home/FaceHero'
import { HOME_HERO } from '@/content/homeHero'
import { t } from '@/lib/i18n/dict'

const html = renderToStaticMarkup(<FaceHero />)
const slides = html.split('data-hero-slide').slice(1)

test('슬라이드 여섯 장이 모두 서버 HTML에 있고 순서가 고정이다', () => {
  expect(HOME_HERO.map((s) => s.href)).toEqual(['/saju', '/face-match', '/face2', '/animal', '/exam/meme', '/bujeok'])
  expect(slides).toHaveLength(6)
  expect(html).toContain('1 / 6')
})

test('첫 장 그림만 높은 우선순위, 나머지 다섯 장은 lazy', () => {
  expect(slides[0]).toContain('fetchPriority="high"')
  expect(slides[0]).not.toContain('loading="lazy"')
  for (const s of slides.slice(1)) {
    expect(s).toContain('loading="lazy"')
    expect(s).not.toContain('fetchPriority')
  }
})

test('각 장은 링크이고 제목(h2)·대사·버튼 문구와 alt·크기가 있다', () => {
  HOME_HERO.forEach((s, i) => {
    expect(slides[i]).toContain(`href="${s.href}"`)
    expect(slides[i]).toContain('<h2')
    for (const k of [s.titleKey, s.sayKey, s.ctaKey]) expect(slides[i], k).toContain(t('ko', k).replace(/&/g, '&amp;'))
    expect(slides[i]).toMatch(/alt="[^"]+ 캐릭터"/)
    expect(slides[i]).toContain('width="720"')
    expect(slides[i]).toContain('height="960"')
  })
})

test('순위 표시가 없다', () => {
  expect(html).not.toMatch(/TOP|위\b/)
})

test('영어판은 열려 있는 세 장만', () => {
  const en = renderToStaticMarkup(<FaceHero locale="en" />)
  expect(en.split('data-hero-slide').length - 1).toBe(3)
  expect(en).toContain('href="/en/face2"')
  expect(en).toContain('1 / 3')
})
