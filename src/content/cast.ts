// 캐릭터(여섯 + 새 멤버 셋): 테스트 얼굴·결과 카드·분석 화면·미리보기 이미지가 모두 여기서 읽는다.
export type CastKey = 'haetae' | 'saja' | 'gumiho' | 'mudang' | 'tiger' | 'dokkaebi' | 'sajaF' | 'sajaElder' | 'baksu'

export interface CastInfo {
  name: string
  en: string
  bg: string
  role: string
  img: string // 720×960 (3:4) 큰 그림
  face: string // 240px 얼굴
  og: string // 512px 미리보기 이미지용 PNG
}

const make = (key: CastKey, name: string, en: string, bg: string, role: string): CastInfo => ({
  name, en, bg, role,
  img: `/images/cast/${key}.webp`,
  face: `/images/cast/${key}-face.webp`,
  og: `/images/cast/${key}-og.png`,
})

export const CAST: Record<CastKey, CastInfo> = {
  haetae: make('haetae', '해태', 'Haetae', '#2A2116', '관상을 맡아요'),
  saja: make('saja', '저승사자', 'Jeoseung Saja', '#141B3A', '사주와 운세를 맡아요'),
  gumiho: make('gumiho', '구미호', 'Gumiho', '#1E1838', '궁합을 맡아요'),
  mudang: make('mudang', '무당', 'Mudang', '#2A1418', '부적을 맡아요'),
  tiger: make('tiger', '백호', 'Baekho', '#1B2436', '동물상을 맡아요'),
  dokkaebi: make('dokkaebi', '도깨비', 'Dokkaebi', '#10261F', '게임과 시험을 맡아요'),
  // 새 멤버(2026-11-14): 오늘의 운세·띠별 운세 담당
  sajaF: make('sajaF', '저승사자 막내', 'Little Reaper', '#161B38', '오늘의 운세를 맡아요'),
  sajaElder: make('sajaElder', '저승사자 선배', 'Elder Reaper', '#1A2030', '신년운세를 맡아요'),
  baksu: make('baksu', '박수무당', 'Baksu Shaman', '#12224A', '띠별 풀이를 맡아요'),
}

const under = (p: string, base: string) => p === base || p.startsWith(base + '/')

/** 주소(쿼리·해시 무시)에 맞는 캐릭터. 삼국지 닮은꼴·열전 등은 null(초상화가 주인공). */
export function castForHref(href: string): CastKey | null {
  const p = href.split(/[?#]/)[0].replace(/(.)\/$/, '$1')
  if (p === '/face2' || p === '/face-tests') return 'haetae'
  if (p === '/animal') return 'tiger'
  if (p === '/face-match' || under(p, '/mbti')) return 'gumiho'
  if (p === '/fortune/mbti') return 'gumiho'
  if (p === '/fortune/daily' || p === '/today') return 'sajaF'
  if (p === '/fortune') return 'sajaElder'
  if (under(p, '/fortune/2027')) return 'baksu' // 띠별: 신년운세(선배)와 같은 그림이 홈 운세 칩에 두 번 나오지 않게
  if (p === '/saju' || p === '/unse' || under(p, '/fortune')) return 'saja'
  if (under(p, '/bujeok')) return 'mudang'
  if (under(p, '/exam') || under(p, '/samguk/cup') || under(p, '/samguk/duel')) return 'dokkaebi'
  return null
}
