// 월드컵 공유 링크·미리보기·문구 (클라이언트 안전: 열전 본문을 가져오지 않는다)
import { SITE, UTM } from '@/lib/shareBase'
import type { BoardKey } from '@/lib/cup/boards'

export function cupSharePath(board: BoardKey, id: string): string {
  return `/samguk/cup/r/${board}/${id}`
}

export function cupShareUrl(board: BoardKey, id: string): string {
  return `${SITE}${cupSharePath(board, id)}?${UTM('cup')}`
}

export function cupOgImageUrl(board: BoardKey, id: string): string {
  return `${SITE}/api/og/result?kind=cup&board=${board}&key=${id}`
}

export function cupPhrase(name: string): string {
  return `나의 최애 장수는 ${name}. 너는?`
}

/** 판 이름 앞에 '삼국지'를 한 번만 붙인 월드컵 이름: 삼국지 최강 무장 월드컵, 삼국지 여인 월드컵 */
export function cupName(boardTitle: string): string {
  return `${boardTitle.startsWith('삼국지') ? boardTitle : `삼국지 ${boardTitle}`} 월드컵`
}
