// 열전 페이지에서 쓰는 초상화·제목·설명 도우미
import { allSamgukCharacters, PENDING_PORTRAIT_IDS } from '@/lib/samgukDB'
import { getPerson } from '@/content/samgukPeople'

export const BRAND = ' – 운명을 읽다'
const TITLE_MAX = 48
const DESC_MIN = 50
const DESC_MAX = 110

// 초상화 경로. 그림이 아직 없는 인물(PENDING)이면 null
export function portraitSrc(id: string): string | null {
  const c = allSamgukCharacters.find((x) => x.id === id)
  if (!c || PENDING_PORTRAIT_IDS.has(id)) return null
  return `/images/samguk/${c.name}.jpg`
}

// 마지막 글자가 받침으로 끝나는지 (한글이 아니면 받침 없음으로 본다)
export function hasFinalConsonant(word: string): boolean {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  if (code < 0 || code > 11171) return false
  return code % 28 !== 0
}

export function eulReul(name: string): '을' | '를' {
  return hasFinalConsonant(name) ? '을' : '를'
}

function nameOf(id: string): string {
  return allSamgukCharacters.find((x) => x.id === id)?.name ?? id
}

// 검색 제목 실험(2026-11-11): 네이버에서 노출은 많은데 클릭률이 0.2~1.6%였던 다섯 명만 인물의 가장 극적인 한 줄로 바꿨다.
// 비교 기준(서치어드바이저 최근 30일, 11/10 갱신): 등애 노출 420·0.2%, 여포 330·0.3%, 관우 285·0.4%, 조운 265·0.8%, 유비 253·1.6%.
// 2주 뒤 다시 보고, 오르면 나머지 인물에도 넓힌다. 문장은 열전 summary·funFacts에 있는 사실만 쓴다.
export const HOOK_TITLES: Record<string, string> = {
  dengai: '등애 | 담요 두르고 낭떠러지를 굴러 촉을 무너뜨린 장수',
  lvbu: '여포 | 양아버지 둘을 죽인 천하제일 무장의 최후',
  guanyu: '관우 | 화웅을 벤 건 정말 관우였을까? 연의와 정사',
  zhaoyun: '조운 조자룡 | 아두를 안고 조조 대군을 뚫은 장수',
  liubei: '유비 | 돗자리 짜던 소년이 황제가 되기까지',
}

// 예: "관우 열전 | 자 운장, 뜻·무기·관계도 – 운명을 읽다" (48자 이하가 되도록 뒤쪽부터 줄인다)
export function personTitle(id: string): string {
  if (HOOK_TITLES[id]) return HOOK_TITLES[id] + BRAND
  const p = getPerson(id)
  const name = nameOf(id)
  const candidates = [
    p?.style ? `${name} 열전 | 자 ${p.style}, 뜻·무기·관계도` : null,
    `${name} 열전 | 뜻·무기·관계도`,
    `${name} 열전 | 무기·관계도`,
    `${name} 열전`,
  ].filter((x): x is string => x !== null)
  return (candidates.find((t) => (t + BRAND).length <= TITLE_MAX) ?? candidates[candidates.length - 1]) + BRAND
}

const DESC_SUFFIX = ' 무기·관계·최후까지 정리했어요.'

// 요약 앞부분 + 검색어(무기·관계·최후). 전체 50~110자
export function personDescription(id: string): string {
  const p = getPerson(id)
  const summary = (p?.summary ?? '').replace(/\s+/g, ' ').replace(/!/g, '').trim()
  const room = DESC_MAX - DESC_SUFFIX.length
  const sentences = summary.split(/(?<=\.)\s+/)
  let head = ''
  let rest = ''
  for (let i = 0; i < sentences.length; i++) {
    const next = head ? `${head} ${sentences[i]}` : sentences[i]
    if (next.length > room) {
      rest = sentences[i]
      break
    }
    head = next
  }
  // 문장 단위로 너무 짧게 남으면 다음 문장을 단어 경계에서 잘라 이어 붙인다
  if (rest && head.length + DESC_SUFFIX.length < DESC_MIN + 10) {
    const base = head ? `${head} ` : ''
    const cut = rest.slice(0, room - base.length - 1)
    const sp = cut.lastIndexOf(' ')
    head = `${base}${(sp > 10 ? cut.slice(0, sp) : cut).replace(/[\s,.]+$/, '')}…`
  }
  let d = head + DESC_SUFFIX
  if (d.length < DESC_MIN) d = `${nameOf(id)} 열전.${d.startsWith(' ') ? '' : ' '}${d}`
  return d
}

// 전투 연도 표시: 모르면 "연도 미상" (년 붙이지 않음)
export function yearLabel(year: number | null): string {
  return year === null ? '연도 미상' : `${year}년`
}
