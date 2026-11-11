// 부적 선물 링크와 이름 검사. 링크에는 화풍·소원·기운·변형 번호·마감과 (선택) 이름만 싣는다. 생년월일은 싣지 않는다.
import { SITE } from '@/lib/shareBase'
import { BANNED_NAMES } from './bannedNames'
import { EL_KEYS, FINISHES, STYLES, VARIANTS, WISHES, type BujeokSpec } from './keys'

const NAME_RE = /^[가-힣A-Za-z0-9 ]+$/

/** 앞뒤 공백을 떼고 1~8자, 한글·영문·숫자·공백만, 금지어 없음. 아니면 null */
export function cleanName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const s = raw.trim()
  if (s.length < 1 || s.length > 8 || !NAME_RE.test(s)) return null
  const flat = s.replace(/ /g, '').toLowerCase()
  if (BANNED_NAMES.some((b) => flat.includes(b))) return null
  return s
}

export function bujeokCode(spec: BujeokSpec): string {
  return `${spec.style}-${spec.wish}-${spec.el}-${spec.variant}-${spec.finish}`
}

export function parseBujeokCode(code: string): BujeokSpec | null {
  const p = code.split('-')
  if (p.length !== 5) return null
  const [style, wish, el, v, finish] = p
  if (!/^(0|[1-9]\d?)$/.test(v)) return null
  const variant = Number(v)
  if (variant >= VARIANTS) return null
  if (!(STYLES as readonly string[]).includes(style)) return null
  if (!(WISHES as readonly string[]).includes(wish)) return null
  if (!(EL_KEYS as readonly string[]).includes(el)) return null
  if (!(FINISHES as readonly string[]).includes(finish)) return null
  return { style, wish, el, variant, finish } as BujeokSpec
}

// 이름은 링크의 # 뒤에만 싣는다. 해시는 서버로 가지 않고 GA 기본 수집·서버 접근 로그에 들어가지 않는다.
function nameHash(to: string | null | undefined, from?: string | null): string {
  const parts: string[] = []
  const t = cleanName(to)
  const f = cleanName(from)
  if (t) parts.push(`to=${encodeURIComponent(t)}`)
  if (f) parts.push(`from=${encodeURIComponent(f)}`)
  return parts.length ? `#${parts.join('&')}` : ''
}

export function bujeokGiftUrl(spec: BujeokSpec, names: { to: string; from?: string }): string {
  return `${SITE}/bujeok/r/${bujeokCode(spec)}?utm_source=share&utm_medium=friend_link${nameHash(names.to, names.from)}`
}

/** 내 부적 링크: 열어 보기 없이 바로 카드가 나온다 */
export function bujeokMineUrl(spec: BujeokSpec, name?: string | null): string {
  return `${SITE}/bujeok/r/${bujeokCode(spec)}?me=1${nameHash(name)}`
}

/** 링크 해시(`#to=…&from=…`)에서 이름을 꺼낸다. cleanName을 못 넘으면 null */
export function parseNameHash(hash: string): { to: string | null; from: string | null } {
  const params = new URLSearchParams(hash.replace(/^#/, ''))
  return { to: cleanName(params.get('to')), from: cleanName(params.get('from')) }
}

/** 미리보기 이미지 주소. 이름은 넣지 않는다 (CDN 캐시·개인정보) */
export function bujeokOgUrl(spec: BujeokSpec): string {
  return `${SITE}/api/og/result?kind=bujeok&style=${spec.style}&wish=${spec.wish}&el=${spec.el}&finish=${spec.finish}`
}

export function giftHeadline(to: string | null): string {
  return to ? `${to}님께 부적이 도착했어요` : '부적이 도착했어요'
}

export function mineHeadline(to: string | null): string {
  return to ? `${to}님의 부적` : '나의 부적'
}
