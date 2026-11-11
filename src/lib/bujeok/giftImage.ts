// 선물 보낼 때 같이 가는 부적 그림(채팅에서 바로 보이는 1080×1350 세로 이미지).
// 앞면(이름 도장 포함)을 가운데에 놓고 잠금화면과 같은 바탕·워터마크를 쓴다. 이 PNG는 보내는 사람의 공유창·카카오 업로드로만 나가고 우리 서버에는 가지 않는다.
import { renderStill, type StillFrame } from './wallpaper'
import type { BujeokStyle, Finish } from './keys'

export const GIFT_IMAGE = { w: 1080, h: 1350 } as const
export const GIFT_IMAGE_NAME = 'bujeok.png'

/** 카드 자리(이미지 픽셀). 그림 비율 300:520, 가로 가운데, 아래에 워터마크 자리 */
export function giftImageLayout(): { x: number; y: number; w: number; h: number } {
  const h = 1000
  const w = Math.round((h * 300) / 520)
  return { x: (GIFT_IMAGE.w - w) / 2, y: 100, w, h }
}

const FRAME: StillFrame = { size: GIFT_IMAGE, layout: giftImageLayout(), markTop: GIFT_IMAGE.h - 130, markSize: 30 }

/** 화면에 있는 부적 SVG를 선물용 PNG로 만든다 */
export const renderGiftImage = (svg: SVGSVGElement, style: BujeokStyle, finish: Finish = 'paper'): Promise<Blob> => renderStill(svg, style, finish, FRAME)
