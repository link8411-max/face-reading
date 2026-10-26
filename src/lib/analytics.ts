// GA4 이벤트 (측정 ID는 공개 값). 채널별 유입이 실제로 테스트를 끝까지 하는지 보기 위한 최소 이벤트만 보낸다.
// 개인정보 원칙: 사진·생년월일 원값·얼굴 수치는 절대 보내지 않는다. 결과는 유형 키(fox, caocao, 재물상, INFP_ENTJ 등)만.
export const GA_ID = 'G-L99JPMPT9D'

export type TestName = 'face' | 'animal' | 'samguk' | 'fortune' | 'daily' | 'mbti_match'
export type ShareMethod = 'story' | 'save_image' | 'share'

type Events = {
  test_start: { test_name: TestName }
  photo_selected: { test_name: TestName }
  result_view: { test_name: TestName; result_id?: string }
  share_click: { test_name: TestName; method: ShareMethod }
  fortune_submit: { test_name: TestName }
}

const ALLOWED_KEYS = new Set(['test_name', 'result_id', 'method'])
// 유형 키만 통과: 영문·숫자·밑줄·한글 1~24자, 숫자 4자리 이상 연속(연도·날짜)은 막는다
const SAFE_VALUE = /^[A-Za-z0-9_가-힣]{1,24}$/
const safe = (v: unknown) => typeof v === 'string' && SAFE_VALUE.test(v) && !/\d{4,}/.test(v)

export function track<E extends keyof Events>(event: E, params: Events[E]) {
  const gtag = (globalThis as { window?: { gtag?: (...a: unknown[]) => void } }).window?.gtag
  if (typeof gtag !== 'function') return
  const clean: Record<string, string> = {}
  for (const [k, v] of Object.entries(params)) if (ALLOWED_KEYS.has(k) && safe(v)) clean[k] = v as string
  gtag('event', event, clean)
}
