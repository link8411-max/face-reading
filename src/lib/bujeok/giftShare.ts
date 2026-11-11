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
