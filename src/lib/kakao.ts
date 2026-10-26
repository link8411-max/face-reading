// 카카오톡 공유 (Kakao SDK for JavaScript). 카톡 인앱 브라우저는 기기 공유창(navigator.share)이 없어서
// 카톡 안에서는 카카오톡 공유 화면으로 바로 보낸다. 앱: 카카오디벨로퍼스 "운명을 읽다"(ID 1623598)
// JavaScript 키는 공개 값이고, 등록한 도메인(https://unse-ai.com, http://localhost:3200)에서만 동작한다.
export const KAKAO_JS_KEY = 'fb47565faa13bd3ae4861d909b1c830c'
const SDK_URL = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js'
const SDK_INTEGRITY = 'sha384-DKYJZ8NLiK8MN4/C5P2dtSmLQ4KwPaoqAfyA/DfmEc1VDxu4yyC7wy6K1Hs90nka'

export interface KakaoShareMeta { title: string; text: string; url: string; imageUrl: string }

type KakaoSDK = {
  isInitialized: () => boolean
  init: (key: string) => void
  Share: { sendDefault: (template: ReturnType<typeof kakaoFeed>) => void }
}

export function isKakaoInApp(userAgent: string): boolean {
  return /KAKAOTALK/i.test(userAgent)
}

// 피드 템플릿: 1인칭 문구, 결과 미리보기 이미지(1200×630), 결과 링크, "나도 해보기" 버튼
export function kakaoFeed(m: KakaoShareMeta) {
  const link = { mobileWebUrl: m.url, webUrl: m.url }
  return {
    objectType: 'feed' as const,
    content: { title: m.text, description: m.title, imageUrl: m.imageUrl, imageWidth: 1200, imageHeight: 630, link },
    buttons: [{ title: '나도 해보기', link }],
  }
}

let loading: Promise<KakaoSDK | null> | null = null

export function loadKakao(): Promise<KakaoSDK | null> {
  const w = globalThis as unknown as { window?: Window & { Kakao?: KakaoSDK } }
  if (!w.window) return Promise.resolve(null)
  if (w.window.Kakao) return Promise.resolve(init(w.window.Kakao))
  if (!loading) {
    loading = new Promise((resolve) => {
      const s = document.createElement('script')
      s.src = SDK_URL
      s.integrity = SDK_INTEGRITY
      s.crossOrigin = 'anonymous'
      s.async = true
      s.onload = () => resolve(w.window!.Kakao ? init(w.window!.Kakao) : null)
      s.onerror = () => { loading = null; resolve(null) }
      document.head.appendChild(s)
      setTimeout(() => resolve(null), 8000)
    })
  }
  return loading
}

function init(k: KakaoSDK): KakaoSDK | null {
  try {
    if (!k.isInitialized()) k.init(KAKAO_JS_KEY)
    return k
  } catch {
    return null
  }
}

// 카카오톡 공유 화면을 연다. SDK를 못 불러오거나 실패하면 false (호출 쪽이 링크 공유·복사로 넘어간다)
export async function shareKakao(m: KakaoShareMeta): Promise<boolean> {
  const k = await loadKakao()
  if (!k) return false
  try {
    k.Share.sendDefault(kakaoFeed(m))
    return true
  } catch {
    return false
  }
}
