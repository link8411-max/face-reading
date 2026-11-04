// 투표자 판별 공통: 출처 확인, pv 쿠키 검증·발급, 날마다 바뀌는 해시. 열전 투표와 월드컵 투표가 같이 쓴다.
import { kstDay, pvUuidFor, signPvCookie, verifyPvCookie, voterHash } from './votes'

export const PV_COOKIE = 'pv'

export function readPvCookie(request: Request): string | null {
  for (const part of (request.headers.get('cookie') ?? '').split(';')) {
    const [name, ...rest] = part.trim().split('=')
    if (name === PV_COOKIE) return rest.join('=')
  }
  return null
}

const ALLOWED_HOSTS = new Set(['unse-ai.com', 'www.unse-ai.com', 'localhost'])

// Origin 헤더가 있으면(브라우저의 교차 출처 요청 포함) 우리 사이트에서 온 것만 받는다.
export function sameSite(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (origin === null) return true
  let host: string
  let hostname: string
  try {
    const u = new URL(origin)
    host = u.host
    hostname = u.hostname
  } catch {
    return false
  }
  const own = request.headers.get('host') ?? new URL(request.url).host
  return host === own || ALLOWED_HOSTS.has(hostname)
}

/**
 * pv 쿠키는 서버가 서명한 `<uuid>.<발급일>.<서명>`만 받는다. 형식·서명이 틀리면 쿠키가 없는 것으로 본다.
 * 아무 UUID나 받으면 요청마다 새 UUID를 보내 표를 계속 늘릴 수 있다.
 * 발급일 다음 날부터만 쿠키의 uuid로 해시한다. 유효한 쿠키가 없거나 발급일이 오늘이면 고정값('new')이라
 * 쿠키를 새로 받아 곧바로 쓰는 스크립트도 IP·대상마다 하루 한 표가 상한이다.
 * 유효한 쿠키가 없을 때만 새 쿠키를 내려 준다(setCookie는 Set-Cookie 헤더 값 전체). uuid는 IP·날짜별 고정값이라
 * 같은 IP는 하루에 쿠키를 하나만 받는다.
 */
export async function resolveVoter(
  request: Request,
  secret: string,
  ip: string,
  now: Date,
): Promise<{ day: string; voterHash: string; setCookie: string | null }> {
  const day = kstDay(now)
  const today = day.replace(/-/g, '')
  const raw = readPvCookie(request)
  const valid = raw === null ? null : await verifyPvCookie(secret, raw)
  const deviceId = valid && valid.issuedDay < today ? valid.uuid : 'new'
  const issued = valid ? null : await signPvCookie(secret, await pvUuidFor(secret, ip, today), today)
  return {
    day,
    voterHash: await voterHash(secret, day, deviceId, ip),
    setCookie: issued
      ? `${PV_COOKIE}=${issued}; HttpOnly; SameSite=Lax; Path=/api/people; Max-Age=31536000; Secure`
      : null,
  }
}
