import { renderToStaticMarkup } from 'react-dom/server'
import Zodiac2027Article from '@/components/Zodiac2027Article'
import MbtiArticle from '@/components/mbti/MbtiArticle'
import ArticleShare from '@/components/share/ArticleShare'
import ContentCta from '@/components/ContentCta'

const COPY = '사진 한 장이면 관상 풀이가 1분 안에 나와요. 사진은 저장하지 않아요.'

test('띠 글: 분기별 흐름 뒤에 관상 CTA, 한마디 조언 뒤에 공유 버튼, 쿠팡·시즌 추천보다 앞', () => {
  const html = renderToStaticMarkup(<Zodiac2027Article slug="horse" />)
  const cta = html.indexOf('말띠인 내 얼굴은 무슨 상일까?')
  expect(cta).toBeGreaterThan(html.indexOf('분기별 흐름'))
  expect(cta).toBeLessThan(html.indexOf('자주 묻는 질문'))
  expect(html).toContain('href="/face2"')
  expect(html).toContain('내 관상 보기')
  expect(html).toContain(COPY)
  const share = html.indexOf('공유하기')
  expect(share).toBeGreaterThan(html.indexOf('한마디 조언'))
  expect(share).toBeLessThan(html.indexOf('자주 묻는 질문'))
  expect(share).toBeLessThan(html.indexOf('MBTI 궁합도 보기'))
})

test('MBTI 글: 연애 스타일 뒤에 관상 CTA, 직업 뒤에 공유 버튼, 쿠팡보다 앞', () => {
  const html = renderToStaticMarkup(<MbtiArticle type="ISFP" />)
  const cta = html.indexOf('ISFP인 내 얼굴은 무슨 상일까?')
  expect(cta).toBeGreaterThan(html.indexOf('ISFP의 연애 스타일'))
  expect(cta).toBeLessThan(html.indexOf('자주 묻는 질문'))
  expect(html).toContain(COPY)
  const share = html.indexOf('공유하기')
  expect(share).toBeGreaterThan(html.indexOf('ISFP에게 어울리는 직업'))
  expect(share).toBeLessThan(html.indexOf('자주 묻는 질문'))
})

test('ContentCta는 no-screenshot 카드와 주 버튼 링크', () => {
  const html = renderToStaticMarkup(<ContentCta href="/x" title="T" desc="D" label="L" />)
  expect(html).toContain('no-screenshot')
  expect(html).toContain('href="/x"')
  expect(html).toContain('rounded-full')
})

test('ArticleShare는 공유하기 버튼 하나만 그린다', () => {
  const html = renderToStaticMarkup(<ArticleShare testName="zodiac" title="t" text="x" url="https://unse-ai.com/a" imageUrl="https://unse-ai.com/i.png" />)
  expect(html).toContain('공유하기')
  expect(html.match(/<button/g)).toHaveLength(1)
  expect(html).not.toContain('role="status"')
})
