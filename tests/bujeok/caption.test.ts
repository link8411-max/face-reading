import { expect, test } from 'vitest'
import { GIFT_IMAGE, giftCaption, giftCaptionBox, giftImageLayout, estimateCaptionHeight } from '@/lib/bujeok/giftImage'
import { WALLPAPER, wallpaperCaption, wallpaperLayout, WATERMARK } from '@/lib/bujeok/wallpaper'
import { WISH_TEXT } from '@/content/bujeok'
import { WISHES } from '@/lib/bujeok/keys'

test('선물 그림 설명 띠: 이름 있으면 "<이름>님께 · <소원> 부적", 둘째 줄은 한자 뜻, 셋째 줄은 작은 안내', () => {
  const l = giftCaption('민지', 'pass')
  expect(l.map((x) => x.text)).toEqual([
    '민지님께 · 합격 부적',
    WISH_TEXT.pass.hanjaMeaning,
    'unse-ai.com · 링크를 열면 손으로 돌려 볼 수 있어요',
  ])
  expect(l[0].size).toBeGreaterThan(l[1].size)
  expect(l[1].size).toBeGreaterThan(l[2].size)
})

test('선물 그림 설명 띠: 이름이 없으면 "<소원> 부적"만', () => {
  expect(giftCaption(null, 'money')[0].text).toBe('재물 부적')
})

test('설명 띠는 카드 아래·그림 안쪽에 들어가고(여백 유지), 가장 긴 이름·가장 긴 뜻풀이에서도 넘치지 않는다', () => {
  const card = giftImageLayout()
  const box = giftCaptionBox()
  expect(box.top).toBeGreaterThanOrEqual(card.y + card.h)
  expect(box.left).toBeGreaterThanOrEqual(60)
  expect(box.left + box.width).toBeLessThanOrEqual(GIFT_IMAGE.w - 60)
  for (const w of WISHES) {
    const h = estimateCaptionHeight(giftCaption('가나다라마바사아', w), box.width) // 이름 최대 8자
    expect(box.top + h).toBeLessThanOrEqual(GIFT_IMAGE.h - 40)
  }
})

test('잠금화면: 이름 없이 "<소원> 부적" 한 줄이 카드 아래·워터마크 위에 들어간다', () => {
  const l = wallpaperCaption('pass')
  expect(l.lines.map((x) => x.text)).toEqual(['합격 부적'])
  const card = wallpaperLayout()
  expect(l.top).toBeGreaterThanOrEqual(card.y + card.h)
  expect(l.top + estimateCaptionHeight(l.lines, WALLPAPER.w - 160)).toBeLessThan(WALLPAPER.h - 150) // 워터마크(h-150) 위
  expect(WATERMARK).toContain('unse-ai.com')
  for (const w of WISHES) expect(wallpaperCaption(w).lines[0].text).toBe(`${WISH_TEXT[w].label} 부적`)
})
