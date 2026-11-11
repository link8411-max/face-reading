// 부적 선물 링크와 이름 검사. 링크에는 화풍·소원·기운·변형 번호와 (선택) 이름만 싣는다. 생년월일은 싣지 않는다.
import { SITE } from '@/lib/shareBase'
import { BANNED_NAMES } from './bannedNames'
import { EL_KEYS, STYLES, VARIANTS, WISHES, type BujeokSpec } from './keys'

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
  return `${spec.style}-${spec.wish}-${spec.el}-${spec.variant}`
}

export function parseBujeokCode(code: string): BujeokSpec | null {
  const p = code.split('-')
  if (p.length !== 4) return null
  const [style, wish, el, v] = p
  if (!/^(0|[1-9]\d?)$/.test(v)) return null
  const variant = Number(v)
  if (variant >= VARIANTS) return null
  if (!(STYLES as readonly string[]).includes(style)) return null
  if (!(WISHES as readonly string[]).includes(wish)) return null
  if (!(EL_KEYS as readonly string[]).includes(el)) return null
  return { style, wish, el, variant } as BujeokSpec
}

export function bujeokGiftUrl(spec: BujeokSpec, names: { to: string; from?: string }): string {
  const q: string[] = []
  const to = cleanName(names.to)
  const from = cleanName(names.from)
  if (to) q.push(`to=${encodeURIComponent(to)}`)
  if (from) q.push(`from=${encodeURIComponent(from)}`)
  q.push('utm_source=share', 'utm_medium=friend_link')
  return `${SITE}/bujeok/r/${bujeokCode(spec)}?${q.join('&')}`
}

/** 미리보기 이미지 주소. 이름은 넣지 않는다 (CDN 캐시·개인정보) */
export function bujeokOgUrl(spec: BujeokSpec): string {
  return `${SITE}/api/og/result?kind=bujeok&style=${spec.style}&wish=${spec.wish}&el=${spec.el}`
}

export function giftHeadline(to: string | null): string {
  return to ? `${to}님께 부적이 도착했어요` : '부적이 도착했어요'
}
