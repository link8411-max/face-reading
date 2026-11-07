// 사주 엔진·문구·화면이 함께 쓰는 키와 타입. 값만 있고 로직은 없다. (설계: docs/superpowers/specs/2026-11-07-saju-engine-design.md)

export const STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'] as const
export type Stem = (typeof STEMS)[number]

export const BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'] as const
export type Branch = (typeof BRANCHES)[number]

export const ELEMENTS = ['목', '화', '토', '금', '수'] as const
export type Element = (typeof ELEMENTS)[number]

export const TEN_GODS = ['비견', '겁재', '식신', '상관', '편재', '정재', '편관', '정관', '편인', '정인'] as const
export type TenGod = (typeof TEN_GODS)[number]

/** 공유 링크 키(일간 10종). 생년월일·사주 글자는 링크에 넣지 않는다 */
export const STEM_KEY: Record<Stem, string> = {
  갑: 'gap', 을: 'eul', 병: 'byeong', 정: 'jeong', 무: 'mu', 기: 'gi', 경: 'gyeong', 신: 'sin', 임: 'im', 계: 'gye',
}
export const STEM_BY_KEY: Record<string, Stem> = Object.fromEntries(
  (Object.entries(STEM_KEY) as [Stem, string][]).map(([s, k]) => [k, s]),
) as Record<string, Stem>

/**
 * 태어난 시간 입력 칸 13개. 자시는 날짜 경계가 걸리므로 "밤 11~12시"와 "밤 12~1시"로 나눈다.
 * 엔진에는 칸의 가운데 시각(hour·minute)을 넘긴다. 자1·자2만 30분, 나머지는 구간 가운데 정시.
 */
export const HOUR_SLOTS = [
  { key: 'ja1', label: '밤 11~12시', hour: 23, minute: 30 },
  { key: 'ja2', label: '밤 12~1시', hour: 0, minute: 30 },
  { key: 'chuk', label: '새벽 1~3시', hour: 2, minute: 0 },
  { key: 'in', label: '새벽 3~5시', hour: 4, minute: 0 },
  { key: 'myo', label: '아침 5~7시', hour: 6, minute: 0 },
  { key: 'jin', label: '아침 7~9시', hour: 8, minute: 0 },
  { key: 'sa', label: '오전 9~11시', hour: 10, minute: 0 },
  { key: 'o', label: '낮 11~1시', hour: 12, minute: 0 },
  { key: 'mi', label: '오후 1~3시', hour: 14, minute: 0 },
  { key: 'sin', label: '오후 3~5시', hour: 16, minute: 0 },
  { key: 'yu', label: '저녁 5~7시', hour: 18, minute: 0 },
  { key: 'sul', label: '저녁 7~9시', hour: 20, minute: 0 },
  { key: 'hae', label: '밤 9~11시', hour: 22, minute: 0 },
] as const
export type HourSlotKey = (typeof HOUR_SLOTS)[number]['key']
export const HOUR_SLOT_BY_KEY: Record<HourSlotKey, (typeof HOUR_SLOTS)[number]> = Object.fromEntries(
  HOUR_SLOTS.map((s) => [s.key, s]),
) as Record<HourSlotKey, (typeof HOUR_SLOTS)[number]>
export function isHourSlotKey(s: unknown): s is HourSlotKey {
  return typeof s === 'string' && Object.hasOwn(HOUR_SLOT_BY_KEY, s)
}

export type RelationKind = '합' | '충' | '형' | '파' | '해' | '반합' | '같음' | '없음'
export type RelationStrength = 'strong' | 'weak' | 'none'
