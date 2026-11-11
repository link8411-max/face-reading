// 결과 미리보기 이미지(/api/og/result) 요청 검사. 같은 결과는 같은 주소 하나만 받아 CDN에 오래 캐시한다
// (쓸데없는 매개변수·점수 표기 바꾸기로 매번 새로 그리게 만드는 요청을 막는다).

import { EL_KEYS, FINISHES, STYLES, WISHES } from '@/lib/bujeok/keys'

const has = (list: readonly string[], v: string | null) => v !== null && list.includes(v)

const PARAMS: Record<string, string[]> = {
  animal: ['key', 's'],
  samguk: ['key', 's'],
  face: ['key'],
  saju: ['key'],
  mbti: ['a', 'b'],
  'face-match': ['a', 'b', 'rel'],
  invite: ['key', 'rel'],
  team: ['ids'],
  'mbti-daily': ['type'],
  duel: ['key'],
  cup: ['board', 'key'],
  exam: ['grade', 'correct'],
  bujeok: ['style', 'wish', 'el', 'finish'],
}

export const OG_CACHE_CONTROL = 'public, max-age=86400, s-maxage=31536000, immutable'

export function ogQueryOk(q: URLSearchParams): boolean {
  const allowed = PARAMS[q.get('kind') ?? '']
  if (!allowed || !Object.hasOwn(PARAMS, q.get('kind')!)) return false
  const keys = [...q.keys()]
  if (new Set(keys).size !== keys.length) return false
  if (keys.some((k) => k !== 'kind' && !allowed.includes(k))) return false
  // 부적: 화풍·소원·기운·마감이 모두 허용 목록 안의 값이어야 한다 (이름은 받지 않는다)
  if (q.get('kind') === 'bujeok' && !(has(STYLES, q.get('style')) && has(WISHES, q.get('wish')) && has(EL_KEYS, q.get('el')) && has(FINISHES, q.get('finish')))) return false
  // 밈 능력고사: 등급 1~9, 맞힌 수 0~5(앞자리 0 금지), 둘 다 있어야 한다
  if (q.get('kind') === 'exam' && !(/^[1-9]$/.test(q.get('grade') ?? '') && /^[0-5]$/.test(q.get('correct') ?? ''))) return false
  const s = q.get('s')
  // 공유 링크가 만드는 점수는 50~99 두 자리 정수뿐
  return s === null || /^[5-9]\d$/.test(s)
}
