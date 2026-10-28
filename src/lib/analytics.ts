// GA4 이벤트 (측정 ID는 공개 값). 채널별 유입이 실제로 테스트를 끝까지 하는지 보기 위한 최소 이벤트만 보낸다.
// 개인정보 원칙: 사진·생년월일 원값·얼굴 수치는 절대 보내지 않는다. 결과는 유형 키(fox, caocao, 재물상, INFP_ENTJ 등)만.
export const GA_ID = 'G-L99JPMPT9D'

export type TestName = 'face' | 'animal' | 'samguk' | 'fortune' | 'daily' | 'mbti_match' | 'face_match' | 'team_samguk' | 'mbti_daily' | 'duel'
export type ShareMethod = 'save_image' | 'share' | 'link' | 'kakao'

type Events = {
  test_start: { test_name: TestName }
  photo_selected: { test_name: TestName }
  result_view: { test_name: TestName; result_id?: string }
  share_click: { test_name: TestName; method: ShareMethod }
  fortune_submit: { test_name: TestName }
  shared_landing: { test_name: TestName; result_id?: string }
  coupang_click: { slot: string; keyword: string }
  coupang_banner_view: { slot: string }
  next_test_click: { test_name: TestName }
}

const ALLOWED_KEYS = new Set(['test_name', 'result_id', 'method', 'slot', 'keyword'])
// 유형 키만 통과: 영문·숫자·밑줄·한글 1~24자, 숫자 4자리 이상 연속(연도·날짜)은 막는다
const SAFE_VALUE = /^[A-Za-z0-9_가-힣]{1,24}$/
export const isSafeValue = (v: unknown) => typeof v === 'string' && SAFE_VALUE.test(v) && !/\d{4,}/.test(v)
const safe = isSafeValue

// 실제 통계는 운영 주소에서만 보낸다 (로컬·Vercel 미리보기 배포는 dataLayer에만 쌓임). layout.tsx의 ga4-init 스크립트가 이 식을 쓴다
export const PROD_HOST_SOURCE = '^(www\\.)?unse-ai\\.com$'
export const isProdHost = (host: string) => new RegExp(PROD_HOST_SOURCE).test(host)

type Gtag = (...a: unknown[]) => void
const getGtag = () => (globalThis as { window?: { gtag?: Gtag } }).window?.gtag

// GA 초기화 스크립트(afterInteractive)보다 먼저 나는 이벤트(첫 화면 착지 등)는 잠시 모아 두었다가 보낸다
const pending: [string, Record<string, string>][] = []
let flushTries = 0
function flushLater() {
  if (flushTries > 0) return
  const tick = () => {
    const gtag = getGtag()
    if (typeof gtag === 'function') {
      for (const [e, p] of pending.splice(0)) gtag('event', e, p)
      flushTries = 0
      return
    }
    if (++flushTries > 50) { pending.length = 0; flushTries = 0; return } // 약 10초 뒤 포기(광고·추적 차단)
    setTimeout(tick, 200)
  }
  flushTries = 1
  setTimeout(tick, 200)
}

export function track<E extends keyof Events>(event: E, params: Events[E]) {
  if (!(globalThis as { window?: unknown }).window) return
  const clean: Record<string, string> = {}
  for (const [k, v] of Object.entries(params)) if (ALLOWED_KEYS.has(k) && safe(v)) clean[k] = v as string
  const gtag = getGtag()
  if (typeof gtag === 'function') { gtag('event', event, clean); return }
  pending.push([event, clean])
  flushLater()
}
