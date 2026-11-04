// 월드컵 공유 링크 검사 (엣지·서버용: 인물 DB를 가져오므로 클라이언트 컴포넌트에서는 쓰지 않는다)
import { boardPool, isBoardKey, type BoardKey } from '@/lib/cup/boards'
import { cupPhrase } from '@/lib/cup/share'
import { getCharacterById } from '@/lib/samgukDB'

/** 공유 링크 검사: 판 키가 맞고 그 판 후보(초상화 있는 인물)에 든 id만 받는다. 아니면 null */
export function parseCupShare(
  board: string,
  id: string,
): { board: BoardKey; id: string; name: string; image: string; phrase: string } | null {
  if (!isBoardKey(board)) return null
  if (!boardPool(board).includes(id)) return null
  const c = getCharacterById(id)
  if (!c) return null
  return { board, id, name: c.name, image: `/images/samguk/${c.name}.jpg`, phrase: cupPhrase(c.name) }
}
