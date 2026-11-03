// 인물열전 응원·투표: 요청 검증, 날마다 바뀌는 해시, 한국 날짜. IP·쿠키 원본은 저장하지 않는다.
import { getPerson } from '@/content/samgukPeople'
import { createGuard } from '@/lib/duel/feedbackGuard'
import { kstDay, pairKey } from './keys'

export { kstDay, pairKey }

export type VoteKind = 'cheer' | 'duel' | 'scene' | 'verdict'
export interface VoteInput {
  kind: VoteKind
  target: string
  option: string
}

export interface PersonStats {
  cheer: number
  duel: Record<string, number>
  scene: Record<string, number>
  verdict: Record<string, number>
}

/** 투표 API 속도 제한: 10분에 20회 */
export const voteGuard = createGuard(20)

export function validateVote(body: unknown): VoteInput | null {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null
  const { kind, target, option } = body as Record<string, unknown>
  if (typeof kind !== 'string' || typeof target !== 'string' || typeof option !== 'string') return null

  if (kind === 'cheer') {
    return getPerson(target) && option === 'cheer' ? { kind, target, option } : null
  }
  if (kind === 'duel') {
    // target은 쌍 키: 두 id 중 하나가 열전 인물이고, 다른 하나가 그 인물의 라이벌이어야 한다
    const [a, b, ...rest] = target.split('__')
    if (!a || !b || rest.length > 0 || pairKey(a, b) !== target) return null
    const ok = [a, b].some((id) => {
      const p = getPerson(id)
      return p !== undefined && target === pairKey(id, p.rivalId)
    })
    return ok && (option === a || option === b) ? { kind, target, option } : null
  }
  if (kind === 'scene') {
    const p = getPerson(target)
    return p && p.sceneOptions.some((o) => o.key === option) ? { kind, target, option } : null
  }
  if (kind === 'verdict') {
    const p = getPerson(target)
    return p && (p.verdictOptions as string[]).includes(option) ? { kind, target, option } : null
  }
  return null
}

async function hmacHex(key: string | ArrayBuffer, data: string): Promise<{ raw: ArrayBuffer; hex: string }> {
  const keyData = typeof key === 'string' ? new TextEncoder().encode(key) : key
  const k = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const raw = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(data))
  const hex = Array.from(new Uint8Array(raw), (b) => b.toString(16).padStart(2, '0')).join('')
  return { raw, hex }
}

/** HMAC-SHA256(HMAC-SHA256(secret, day), `${deviceId}|${ip}`) hex. 날짜가 바뀌면 같은 사람도 다른 값 */
export async function voterHash(secret: string, day: string, deviceId: string, ip: string): Promise<string> {
  const daily = await hmacHex(secret, day)
  return (await hmacHex(daily.raw, `${deviceId}|${ip}`)).hex
}
