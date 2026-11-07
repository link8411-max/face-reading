// 사주 엔진: manseryeok@2.0.0 만세력을 감싸 한글 도메인 타입으로 돌려준다. 서버 전용(API 라우트에서 호출).
import {
  calculateFourPillars,
  getSolarTermsOfYear,
  isValidSolarDate,
  lunarToSolar,
  getEarthlyBranchElement,
  getHeavenlyStemElement,
  getHeavenlyStemYinYang,
  HEAVENLY_STEMS,
  HEAVENLY_STEMS_HANJA,
  EARTHLY_BRANCHES,
  EARTHLY_BRANCHES_HANJA,
  type BirthInfo,
  type FourPillarsDetail,
} from 'manseryeok'
import {
  BRANCHES,
  ELEMENTS,
  HOUR_SLOT_BY_KEY,
  STEMS,
  STEM_KEY,
  TEN_GODS,
  type Branch,
  type Element,
  type HourSlotKey,
  type RelationKind,
  type RelationStrength,
  type Stem,
  type TenGod,
} from './keys'
import { branchRelationToMi, stemTenGod } from './relations'

export interface SajuInput {
  year: number
  month: number
  day: number
  hourSlot: HourSlotKey | null
  isLunar: boolean
  isLeapMonth: boolean
  gender: '남' | '여' | null
  asOfYear: number
}

export interface PillarOut {
  stem: Stem
  branch: Branch
  hanja: string
  korean: string
  stemElement: Element
  branchElement: Element
  stemYinYang: '양' | '음'
}

type TG = { stem: TenGod; branch: TenGod }

export interface SajuResult {
  ok: true
  pillars: { year: PillarOut; month: PillarOut; day: PillarOut; hour: PillarOut | null }
  dayMaster: { stem: Stem; element: Element; yinYang: '양' | '음'; key: string }
  elements: Record<Element, number>
  tenGods: {
    counts: Record<TenGod, number>
    byPillar: { year: TG; month: TG; day: { branch: TenGod }; hour: TG | null }
    top: TenGod[]
    /** 많이 나타난 개수가 셋째와 같아 둘을 확실히 고를 수 없을 때 true (화면은 "고르게 섞인" 문구로 바꾼다) */
    tied: boolean
  }
  daeun: { startAge: number; countingAge: number; forward: boolean; korean: string; hanja: string; isCurrent: boolean }[]
  seun: { year: number; korean: string; hanja: string; stemTenGod: TenGod; dayBranchRelation: { kind: RelationKind; strength: RelationStrength } }
  basis: {
    dayBoundary: 'midnight'
    dstApplied: boolean
    trueSolarTime: false
    hourKnown: boolean
    boundaryWarning: null | { kind: 'jeolip' | 'midnight'; at: string; alt: string }
  }
  solar: { year: number; month: number; day: number }
}

export type SajuFailure = { ok: false; reason: 'range' | 'invalid' }

const SOLAR_MIN_YEAR = 1900
const LUNAR_MAX_YEAR = 2100
const DST_YEARS = new Set([1948, 1949, 1950, 1951, 1955, 1956, 1957, 1958, 1959, 1960, 1987, 1988])

const TZ = {
  longitude: 135,
  applyEquationOfTime: false,
  applyHistoricalDst: true,
} as const

const hanjaOf = (korean: string) =>
  [...korean].map((c, i) => (i === 0 ? HEAVENLY_STEMS_HANJA[HEAVENLY_STEMS.indexOf(c as Stem)] : EARTHLY_BRANCHES_HANJA[EARTHLY_BRANCHES.indexOf(c as Branch)])).join('')

function pillarOut(stem: Stem, branch: Branch): PillarOut {
  return {
    stem,
    branch,
    korean: stem + branch,
    hanja: hanjaOf(stem + branch),
    stemElement: getHeavenlyStemElement(stem),
    branchElement: getEarthlyBranchElement(branch),
    stemYinYang: getHeavenlyStemYinYang(stem),
  }
}

function calc(y: number, m: number, d: number, hour: number, minute: number, gender: SajuInput['gender'], lunar?: { isLeapMonth: boolean }): FourPillarsDetail {
  const info: BirthInfo = {
    year: y,
    month: m,
    day: d,
    hour,
    minute,
    isLunar: !!lunar,
    isLeapMonth: lunar?.isLeapMonth,
    dayBoundary: 'midnight',
    trueSolarTime: { ...TZ },
    gender: gender === '남' ? 'male' : gender === '여' ? 'female' : undefined,
  }
  return calculateFourPillars(info)
}

const pad = (n: number) => String(n).padStart(2, '0')

/** 절입 당일 시간 모름 경고. 12절(짝수 index) 중 그날 KST 날짜인 것이 있으면 반환 */
function jeolipWarning(s: { year: number; month: number; day: number }, gender: SajuInput['gender']) {
  for (const t of getSolarTermsOfYear(s.year)) {
    if (t.index % 2 !== 0) continue
    const kst = new Date(t.date.getTime() + 9 * 3600_000)
    if (kst.getUTCFullYear() !== s.year || kst.getUTCMonth() + 1 !== s.month || kst.getUTCDate() !== s.day) continue
    const h = kst.getUTCHours()
    const at = `${pad(h)}:${pad(kst.getUTCMinutes())}`
    // 정오가 절입 뒤면 반대쪽은 절입 전(00:00), 앞이면 절입 후(23:30)
    const other = h < 12 ? calc(s.year, s.month, s.day, 0, 0, gender) : calc(s.year, s.month, s.day, 23, 30, gender)
    const noon = calc(s.year, s.month, s.day, 12, 0, gender)
    const yearChanged = other.year.heavenlyStem !== noon.year.heavenlyStem || other.year.earthlyBranch !== noon.year.earthlyBranch
    const mk = (p: { heavenlyStem: string; earthlyBranch: string }) => p.heavenlyStem + p.earthlyBranch
    const alt = yearChanged ? `${mk(other.year)}년·${mk(other.month)}월` : `${mk(other.month)}월`
    return { kind: 'jeolip' as const, at, alt }
  }
  return null
}

export function computeSaju(input: SajuInput): SajuResult | SajuFailure {
  const { year, month, day, hourSlot, isLunar, isLeapMonth, gender, asOfYear } = input
  if (![year, month, day].every(Number.isInteger)) return { ok: false, reason: 'invalid' }
  if (year < SOLAR_MIN_YEAR || year > (isLunar ? LUNAR_MAX_YEAR : asOfYear)) return { ok: false, reason: 'range' }

  let solar: { year: number; month: number; day: number }
  try {
    if (isLunar) {
      const s = lunarToSolar(year, month, day, isLeapMonth)
      solar = { year: s.year, month: s.month, day: s.day }
    } else {
      if (!isValidSolarDate(year, month, day)) return { ok: false, reason: 'invalid' }
      solar = { year, month, day }
    }
  } catch {
    return { ok: false, reason: 'invalid' } // 연도 범위는 위에서 걸렀으므로 월·일·윤달 불일치
  }
  if (solar.year < SOLAR_MIN_YEAR || solar.year > asOfYear) return { ok: false, reason: 'range' }

  const slot = hourSlot ? HOUR_SLOT_BY_KEY[hourSlot] : null
  const hour = slot?.hour ?? 12
  const minute = slot?.minute ?? 0

  let r: FourPillarsDetail
  try {
    r = calc(solar.year, solar.month, solar.day, hour, minute, gender)
  } catch (e) {
    return { ok: false, reason: e instanceof RangeError ? 'range' : 'invalid' }
  }

  const hourKnown = slot !== null
  const p = (x: { heavenlyStem: string; earthlyBranch: string }) => pillarOut(x.heavenlyStem as Stem, x.earthlyBranch as Branch)
  const pillars = { year: p(r.year), month: p(r.month), day: p(r.day), hour: hourKnown ? p(r.hour) : null }

  // 오행: 천간 + 지지(정기)
  const elements = Object.fromEntries(ELEMENTS.map((e) => [e, 0])) as Record<Element, number>
  const list = [pillars.year, pillars.month, pillars.day, ...(pillars.hour ? [pillars.hour] : [])]
  for (const q of list) {
    elements[q.stemElement]++
    elements[q.branchElement]++
  }

  // 십신: 일간 제외 천간 + 지지 전부
  const tg = r.tenGods
  const counts = Object.fromEntries(TEN_GODS.map((g) => [g, 0])) as Record<TenGod, number>
  const add = (g: TenGod) => void counts[g]++
  add(tg.year.stem); add(tg.year.branch)
  add(tg.month.stem); add(tg.month.branch)
  add(tg.day.branch)
  if (hourKnown) { add(tg.hour.stem); add(tg.hour.branch) }
  // 개수가 같으면 태어난 달(월지 → 월간)에 있는 십신을 먼저 본다(월령을 중시하는 전통 기준), 그다음 목록 순서
  const monthRank = (g: TenGod) => (g === tg.month.branch ? 0 : g === tg.month.stem ? 1 : 2)
  const ranked = [...TEN_GODS]
    .filter((g) => counts[g] > 0)
    .sort((a, b) => counts[b] - counts[a] || monthRank(a) - monthRank(b) || TEN_GODS.indexOf(a) - TEN_GODS.indexOf(b))
  const top = ranked.slice(0, 2)
  const tied = ranked.length > 2 && counts[ranked[1]] === counts[ranked[2]]

  const dayStem = pillars.day.stem
  const dayMaster = {
    stem: dayStem,
    element: pillars.day.stemElement,
    yinYang: pillars.day.stemYinYang,
    key: STEM_KEY[dayStem],
  }

  const age = asOfYear - solar.year
  const daeun = (r.luckPillars?.pillars ?? []).map((lp) => ({
    startAge: lp.age,
    countingAge: lp.age + 1,
    forward: r.luckPillars!.forward,
    korean: lp.korean,
    hanja: hanjaOf(lp.korean),
    isCurrent: age >= lp.age && age < lp.age + 10,
  }))

  const si = (((asOfYear - 4) % 10) + 10) % 10
  const bi = (((asOfYear - 4) % 12) + 12) % 12
  const seunKorean = STEMS[si] + BRANCHES[bi]

  const boundaryWarning: SajuResult['basis']['boundaryWarning'] =
    hourSlot === 'ja1'
      ? { kind: 'midnight', at: '23:00', alt: '다음 날짜로 보는 유파도 있어요' }
      : hourKnown
        ? null
        : jeolipWarning(solar, gender)

  return {
    ok: true,
    pillars,
    dayMaster,
    elements,
    tenGods: {
      counts,
      byPillar: {
        year: { stem: tg.year.stem, branch: tg.year.branch },
        month: { stem: tg.month.stem, branch: tg.month.branch },
        day: { branch: tg.day.branch },
        hour: hourKnown ? { stem: tg.hour.stem, branch: tg.hour.branch } : null,
      },
      top,
      tied,
    },
    daeun,
    seun: {
      year: asOfYear,
      korean: seunKorean,
      hanja: hanjaOf(seunKorean),
      stemTenGod: stemTenGod(dayStem, STEMS[si]),
      dayBranchRelation: branchRelationToMi(pillars.day.branch),
    },
    basis: {
      dayBoundary: 'midnight',
      dstApplied: DST_YEARS.has(solar.year),
      trueSolarTime: false,
      hourKnown,
      boundaryWarning,
    },
    solar,
  }
}
