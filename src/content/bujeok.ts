// 부적 문구. 응원의 말로 쓰고 효험을 단정하지 않는다. 화면 글에 오행 한자·십신 같은 말을 쓰지 않는다.
// hanja는 실제로 쓰이는 길상 문구만(소원 11개, 설계 16절) (전통 화풍 그림 속 글귀).
import type { ElKey, Finish, Wish } from '@/lib/bujeok/keys'

export const WISH_TEXT: Record<Wish, { label: string; hanja: string; hanjaMeaning: string; cutePhrase: string; sub: string }> = {
  money: { label: '재물', hanja: '招財進寶', hanjaMeaning: '재물을 부르고 보배가 들어온다는 뜻이에요', cutePhrase: '돈 모여라', sub: '모으는 재미가 붙는 한 해가 되기를 바라요' },
  pass: { label: '합격', hanja: '金榜題名', hanjaMeaning: '합격자 명단에 이름이 오른다는 뜻이에요', cutePhrase: '합격 가자', sub: '준비한 만큼 힘을 내기를 응원해요' },
  health: { label: '건강', hanja: '無病長壽', hanjaMeaning: '병 없이 오래 건강하라는 뜻이에요', cutePhrase: '튼튼 쑥쑥', sub: '몸도 마음도 편안하기를 바라요' },
  love: { label: '연애', hanja: '天生緣分', hanjaMeaning: '하늘이 맺어 준 인연이라는 뜻이에요', cutePhrase: '설렘 도착', sub: '좋은 인연을 만나기를 응원해요' },
  guard: { label: '액막이', hanja: '消災吉祥', hanjaMeaning: '나쁜 일은 사라지고 좋은 일이 온다는 뜻이에요', cutePhrase: '나쁜 건 저리 가', sub: '마음 편한 날이 이어지기를 바라요' },
  allgood: { label: '만사형통', hanja: '萬事亨通', hanjaMeaning: '모든 일이 뜻대로 술술 풀린다는 뜻이에요', cutePhrase: '술술 풀려라', sub: '하는 일마다 부드럽게 이어지기를 바라요' },
  career: { label: '취업·승진', hanja: '立身揚名', hanjaMeaning: '뜻을 세워 이름을 널리 떨친다는 뜻이에요', cutePhrase: '취뽀 가자', sub: '쌓아 온 노력이 빛나기를 응원해요' },
  business: { label: '사업·개업', hanja: '事業繁昌', hanjaMeaning: '하는 일이 크게 번창한다는 뜻이에요(개업 화환에 흔히 쓰는 말)', cutePhrase: '대박 나라', sub: '새 출발이 활짝 피어나기를 응원해요' },
  family: { label: '가족 평안', hanja: '家和萬事成', hanjaMeaning: '집안이 화목하면 모든 일이 잘 된다는 뜻이에요', cutePhrase: '우리 집 최고', sub: '우리 집에 웃음이 가득하기를 바라요' },
  samjae: { label: '삼재 막이', hanja: '三災消滅', hanjaMeaning: '세 가지 재난이 사라진다는 뜻이에요', cutePhrase: '삼재 저리 가', sub: '조심조심 편안히 지나가기를 바라요' },
  wish: { label: '소원성취', hanja: '所願成就', hanjaMeaning: '바라는 일이 이루어진다는 뜻이에요', cutePhrase: '소원 이뤄라', sub: '마음속 바람에 한 걸음 가까워지기를 응원해요' },
}

export const EL_TEXT: Record<ElKey, { name: string; line: string }> = {
  wood: { name: '나무의 기운', line: '나무의 기운을 채워 주는 부적이에요' },
  fire: { name: '불의 기운', line: '불의 기운을 채워 주는 부적이에요' },
  earth: { name: '흙의 기운', line: '흙의 기운을 채워 주는 부적이에요' },
  metal: { name: '쇠의 기운', line: '쇠의 기운을 채워 주는 부적이에요' },
  water: { name: '물의 기운', line: '물의 기운을 채워 주는 부적이에요' },
}

/** 소원별 검색어 로마자(예시 그림 파일 이름·scripts/bujeok-examples.mjs와 공용) */
export const WISH_SLUG: Record<Wish, string> = {
  money: 'jaemul', pass: 'hapgyeok', health: 'geongang', love: 'yeonae', guard: 'aengmagi', allgood: 'mansahyeongtong',
  career: 'chwieop-seungjin', business: 'saeop-gaeeop', family: 'gajok-pyeongan', samjae: 'samjae-magi', wish: 'sowon-seongchwi',
}

/** 예시 그림(공개 폴더, scripts/bujeok-examples.mjs가 만든다). 홀로그램은 정지 그림이 금박과 거의 같아 뽑지 않는다 */
export const EXAMPLE_W = 480
export const EXAMPLE_H = 1016
export const exampleSrc = (wish: Wish, finish: Exclude<Finish, 'holo'>) => `/bujeok/examples/${WISH_SLUG[wish]}-bujeok-${finish}.webp`
export const exampleAlt = (wish: Wish, finish: Exclude<Finish, 'holo'>) =>
  `${WISH_TEXT[wish].label} 부적 ${WISH_TEXT[wish].hanja} ${finish === 'gold' ? '금박' : '종이'} 잠금화면`
