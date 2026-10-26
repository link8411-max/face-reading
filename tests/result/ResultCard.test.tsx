import { renderToStaticMarkup } from 'react-dom/server'
import ResultCard from '@/components/result/ResultCard'
import ResultActions from '@/components/result/ResultActions'
import { shareOrSave, STORY_SAVED_NOTICE } from '@/lib/storyShare'

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

test('결과 버튼: 1순위 스토리에 올리기, 그다음 이미지 저장·다시하기', () => {
  const html = renderToStaticMarkup(<ResultActions onStory={() => {}} onSave={() => {}} onRetry={() => {}} busy={false} notice={null} />)
  const order = ['스토리에 올리기', '이미지 저장', '다시하기'].map((t) => html.indexOf(t))
  expect(order.every((i) => i > 0)).toBe(true)
  expect([...order].sort((a, b) => a - b)).toEqual(order)
  expect(html).not.toContain('친구 얼굴이랑 궁합') // 8단계 전까지 숨김
})

describe('shareOrSave: 스토리 공유는 지원되면 공유, 아니면 저장 후 안내', () => {
  const file = new File([new Uint8Array([1])], 'a.png', { type: 'image/png' })

  test('파일 공유 지원 → shared, 저장 안 함', async () => {
    const shared: File[][] = []
    const save = vi.fn()
    const out = await shareOrSave(file, save, { canShare: () => true, share: async (d: ShareData) => { shared.push(d.files!) } })
    expect(out).toBe('shared')
    expect(shared[0][0].type).toBe('image/png')
    expect(save).not.toHaveBeenCalled()
  })

  test('미지원 → 저장 후 saved', async () => {
    const save = vi.fn()
    expect(await shareOrSave(file, save, { canShare: () => false, share: async () => {} })).toBe('saved')
    expect(save).toHaveBeenCalledOnce()
    expect(await shareOrSave(file, save, undefined)).toBe('saved')
  })

  test('사용자가 취소(AbortError) → cancelled, 저장하지 않음', async () => {
    const save = vi.fn()
    const abort = Object.assign(new Error('x'), { name: 'AbortError' })
    expect(await shareOrSave(file, save, { canShare: () => true, share: async () => { throw abort } })).toBe('cancelled')
    expect(save).not.toHaveBeenCalled()
  })

  test('공유 중 다른 오류 → 저장으로 대체', async () => {
    const save = vi.fn()
    expect(await shareOrSave(file, save, { canShare: () => true, share: async () => { throw new Error('NotAllowed') } })).toBe('saved')
    expect(save).toHaveBeenCalledOnce()
  })

  test('안내 문구', () => {
    expect(STORY_SAVED_NOTICE).toContain('스토리')
  })
})

import { saveMethod } from '@/lib/saveImage'
test('저장 방법: iOS(사파리·인앱)는 길게 눌러 저장 화면, 그 밖엔 다운로드 (리뷰)', () => {
  expect(saveMethod('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) KAKAOTALK 10.0')).toBe('modal')
  expect(saveMethod('Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) Safari')).toBe('modal')
  expect(saveMethod('Mozilla/5.0 (Linux; Android 14) Chrome/120')).toBe('download')
  expect(saveMethod('Mozilla/5.0 (Macintosh) Chrome/120')).toBe('download')
})
