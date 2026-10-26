import { renderToStaticMarkup } from 'react-dom/server'
import ResultCard from '@/components/result/ResultCard'
import ResultActions from '@/components/result/ResultActions'

const card = {
  eyebrow: '재물상', title: '타고난 재물상', summary: '요약 한 줄',
  bars: [{ label: '재물운', value: 90 }, { label: '애정운', value: 80 }, { label: '대인운', value: 70 }],
  reasons: [{ label: '눈', text: '맑은 눈' }, { label: '입', text: '올라간 입꼬리' }],
}

test('결과 카드: 제목, 막대 3개, 근거 2줄, 워터마크(운명을 읽다 · unse-ai.com)', () => {
  const html = renderToStaticMarkup(<ResultCard {...card} />)
  expect(html).toContain('타고난 재물상')
  expect(html.match(/role="meter"/g)).toHaveLength(3)
  expect(html).toContain('aria-valuenow="90"')
  expect(html).toContain('맑은 눈')
  expect(html).toContain('올라간 입꼬리')
  expect(html).toContain('운명을 읽다')
  expect(html).toContain('unse-ai.com')
  expect(html).not.toMatch(/\p{Extended_Pictographic}/u)
})

test('결과 카드: 막대 대신 칩도 쓸 수 있다(동물상)', () => {
  const html = renderToStaticMarkup(<ResultCard {...card} bars={undefined} chips={['친근함', '활발함', '낙천적']} />)
  expect(html).not.toContain('role="meter"')
  expect(html).toContain('활발함')
})

test('결과 버튼: 1순위 공유하기(기본 공유창), 그다음 이미지 저장·다시하기', () => {
  const html = renderToStaticMarkup(<ResultActions onShare={() => {}} onSave={() => {}} onRetry={() => {}} busy={false} notice={null} />)
  const order = ['공유하기', '이미지 저장', '다시하기'].map((t) => html.indexOf(t))
  expect(order.every((i) => i > 0)).toBe(true)
  expect([...order].sort((a, b) => a - b)).toEqual(order)
  expect(html).not.toContain('스토리')
  expect(html).not.toContain('친구 얼굴이랑 궁합') // 8단계 전까지 숨김
})

import { saveMethod } from '@/lib/saveImage'
test('저장 방법: iOS(사파리·인앱)는 길게 눌러 저장 화면, 그 밖엔 다운로드 (리뷰)', () => {
  expect(saveMethod('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) KAKAOTALK 10.0')).toBe('modal')
  expect(saveMethod('Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) Safari')).toBe('modal')
  expect(saveMethod('Mozilla/5.0 (Linux; Android 14) Chrome/120')).toBe('download')
  expect(saveMethod('Mozilla/5.0 (Macintosh) Chrome/120')).toBe('download')
})
