import type { KakaoFeed } from '@/lib/kakao'
// 선물 그림 공유의 갈림길(순수 함수). 카카오톡: 올라간 그림 주소, 실패·3초 초과면 기존 미리보기 이미지.
export interface KakaoImage { url: string; width: number; height: number }

export const KAKAO_UPLOAD_TIMEOUT_MS = 3000

/** 업로드가 3초 안에 끝나면 그 그림, 실패·시간 초과·없음이면 fallback(기존 OG 이미지) */
export function pickKakaoImage(upload: Promise<KakaoImage | null> | null, fallback: KakaoImage, timeoutMs = KAKAO_UPLOAD_TIMEOUT_MS): Promise<KakaoImage> {
  if (!upload) return Promise.resolve(fallback)
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), timeoutMs)
    upload.then(
      (img) => { clearTimeout(timer); resolve(img ?? fallback) },
      () => { clearTimeout(timer); resolve(fallback) },
    )
  })
}

/** 완성 화면이 뜬 뒤 카드 등장 연출이 끝나길 기다렸다가 그림을 만든다(useScreenshot의 미리 만들기와 같은 방식) */
export const GIFT_PREP_DELAY_MS = 500

/** 카카오 카드 제목. 이름은 보내는 쪽 화면에서만 만든다(해시가 떨어져도 받는 사람이 채팅에서 이름을 본다). GA·서버로는 가지 않는다 */
export function giftCardTitle(to: string | null, wishLabel: string): string {
  return to ? `${to}님께 ${wishLabel} 부적이 도착했어요` : `${wishLabel} 부적이 도착했어요`
}

export const GIFT_CARD_DESCRIPTION = '열어서 손으로 돌려 보세요'
export const GIFT_CARD_BUTTON = '부적 열어 보기'

/** 선물 카카오 피드: 올려 둔 그림(또는 미리보기 이미지), 제목·설명, 선물 주소로 가는 카드 링크와 버튼 */
export function giftKakaoFeed({ to, wishLabel, url, image }: { to: string | null; wishLabel: string; url: string; image: KakaoImage }): KakaoFeed {
  const link = { mobileWebUrl: url, webUrl: url }
  return {
    objectType: 'feed',
    content: { title: giftCardTitle(to, wishLabel), description: GIFT_CARD_DESCRIPTION, imageUrl: image.url, imageWidth: image.width, imageHeight: image.height, link },
    buttons: [{ title: GIFT_CARD_BUTTON, link }],
  }
}
