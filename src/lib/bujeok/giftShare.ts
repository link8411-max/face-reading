import type { KakaoFeed } from '@/lib/kakao'
// 선물 그림 공유의 갈림길(순수 함수). 카카오톡: 올라간 그림 주소, 실패·아직 안 올라갔으면 기존 미리보기 이미지.
// 누른 뒤 오래 기다리면 폰 브라우저가 카카오톡 열기를 막을 수 있어(사용자 동작이 끊김) 아주 짧게만 기다린다.
// 그림은 완성 화면이 뜨자마자 올리기 시작하므로 보통은 누르기 전에 끝나 있다.
export interface KakaoImage { url: string; width: number; height: number }

export const KAKAO_UPLOAD_TIMEOUT_MS = 300

/** 업로드가 KAKAO_UPLOAD_TIMEOUT_MS 안에 끝나면 그 그림, 실패·시간 초과·없음이면 fallback(기존 OG 이미지) */
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
