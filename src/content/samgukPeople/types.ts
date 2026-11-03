// 삼국지 인물열전 데이터 형식. 근거: 진수 『삼국지』(정사), 배송지 주, 나관중 『삼국지연의』.

export type Source = '정사' | '배송지 주' | '연의'

export type RelationType = '군신' | '의형제' | '부자' | '형제' | '부부' | '혼인' | '사촌' | '라이벌' | '원수'

// 혈연으로 묶어 보여 주는 관계
export const KIN_TYPES: RelationType[] = ['부자', '형제', '부부', '혼인', '사촌']

export const VERDICTS = [
  { key: 'loyal', label: '충신' },
  { key: 'righteous', label: '의리파' },
  { key: 'brave', label: '용장' },
  { key: 'strategist', label: '책략가' },
  { key: 'ambitious', label: '야심가' },
  { key: 'tragic', label: '비운의 영웅' },
  { key: 'overrated', label: '과대평가' },
  { key: 'underrated', label: '저평가' },
] as const

export type VerdictKey = (typeof VERDICTS)[number]['key']

export interface PersonEntry {
  id: string // samgukDB id
  style: string | null // 자(字) 한글, 없으면 null
  styleHanja: string | null
  born: number | null // 연도, 모르면 null
  died: number | null
  birthplace: string | null
  summary: string // 2~3문장, 60~200자
  tags: string[] // 3~5개
  nameMeaning: string // 이름·자 뜻 한두 문장
  weapon: { novel: string | null; history: string | null } // 정사 기록 없으면 null
  famousQuote: { text: string; source: Source }
  life: string // 연의로 보는 생애(최후·묘 포함), 600~1200자, 문단은 \n\n
  historyNote: string // 정사로 본 실제 모습, 150~400자
  battles: { name: string; year: number | null; role: string; source: Source }[] // 2개 이상
  relations: { id?: string; name?: string; type: RelationType; note: string; source: Source }[] // id 또는 name 하나는 필수
  novelVsHistory: string[] // 2~4개
  rivalId: string // PEOPLE 안의 다른 id
  sceneOptions: { key: string; label: string; source: Source }[] // 3~4개, key는 영문 소문자·밑줄
  verdictOptions: VerdictKey[] // 4개
}
