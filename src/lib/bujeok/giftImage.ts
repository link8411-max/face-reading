// 선물 보낼 때 같이 가는 부적 그림(채팅에서 바로 보이는 1080×1350 세로 이미지).
// 앞면을 위쪽에 놓고(전통 선물은 도장 없이 — 도장은 받는 사람이 점안에서 찍는다. 귀여운 선물은 이름 도장 태그가 찍혀 있다) 아래에 한글 설명 띠(누구에게·무슨 부적·뜻·사이트)를 넣는다(그림만 받아도 알 수 있게). 이 PNG는 보내는 사람의 공유창·카카오 업로드로만 나가고 우리 서버에는 가지 않는다.
import { estimateCaptionHeight, renderStill, type CaptionLine, type StillFrame } from './wallpaper'
import { WISH_TEXT } from '@/content/bujeok'
import type { BujeokStyle, Finish, Wish } from './keys'

export const GIFT_IMAGE = { w: 1080, h: 1350 } as const
export const GIFT_IMAGE_NAME = 'bujeok.png'

/** 카드 자리(이미지 픽셀). 그림 비율 300:520, 가로 가운데, 아래에 한글 설명 띠 */
export function giftImageLayout(): { x: number; y: number; w: number; h: number } {
  const h = 840
  const w = Math.round((h * 300) / 520)
  return { x: (GIFT_IMAGE.w - w) / 2, y: 60, w, h }
}

/** 설명 띠 자리: 카드 아래, 좌우 여백 80 */
export function giftCaptionBox(): { top: number; left: number; width: number } {
  const c = giftImageLayout()
  return { top: c.y + c.h + 44, left: 80, width: GIFT_IMAGE.w - 160 }
}

/** 그림만 봐도 뜻을 알 수 있게: 1줄 누구에게·무슨 부적, 2줄 한자 뜻풀이, 3줄 사이트 안내(작게) */
export function giftCaption(to: string | null, wish: Wish): CaptionLine[] {
  return [
    { text: to ? `${to}님께 · ${WISH_TEXT[wish].label} 부적` : `${WISH_TEXT[wish].label} 부적`, size: 48, weight: 700, opacity: 0.95, gapBefore: 0 },
    { text: WISH_TEXT[wish].hanjaMeaning, size: 32, weight: 400, opacity: 0.85, gapBefore: 14 },
    { text: 'unse-ai.com · 링크를 열면 손으로 돌려 볼 수 있어요', size: 25, weight: 400, opacity: 0.65, gapBefore: 22 },
  ]
}

export { estimateCaptionHeight }

const frameFor = (to: string | null, wish: Wish): StillFrame => ({ size: GIFT_IMAGE, layout: giftImageLayout(), markSize: 30, caption: { ...giftCaptionBox(), lines: giftCaption(to, wish) } })

/** 화면에 있는 부적 SVG를 선물용 PNG로 만든다(받는 사람 이름이 설명 띠와 도장에 들어간다) */
export const renderGiftImage = (svg: SVGSVGElement, style: BujeokStyle, finish: Finish, wish: Wish, to: string | null): Promise<Blob> => renderStill(svg, style, finish, frameFor(to, wish))
