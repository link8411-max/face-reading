import { renderToStaticMarkup } from 'react-dom/server'
import CastSay from '@/components/cast/CastSay'

test('말풍선: 캐릭터 얼굴(alt·크기), 이름, 대사가 서버 렌더에 있다', () => {
  const html = renderToStaticMarkup(<CastSay lineKey="say.saju.reveal" />)
  expect(html).toContain('src="/images/cast/saja-face.webp"')
  expect(html).toMatch(/alt="저승사자 캐릭터"/)
  expect(html).toContain('width="56"')
  expect(html).toContain('저승사자')
  expect(html).toContain('찾았다. 네 기록은 이렇게 적혀 있어.')
  expect(html).toContain('rounded-[4px_18px_18px_18px]')
})

test('작은 판은 40px이고 영어판은 영어 이름·대사', () => {
  const html = renderToStaticMarkup(<CastSay lineKey="say.animal.reveal" size="sm" locale="en" />)
  expect(html).toContain('width="40"')
  expect(html).toContain('Baekho')
  expect(html).toContain('Found it. This is your pack.')
  expect(html).not.toMatch(/[가-힣]/)
})

test('캐릭터를 지정하지 않으면 키가 정한 캐릭터가 말한다', () => {
  expect(renderToStaticMarkup(<CastSay lineKey="say.face2.reveal" />)).toContain('haetae-face.webp')
  expect(renderToStaticMarkup(<CastSay lineKey="say.animal.start" />)).toContain('tiger-face.webp')
})
