// 결과 미리보기 이미지(/api/og/result) 요청 검사. 같은 결과는 같은 주소 하나만 받아 CDN에 오래 캐시한다
// (쓸데없는 매개변수·점수 표기 바꾸기로 매번 새로 그리게 만드는 요청을 막는다).

const PARAMS: Record<string, string[]> = {
  animal: ['key', 's'],
  samguk: ['key', 's'],
  face: ['key'],
  mbti: ['a', 'b'],
  'face-match': ['a', 'b', 'rel'],
  invite: ['key', 'rel'],
  team: ['ids'],
}

export const OG_CACHE_CONTROL = 'public, max-age=86400, s-maxage=31536000, immutable'

export function ogQueryOk(q: URLSearchParams): boolean {
  const allowed = PARAMS[q.get('kind') ?? '']
  if (!allowed || !Object.hasOwn(PARAMS, q.get('kind')!)) return false
  const keys = [...q.keys()]
  if (new Set(keys).size !== keys.length) return false
  if (keys.some((k) => k !== 'kind' && !allowed.includes(k))) return false
  const s = q.get('s')
  // 공유 링크가 만드는 점수는 50~99 두 자리 정수뿐
  return s === null || /^[5-9]\d$/.test(s)
}
