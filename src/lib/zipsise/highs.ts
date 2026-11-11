// 집시세 "이번 주 신고가" 한 건 고르기. 서버 전용: 클라이언트 파일에서 가져오지 않는다(tests/bujeok/ad.test.tsx가 막는다).
// 읽는 파일 `<ZIPSISE_DATA_URL>/v1/highs/recent.json` 은 집시세가 매일 내는 공개 파일이다(형식: 집시세 레포 frontend/src/lib/types.ts RecordHigh).
// 단위(2026-11-10 실제 파일로 확인): amount·prev_max·jump는 만원, deal_date는 YYYY-MM-DD.
import { kstDate } from '@/lib/kst'
import { HOUSE_BANNER_URL, type WeeklyHigh } from './banner'

export { HOUSE_BANNER_URL }
export type { WeeklyHigh }

const DAYS = 7
const TIMEOUT_MS = 4000
const FILE = '/v1/highs/recent.json'
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** 만원 단위 정수 → '15억 9,500만' · '10억' · '9,000만' */
export function formatMan(man: number): string {
  const eok = Math.floor(man / 10000)
  const rest = man % 10000
  const parts: string[] = []
  if (eok > 0) parts.push(`${eok.toLocaleString('en-US')}억`)
  if (rest > 0) parts.push(`${rest.toLocaleString('en-US')}만`)
  return parts.join(' ')
}

const isPosNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0

/** today(YYYY-MM-DD) 포함 7일 안의 첫 날짜 */
function windowStart(today: string): string {
  const [y, m, d] = today.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d - (DAYS - 1))).toISOString().slice(0, 10)
}

interface Cand { aptName: string; regionName: string; amount: number; jump: number; dealDate: string }

/** 최근 7일(오늘 포함) 신고가 가운데 오른 금액이 가장 큰 한 건(동률이면 단지명 가나다순). 쓸 수 있는 건이 없으면 null. throw 하지 않는다 */
export function pickWeeklyHigh(raw: unknown, today: string): WeeklyHigh | null {
  if (!DATE_RE.test(today)) return null
  const items = (raw as { items?: unknown } | null)?.items
  if (!Array.isArray(items)) return null
  const since = windowStart(today)
  const cands: Cand[] = []
  for (const it of items) {
    if (!it || typeof it !== 'object') continue
    const r = it as Record<string, unknown>
    // 정정 의심(held)·공유 불가(shareable false)는 집시세도 공유하지 않는 거래라 배너에도 쓰지 않는다
    if (r.held === true || r.shareable === false) continue
    const name = typeof r.apt_name === 'string' ? r.apt_name.trim() : ''
    const region = typeof r.region_name === 'string' ? r.region_name.trim() : ''
    const date = r.deal_date
    if (!name || !region || typeof date !== 'string' || !DATE_RE.test(date)) continue
    if (!isPosNum(r.amount) || !isPosNum(r.jump)) continue
    if (date < since || date > today) continue
    cands.push({ aptName: name, regionName: region, amount: r.amount, jump: r.jump, dealDate: date })
  }
  if (cands.length === 0) return null
  cands.sort((a, b) => b.jump - a.jump || (a.aptName < b.aptName ? -1 : a.aptName > b.aptName ? 1 : 0))
  const c = cands[0]
  return { aptName: c.aptName, regionName: c.regionName, amountText: formatMan(c.amount), jumpText: `+${formatMan(c.jump)}`, dealDate: c.dealDate }
}

/** 서버에서 파일을 읽어(1시간 캐시) 이번 주 신고가 한 건을 돌려준다. 환경변수가 없거나 읽기·해석에 실패하면 null(throw 안 함) */
export async function fetchWeeklyHigh(): Promise<WeeklyHigh | null> {
  const base = (process.env.ZIPSISE_DATA_URL ?? '').trim().replace(/\/+$/, '')
  if (!base) return null
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    // signal을 넘기면 Next의 데이터 캐시가 깨질 수 있어, 제한 시간은 Promise.race로 건다(시간이 지나면 null)
    const timeout = new Promise<null>((resolve) => {
      timer = setTimeout(() => resolve(null), TIMEOUT_MS)
    })
    const read = (async () => {
      const res = await fetch(`${base}${FILE}`, { next: { revalidate: 3600 } })
      if (!res.ok) return null
      return pickWeeklyHigh(await res.json(), kstDate(new Date()))
    })()
    read.catch(() => {}) // 제한 시간이 먼저 끝난 뒤의 실패가 처리되지 않은 거부로 남지 않게
    return await Promise.race([read, timeout])
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}
