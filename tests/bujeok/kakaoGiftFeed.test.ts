import { expect, test } from 'vitest'
import { giftCardTitle, giftKakaoFeed, type KakaoImage } from '@/lib/bujeok/giftShare'
import { bujeokGiftUrl, bujeokOgUrl } from '@/lib/bujeok/link'
import type { BujeokSpec } from '@/lib/bujeok/keys'

const spec: BujeokSpec = { style: 'trad', wish: 'pass', el: 'metal', variant: 1, finish: 'gold' }
const IMG: KakaoImage = { url: 'https://img1.kakaocdn.net/a/original.png', width: 1080, height: 1350 }
const OG: KakaoImage = { url: bujeokOgUrl(spec), width: 1200, height: 630 }

test('제목: 이름이 있으면 "<이름>님께 <소원> 부적이 도착했어요", 없으면 이름 없이', () => {
  expect(giftCardTitle('민지', '합격')).toBe('민지님께 합격 부적이 도착했어요')
  expect(giftCardTitle(null, '합격')).toBe('합격 부적이 도착했어요')
})

test('피드: 설명·버튼 이름·이미지, 링크(content.link와 버튼)는 모두 선물 주소', () => {
  const url = bujeokGiftUrl(spec, { to: '민지', from: '철수' })
  const f = giftKakaoFeed({ to: '민지', wishLabel: '합격', url, image: IMG })
  expect(f.objectType).toBe('feed')
  expect(f.content.title).toBe('민지님께 합격 부적이 도착했어요')
  expect(f.content.description).toBe('열어서 손으로 돌려 보세요')
  expect(f.content.imageUrl).toBe(IMG.url)
  expect(f.content.imageWidth).toBe(1080)
  expect(f.content.imageHeight).toBe(1350)
  expect(f.content.link).toEqual({ webUrl: url, mobileWebUrl: url })
  expect(f.buttons).toEqual([{ title: '부적 열어 보기', link: { webUrl: url, mobileWebUrl: url } }])
  expect(url).toContain('#to=') // 해시는 그대로 둔다
})

test('이름이 없으면 제목에 이름이 없다', () => {
  const f = giftKakaoFeed({ to: null, wishLabel: '재물', url: 'https://unse-ai.com/bujeok/r/x', image: OG })
  expect(f.content.title).toBe('재물 부적이 도착했어요')
  expect(f.content.imageUrl).toBe(OG.url)
  expect(f.content.imageWidth).toBe(1200)
})
