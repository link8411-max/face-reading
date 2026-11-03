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
  /** 응원 순위(동점은 같은 순위). 응원이 없거나 순위를 모르면 없다 */
  rank?: number
  duel: Record<string, number>
  scene: Record<string, number>
  verdict: Record<string, number>
}

/** 투표 API 속도 제한: 10분에 60회 */
export const voteGuard = createGuard(60)

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

/**
 * 투표 뒤 보여 줄 집계의 주인공(열전 인물 id).
 * 대결은 쌍 키만으로는 어느 쪽 페이지인지 알 수 없다(서로를 라이벌로 둔 쌍이 있다). 그래서 `page`가 필수이고,
 * 그 인물의 라이벌 쌍이 target과 같아야 한다. 그 밖의 종류는 page를 무시하고 target의 집계를 쓴다.
 * 맞지 않으면 null (요청은 400).
 */
export function statsOwner(vote: VoteInput, page: unknown): string | null {
  if (vote.kind !== 'duel') return vote.target
  if (typeof page !== 'string') return null
  const p = getPerson(page)
  return p !== undefined && pairKey(page, p.rivalId) === vote.target ? page : null
}

/** HMAC-SHA256(HMAC-SHA256(secret, day), `${deviceId}|${ip}`) hex. 날짜가 바뀌면 같은 사람도 다른 값 */
export async function voterHash(secret: string, day: string, deviceId: string, ip: string): Promise<string> {
  const daily = await hmacHex(secret, day)
  return (await hmacHex(daily.raw, `${deviceId}|${ip}`)).hex
}

const PV_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PV_DAY = /^\d{8}$/

async function pvSig(secret: string, uuid: string, issuedDay: string): Promise<string> {
  return (await hmacHex(secret, `pv|${uuid}|${issuedDay}`)).hex.slice(0, 32)
}

/** `pv` 쿠키 값: `<uuid>.<발급일 YYYYMMDD>.<서명>`. 서명 = HMAC-SHA256(secret, `pv|uuid|발급일`) 앞 32자 hex */
export async function signPvCookie(secret: string, uuid: string, issuedDay: string): Promise<string> {
  return `${uuid}.${issuedDay}.${await pvSig(secret, uuid, issuedDay)}`
}

/** 형식이 틀리거나 서명이 안 맞으면 null (쿠키 없음으로 취급) */
export async function verifyPvCookie(
  secret: string,
  value: string,
): Promise<{ uuid: string; issuedDay: string } | null> {
  const parts = value.split('.')
  if (parts.length !== 3) return null
  const [uuid, issuedDay, sig] = parts
  if (!PV_UUID.test(uuid) || !PV_DAY.test(issuedDay) || !/^[0-9a-f]{32}$/.test(sig)) return null
  const want = await pvSig(secret, uuid, issuedDay)
  // 길이가 같은 hex끼리 상수 시간 비교
  let diff = 0
  for (let i = 0; i < want.length; i++) diff |= want.charCodeAt(i) ^ sig.charCodeAt(i)
  return diff === 0 ? { uuid, issuedDay } : null
}
