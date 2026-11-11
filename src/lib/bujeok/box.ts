// 부적함: 이 기기 브라우저(localStorage)에만 남기는 부적 링크 목록. 서버·GA로 보내지 않는다.
// 저장하는 값은 코드·받는 이름·보낸 이름·종류·저장 시각뿐이다. 생년월일은 저장하지 않는다(코드에는 기운만 들어 있다).
// 저장소를 못 쓰는 환경(사생활 보호 창, 인앱 브라우저)에서는 loadBox가 null이고 나머지는 조용히 아무것도 하지 않는다.
import { cleanName, parseBujeokCode } from './link'

export type BoxKind = 'mine' | 'sent' | 'received'
export interface BoxItem { code: string; to: string | null; from: string | null; kind: BoxKind; savedAt: number }

const KEY = 'bujeok-box-v1'
export const BOX_MAX = 60
const KINDS: readonly string[] = ['mine', 'sent', 'received']

const sameItem = (a: Omit<BoxItem, 'savedAt'>, b: Omit<BoxItem, 'savedAt'>) => a.code === b.code && a.to === b.to && a.from === b.from && a.kind === b.kind

/** 검사를 통과하면 알려진 필드만 담은 새 객체, 아니면 null */
function clean(raw: unknown): BoxItem | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (typeof r.code !== 'string' || !parseBujeokCode(r.code)) return null
  if (typeof r.kind !== 'string' || !KINDS.includes(r.kind)) return null
  if (typeof r.savedAt !== 'number' || !Number.isFinite(r.savedAt)) return null
  const names: (string | null)[] = []
  for (const v of [r.to, r.from]) {
    if (v === null || v === undefined) names.push(null)
    else {
      const n = cleanName(v)
      if (n === null || n !== v) return null
      names.push(n)
    }
  }
  return { code: r.code, to: names[0], from: names[1], kind: r.kind as BoxKind, savedAt: r.savedAt }
}

export const BOX_UNAVAILABLE = 'unavailable'
/** 저장된 원문. 저장소를 못 쓰면 BOX_UNAVAILABLE, 아무것도 없으면 null */
export function readBoxRaw(): string | null {
  try {
    const ls = globalThis.localStorage
    if (!ls) return BOX_UNAVAILABLE
    return ls.getItem(KEY)
  } catch {
    return BOX_UNAVAILABLE
  }
}

export function parseBox(raw: string | null): BoxItem[] | null {
  if (raw === BOX_UNAVAILABLE) return null
  if (!raw) return []
  try {
    const v: unknown = JSON.parse(raw)
    if (!Array.isArray(v)) return []
    return v.map(clean).filter((i): i is BoxItem => i !== null).slice(0, BOX_MAX)
  } catch {
    return [] // 깨진 JSON: 빈 상자로 보고 다음에 넣을 때 덮어쓴다
  }
}

/** 저장된 목록(최신순). null이면 저장소를 쓸 수 없는 환경 */
export function loadBox(): BoxItem[] | null {
  return parseBox(readBoxRaw())
}

const listeners = new Set<() => void>()
/** 같은 탭 안의 변경과 다른 탭의 변경(storage 이벤트)을 알린다 (useSyncExternalStore용) */
export function subscribeBox(cb: () => void): () => void {
  listeners.add(cb)
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === KEY) cb()
  }
  if (typeof window !== 'undefined') window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(cb)
    if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage)
  }
}

function write(items: BoxItem[]): void {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(items))
  } catch {
    /* 용량 초과·저장소 차단: 부적함은 덤이라 조용히 넘어간다 */
  }
  listeners.forEach((cb) => cb())
}

/** 맨 앞에 넣는다. 같은 코드·이름·종류가 이미 있으면 그 항목을 지우고 새로 넣는다. 60개를 넘으면 오래된 것부터 지운다 */
export function addToBox(item: Omit<BoxItem, 'savedAt'>): void {
  const next = clean({ ...item, savedAt: Date.now() })
  if (!next) return
  const cur = loadBox()
  if (cur === null) return
  write([next, ...cur.filter((i) => !sameItem(i, next))].slice(0, BOX_MAX))
}

export function removeFromBox(item: Omit<BoxItem, 'savedAt'>): void {
  const cur = loadBox()
  if (cur === null) return
  const next = cur.filter((i) => !sameItem(i, item))
  if (next.length !== cur.length) write(next)
}

/** 부적함 항목을 여는 주소(같은 사이트 안). 이름은 # 뒤 */
export function boxItemHref(item: Pick<BoxItem, 'code' | 'to' | 'from' | 'kind'>): string {
  const parts: string[] = []
  if (item.to) parts.push(`to=${encodeURIComponent(item.to)}`)
  if (item.from && item.kind !== 'mine') parts.push(`from=${encodeURIComponent(item.from)}`)
  return `/bujeok/r/${item.code}${item.kind === 'mine' ? '?me=1' : ''}${parts.length ? `#${parts.join('&')}` : ''}`
}
