// 밈 능력고사 응시 기록 저장소(Supabase PostgREST, 서버 전용). 열전 투표와 같은 방식: 서비스 키, 5초 제한, 키·본문은 로그에 남기지 않는다.
import { signPvCookie, verifyPvCookie, voterHash } from '@/lib/people/votes'
import type { StoreConfig } from '@/lib/people/store'
import type { PlayInput, QuestionStat } from './stats'

export const EXAM_COOKIE = 'xd'

const headers = (cfg: StoreConfig, prefer?: string): Record<string, string> => ({
  apikey: cfg.key,
  Authorization: `Bearer ${cfg.key}`,
  'Content-Type': 'application/json',
  ...(prefer ? { Prefer: prefer } : {}),
})

function readCookie(request: Request, name: string): string | null {
  for (const part of (request.headers.get('cookie') ?? '').split(';')) {
    const [k, ...rest] = part.trim().split('=')
    if (k === name) return rest.join('=')
  }
  return null
}

/**
 * 기기 판별: 서명한 쿠키(`<uuid>.<발급일>.<서명>`, 열전 pv와 같은 형식)의 uuid로 해시한다.
 * 설계상 열전의 "첫날은 IP로" 규칙은 쓰지 않는다(같은 와이파이의 첫 방문자들이 한 명으로 뭉치므로).
 * 유효한 쿠키가 없으면 새 uuid를 발급한다. 부풀리기는 IP당 요청 제한으로 막는다.
 */
export async function resolveDevice(
  request: Request,
  secret: string,
  today: string, // YYYYMMDD
): Promise<{ deviceHash: string; setCookie: string | null }> {
  const raw = readCookie(request, EXAM_COOKIE)
  const valid = raw === null ? null : await verifyPvCookie(secret, raw)
  const uuid = valid?.uuid ?? crypto.randomUUID()
  const issued = valid ? null : await signPvCookie(secret, uuid, today)
  return {
    deviceHash: await voterHash(secret, 'exam', uuid, ''),
    setCookie: issued
      ? `${EXAM_COOKIE}=${issued}; HttpOnly; SameSite=Lax; Path=/api/exam; Max-Age=31536000; Secure`
      : null,
  }
}

/** 한 판 저장. 같은 기기·같은 회차는 처음 것만 남는다(counted false). 실패하면 throw */
export async function insertPlay(
  cfg: StoreConfig,
  play: PlayInput,
  deviceHash: string,
  day: string,
): Promise<{ counted: boolean }> {
  const res = await fetch(`${cfg.url}/rest/v1/exam_plays?on_conflict=subject,round,device_hash`, {
    method: 'POST',
    headers: headers(cfg, 'resolution=ignore-duplicates,return=representation'),
    body: JSON.stringify({ subject: 'meme', ...play, device_hash: deviceHash, day }),
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) throw new Error(`insert ${res.status}`)
  const rows: unknown = await res.json()
  return { counted: Array.isArray(rows) && rows.length > 0 }
}

/** 한 회차의 문제별 집계(항상 5칸, 1번 문제가 첫 칸). 실패하면 throw */
export async function readRates(cfg: StoreConfig, round: number): Promise<QuestionStat[]> {
  const res = await fetch(`${cfg.url}/rest/v1/rpc/exam_round_rates`, {
    method: 'POST',
    headers: headers(cfg),
    body: JSON.stringify({ p_subject: 'meme', p_round: round }),
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) throw new Error(`rpc ${res.status}`)
  const rows: unknown = await res.json()
  const out: QuestionStat[] = Array.from({ length: 5 }, () => ({ n: 0, correct: 0 }))
  if (!Array.isArray(rows)) return out
  for (const r of rows as { q?: unknown; n?: unknown; correct?: unknown }[]) {
    const q = Number(r.q)
    const n = Number(r.n)
    const c = Number(r.correct)
    if (Number.isInteger(q) && q >= 1 && q <= 5 && Number.isFinite(n) && Number.isFinite(c)) out[q - 1] = { n, correct: c }
  }
  return out
}
