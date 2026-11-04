// 월드컵 카드 타입. 클라이언트 컴포넌트도 가져오므로 열전 본문(@/content)을 import하지 않는다.
import type { Source } from '@/content/samgukPeople/types'

export interface CupCard {
  id: string
  name: string
  faction: '위' | '촉' | '오' | '기타'
  portrait: string
  line: string
  facts: string[]
}

export interface MeetNote {
  note: string
  source: Source
}
