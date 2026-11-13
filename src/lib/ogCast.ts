// 미리보기 이미지(/api/og, /api/og/result)에 넣을 캐릭터. 엣지 런타임에서도 쓰이므로 가볍게 유지한다.
import { CAST, type CastKey } from '@/content/cast'

/** `?cast=` 값: 허용 목록(캐릭터 키)에 있는 것만 받고, 그 밖은 해태. */
export function castParam(v: string | null): CastKey {
  return v !== null && Object.hasOwn(CAST, v) ? (v as CastKey) : 'haetae'
}

/** 결과 미리보기 종류별 캐릭터. 삼국지·부적·월드컵·일기토는 초상화·부적 그림이 주인공이라 null. */
export function castForKind(kind: string): CastKey | null {
  switch (kind) {
    case 'face': return 'haetae'
    case 'animal': return 'tiger'
    case 'saju': return 'saja'
    case 'mbti': case 'mbti-daily': case 'face-match': case 'invite': return 'gumiho'
    case 'exam': return 'dokkaebi'
    default: return null
  }
}

/** 캐릭터 그림(512px PNG)을 받아 둔다. 1.5초 안에 못 받으면 undefined(그림 없이 그린다). */
export async function loadCastImage(key: CastKey, base: string): Promise<ArrayBuffer | undefined> {
  try {
    const res = await fetch(new URL(CAST[key].og, base), { signal: AbortSignal.timeout(1500) })
    return res.ok ? await res.arrayBuffer() : undefined
  } catch {
    return undefined
  }
}
