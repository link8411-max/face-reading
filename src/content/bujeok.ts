// 부적 문구. 응원의 말로 쓰고 효험을 단정하지 않는다. 화면 글에 오행 한자·십신 같은 말을 쓰지 않는다.
// hanja는 실제로 쓰이는 길상 문구만 (전통 화풍 그림 속 글귀).
import type { ElKey, Wish } from '@/lib/bujeok/keys'

export const WISH_TEXT: Record<Wish, { label: string; hanja: string; hanjaMeaning: string; cutePhrase: string; sub: string }> = {
  money: { label: '재물', hanja: '招財進寶', hanjaMeaning: '재물을 부르고 보배가 들어온다는 뜻이에요', cutePhrase: '돈 들어온다', sub: '모으는 재미가 붙는 한 해가 되기를 바라요' },
  pass: { label: '합격', hanja: '金榜題名', hanjaMeaning: '합격자 명단에 이름이 오른다는 뜻이에요', cutePhrase: '합격 가자', sub: '준비한 만큼 힘을 내기를 응원해요' },
  health: { label: '건강', hanja: '無病長壽', hanjaMeaning: '병 없이 오래 건강하라는 뜻이에요', cutePhrase: '튼튼 쑥쑥', sub: '몸도 마음도 편안하기를 바라요' },
  love: { label: '연애', hanja: '天生緣分', hanjaMeaning: '하늘이 맺어 준 인연이라는 뜻이에요', cutePhrase: '설렘 도착', sub: '좋은 인연을 만나기를 응원해요' },
  guard: { label: '액막이', hanja: '消災吉祥', hanjaMeaning: '나쁜 일은 사라지고 좋은 일이 온다는 뜻이에요', cutePhrase: '나쁜 건 저리 가', sub: '마음 편한 날이 이어지기를 바라요' },
}

export const EL_TEXT: Record<ElKey, { name: string; line: string }> = {
  wood: { name: '나무의 기운', line: '나무의 기운을 채워 주는 부적이에요' },
  fire: { name: '불의 기운', line: '불의 기운을 채워 주는 부적이에요' },
  earth: { name: '흙의 기운', line: '흙의 기운을 채워 주는 부적이에요' },
  metal: { name: '쇠의 기운', line: '쇠의 기운을 채워 주는 부적이에요' },
  water: { name: '물의 기운', line: '물의 기운을 채워 주는 부적이에요' },
}
