// 밈 능력고사 공용 타입. 클라이언트와 스크립트가 함께 쓰므로 데이터 모듈을 가져오지 않는다.
export type Kind = 'abbr' | 'word' | 'person' | 'story' | 'play' | 'code'
export type When = '1990s' | '2000s' | '2010s' | '2020s' | `${number}`

export interface SkitLine {
  who: string
  text: string // 빈칸은 "____"
}

export interface Skit {
  form: 'blank' | 'reply' | 'card' // 빈칸 넣기 · 답장 고르기 · 글 카드(상황 밈)
  lines: SkitLine[] // card면 [{who:'카드', text}] 뒤에 [{who:'질문', text}]
  options: string[] // 섞지 않은 원래 순서
  answer: number // 정답 위치
  right?: string // 상대의 반응(blank·reply만). 말한 사람은 lines[0].who
  wrong?: string
  timeout?: string
}

export interface Card {
  term: string
  kind: Kind
  era: 'retro' | 'now'
  when: When
  level: 1 | 2 | 3
  gloss: string
  expansion?: string
  meaning: string
  usage: string
  origin: string
  sources: string[]
  skit?: Skit
}

export type QType = 'meaning' | 'name' | 'unpack' | 'pack' | 'ox' | 'skit'

export interface Question {
  term: string
  kind: Kind
  when: When
  badge: string
  level: 1 | 2 | 3
  type: QType
  ask: string // skit이면 빈 문자열
  show?: string
  options: string[] // 이미 섞인 순서
  answer: number
  skit?: Skit // type === 'skit'. options/answer는 skit 것을 섞은 값
  explain: { meaning: string; usage: string; origin: string }
}

export interface Round {
  round: number
  questions: Question[] // 항상 5문제
}
