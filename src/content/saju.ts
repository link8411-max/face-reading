// 사주 풀이 문구. 규칙은 tests/saju/copy.test.ts가 막는다(해요체, 이모지·금지어·평가어·예언어 없음, 난수 없음).
// 설계: docs/superpowers/specs/2026-11-07-saju-engine-design.md ("신뢰 장치", "쉬운 말 번역")
import { ELEMENTS, type Element, type RelationKind, type Stem, type TenGod } from '@/lib/saju/keys';

/** 일간 10종: 나를 비유하는 한 줄. 좋고 나쁨이 아니라 결의 차이로만 말한다 */
export const DAY_MASTER_COPY: Record<Stem, { title: string; line: string }> = {
  갑: { title: '나는 큰 나무예요', line: '곧게 위로 뻗는 결이라, 방향이 정해지면 꾸준히 자라는 힘으로 풀어요.' },
  을: { title: '나는 들꽃이에요', line: '바람에 휘어도 다시 피어나는 결이라, 환경에 맞춰 부드럽게 길을 찾는 힘으로 풀어요.' },
  병: { title: '나는 한낮의 해예요', line: '넓게 비추는 결이라, 있는 곳을 밝고 환하게 만드는 힘으로 풀어요.' },
  정: { title: '나는 촛불이에요', line: '가까이서 따뜻하게 밝히는 결이라, 한 사람 한 사람을 세심하게 챙기는 힘으로 풀어요.' },
  무: { title: '나는 너른 산이에요', line: '묵직하게 자리를 지키는 결이라, 주변이 기대어 쉴 수 있는 중심이 되는 힘으로 풀어요.' },
  기: { title: '나는 기름진 밭이에요', line: '무엇이든 품어 키우는 결이라, 사람과 일을 차분히 자라게 하는 힘으로 풀어요.' },
  경: { title: '나는 바위예요', line: '단단하고 곧은 결이라, 한번 마음먹으면 흔들리지 않고 해내는 힘으로 풀어요.' },
  신: { title: '나는 보석이에요', line: '섬세하게 빛나는 결이라, 작은 차이까지 알아보고 다듬는 힘으로 풀어요.' },
  임: { title: '나는 큰 강이에요', line: '넓게 흐르는 결이라, 많은 것을 담아 멀리 가는 힘으로 풀어요.' },
  계: { title: '나는 봄비예요', line: '조용히 스며드는 결이라, 눈에 띄지 않게 마음을 적시고 생각을 깊게 하는 힘으로 풀어요.' },
};

/** 십신: 쉬운 이름 + 뜻 + 많을 때·없을 때(둘 다 긍정 프레이밍) */
export const TEN_GOD_COPY: Record<TenGod, { easy: string; meaning: string; many: string; none: string }> = {
  비견: {
    easy: '나란히',
    meaning: '나와 같은 결의 기운이라, 곁에서 나란히 걷는 힘으로 풀어요.',
    many: '믿는 사람과 나란히 갈 때 힘이 나고, 내 중심이 단단한 쪽으로 풀어요.',
    none: '혼자 길을 내는 힘이 있어, 스스로 정하고 움직이는 일이 편한 쪽으로 풀어요.',
  },
  겁재: {
    easy: '승부욕',
    meaning: '나와 같은 결이지만 겨루는 맛이 있는 기운이라, 지고 싶지 않은 마음으로 풀어요.',
    many: '경쟁할 때 집중력이 올라가고, 목표가 생기면 끝까지 밀어붙이는 쪽으로 풀어요.',
    none: '남과 견주기보다 내 속도로 가는 쪽이라, 마음이 한결 느긋한 쪽으로 풀어요.',
  },
  식신: {
    easy: '즐기는 재주',
    meaning: '내 안의 것을 편안하게 내놓는 기운이라, 좋아하는 일을 즐기며 해내는 힘으로 풀어요.',
    many: '만들고 먹고 놀면서 재주를 키우는 쪽이라, 여유 있게 결과를 내는 쪽으로 풀어요.',
    none: '즐기기보다 목표를 향해 곧장 가는 쪽이라, 집중해서 해내는 힘이 두드러지는 쪽으로 풀어요.',
  },
  상관: {
    easy: '톡톡 표현',
    meaning: '생각을 숨기지 않고 꺼내는 기운이라, 새롭고 솔직하게 표현하는 힘으로 풀어요.',
    many: '아이디어와 말솜씨가 풍성해서, 틀을 깨는 새 시도에 강한 쪽으로 풀어요.',
    none: '말을 고르고 고르는 쪽이라, 신중하고 차분하게 의견을 전하는 쪽으로 풀어요.',
  },
  편재: {
    easy: '넓은 활동',
    meaning: '움직이는 만큼 기회가 따르는 기운이라, 사람과 일을 넓게 다루는 힘으로 풀어요.',
    many: '사람을 만나고 판을 넓힐수록 활기가 도는 쪽이라, 기회를 잘 알아보는 쪽으로 풀어요.',
    none: '한 분야를 깊게 파는 쪽이라, 차분히 쌓아 가는 힘이 두드러지는 쪽으로 풀어요.',
  },
  정재: {
    easy: '꼼꼼한 살림',
    meaning: '정해진 것을 차곡차곡 쌓는 기운이라, 꼼꼼하게 관리하는 힘으로 풀어요.',
    many: '계획을 세워 꾸준히 모으고 지키는 쪽이라, 안정적으로 쌓아 가는 쪽으로 풀어요.',
    none: '정해진 틀에 매이지 않는 쪽이라, 상황에 맞춰 유연하게 움직이는 쪽으로 풀어요.',
  },
  편관: {
    easy: '도전 압력',
    meaning: '나를 몰아붙여 키우는 기운이라, 어려운 과제 앞에서 힘이 나는 쪽으로 풀어요.',
    many: '부담되는 일 앞에서 오히려 집중하고, 도전을 통해 크게 자라는 쪽으로 풀어요.',
    none: '남이 정해 준 압박이 적은 쪽이라, 내 페이스로 일을 이끌기 좋은 쪽으로 풀어요.',
  },
  정관: {
    easy: '반듯한 틀',
    meaning: '질서와 약속을 지키는 기운이라, 반듯하게 책임을 다하는 힘으로 풀어요.',
    many: '규칙과 신뢰를 중요하게 여기는 쪽이라, 맡은 일을 믿음직하게 해내는 쪽으로 풀어요.',
    none: '틀에 얽매이지 않는 쪽이라, 자유롭게 방식을 만들어 가는 쪽으로 풀어요.',
  },
  편인: {
    easy: '특별한 배움',
    meaning: '남다른 관심에서 오는 기운이라, 독특한 분야를 파고드는 힘으로 풀어요.',
    many: '한 가지에 깊이 빠져 남다른 시각을 만드는 쪽이라, 직관이 잘 살아나는 쪽으로 풀어요.',
    none: '배움이 현실과 맞닿는 쪽이라, 배운 것을 바로 써먹는 힘이 두드러지는 쪽으로 풀어요.',
  },
  정인: {
    easy: '든든한 배움',
    meaning: '받아들여 내 것으로 만드는 기운이라, 차근차근 배우고 보살핌을 받는 힘으로 풀어요.',
    many: '공부와 자격, 좋은 어른의 도움이 닿기 쉬워서, 배운 만큼 든든해지는 쪽으로 풀어요.',
    none: '스스로 부딪히며 배우는 쪽이라, 몸으로 익힌 경험이 단단한 쪽으로 풀어요.',
  },
};

/** 오행 쉬운 이름 + 강할 때·약할 때 한 줄 */
export const ELEMENT_COPY: Record<Element, { easy: string; strong: string; weak: string }> = {
  목: { easy: '새싹(목)', strong: '새싹(목)이 많아서 시작하고 뻗어 나가는 힘이 넉넉한 쪽으로 풀어요.', weak: '새싹(목)이 적은 편이라 한 번에 하나씩 천천히 키우는 쪽이 어울려요.' },
  화: { easy: '불꽃(화)', strong: '불꽃(화)이 많아서 열정과 표현이 빠르게 올라오는 쪽으로 풀어요.', weak: '불꽃(화)이 적은 편이라 차분하게 온도를 조절하며 가는 쪽이 어울려요.' },
  토: { easy: '대지(토)', strong: '대지(토)가 많아서 믿음직하고 중심이 단단한 쪽으로 풀어요.', weak: '대지(토)가 적은 편이라 가볍고 빠르게 움직이는 쪽이 어울려요.' },
  금: { easy: '칼날(금)', strong: '칼날(금)이 많아서 결단력과 마무리 힘이 또렷한 쪽으로 풀어요.', weak: '칼날(금)이 적은 편이라 부드럽게 흐름을 맞추는 쪽이 어울려요.' },
  수: { easy: '물결(수)', strong: '물결(수)이 많아서 생각이 깊고 적응이 빠른 쪽으로 풀어요.', weak: '물결(수)이 적은 편이라 눈앞의 일에 곧바로 뛰어드는 쪽이 어울려요.' },
};

/** 일지와 올해 지지의 관계. 강한 관계(합·충)와 약한 관계(반합·파·해)는 문구 강도를 다르게 */
export const RELATION_COPY: Record<RelationKind, string> = {
  합: '서로 끌어당겨 어우러져요',
  충: '부딪히며 변화가 생겨요',
  형: '마찰이 있지만 다듬는 과정이에요',
  파: '계획이 살짝 틀어질 수 있어 점검해 두면 좋아요',
  해: '사소한 오해가 생길 수 있어 소통을 챙기면 좋아요',
  반합: '슬며시 손을 잡는 정도라 은근히 어우러져요',
  같음: '같은 글자라 익숙한 흐름이에요',
  없음: '특별한 합·충 없이 담담한 해예요',
};

/** 대운 한 구간. countingAge는 세는 나이 */
export const DAEUN_TEMPLATE = (p: { countingAge: number; korean: string; tenGodEasy: string }): string =>
  `약 ${p.countingAge}세(세는 나이)부터 ${p.korean} 대운이에요. ${p.tenGodEasy} 쪽 기운이 도는 10년으로 풀어요. 정해진 길이 아니라 참고용이에요.`;

/** 올해(세운)와 나 */
export const SEUN_TEMPLATE = (p: { dayMasterTitle: string; tenGodEasy: string; relationLine: string }): string =>
  `${p.dayMasterTitle}. 올해는 ${p.tenGodEasy} 쪽 흐름이 들어오는 해로 풀어요. 내 일지와는 ${p.relationLine}. 어떻게 쓸지는 내 몫이에요.`;

const NUM = ['없', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟'];
function hasBatchim(s: string): boolean {
  const c = s.charCodeAt(s.length - 1) - 0xac00;
  return c >= 0 && c <= 11171 && c % 28 !== 0;
}
function countWord(n: number): string {
  return NUM[n] && n > 0 ? NUM[n] : String(n);
}
/** 숫자 단어 뒤에 "라/이라"를 붙인다 (하나라, 둘이라, 셋이라) */
function withRa(word: string): string {
  return hasBatchim(word) ? `${word}이라` : `${word}라`;
}

/** 근거 꼬리: "정재가 둘이라" */
export function evidenceTail(tenGod: TenGod, count: number): string {
  const josa = hasBatchim(tenGod) ? '이' : '가';
  if (count <= 0) return `${tenGod}${josa} 없어서`;
  return `${tenGod}${josa} ${withRa(countWord(count))}`;
}

type CautionCopy = { situation: string; action: string };

const CAUTION_MANY: Record<Element, CautionCopy> = {
  목: { situation: '새싹(목)이 많으면 계획을 자꾸 넓히다가 하나를 놓치기 쉬운 해예요.', action: '이번 달 할 일을 세 가지로만 줄여 적어 보세요.' },
  화: { situation: '불꽃(화)이 많으면 결정을 빨리 내리려고 하기 쉬운 해예요.', action: '큰 결정은 하룻밤 지나서 한 번 더 읽어 보고 확정하세요.' },
  토: { situation: '대지(토)가 많으면 익숙한 자리를 지키느라 새 시도를 미루기 쉬운 상황이에요.', action: '이번 주에 안 해 본 일을 하나만 가볍게 해 보세요.' },
  금: { situation: '칼날(금)이 많으면 기준이 엄격해져 스스로를 몰아붙이기 쉬운 해예요.', action: '하루 끝에 잘한 일을 한 줄 적고 마무리하세요.' },
  수: { situation: '물결(수)이 많으면 생각이 꼬리를 물어 행동이 늦어지기 쉬운 상황이에요.', action: '고민이 길어지면 타이머 10분을 맞추고 일단 한 걸음 움직이세요.' },
};

const CAUTION_NONE: Record<Element, CautionCopy> = {
  목: { situation: '뻗어 나가는 새싹(목)이 없어, 시작할 때 한 발 늦춰지기 쉬운 상황이에요.', action: '작은 시작 하나를 오늘 안에 해 보세요.' },
  화: { situation: '따뜻하게 달궈 주는 불꽃(화)이 없어, 마음을 겉으로 꺼내기 어려워지기 쉬운 상황이에요.', action: '고마운 마음을 한 사람에게 말로 전해 보세요.' },
  토: { situation: '중심을 잡아 주는 대지(토)가 없어, 마음이 바쁘게 움직이기 쉬워요.', action: '하루 한 번 같은 시간에 쉬는 루틴을 정해 두세요.' },
  금: { situation: '매듭을 지어 주는 칼날(금)이 없어, 일을 벌여 놓고 마무리가 늘어지기 쉬운 상황이에요.', action: '진행 중인 일마다 마감일을 하나씩 적어 두세요.' },
  수: { situation: '식혀 주는 물결(수)이 없어, 쉬어야 할 때도 계속 움직이기 쉬운 상황이에요.', action: '잠들기 전 10분은 화면을 끄고 조용히 보내 보세요.' },
};

const CAUTION_BALANCED: CautionCopy = {
  situation: '다섯 기운이 고르게 있어 어느 한쪽으로 크게 치우치지 않는 해예요.',
  action: '이번 달에 가장 하고 싶은 일 하나를 골라 먼저 시작하세요.',
};

/** 조심할 점 하나: 가장 많은 오행 → 없는 오행(목화토금수 순 첫째) → 균형형 */
export function cautionFor(elements: Record<Element, number>, total: number): { situation: string; action: string; basis: string } {
  const threshold = Math.max(1, Math.round(total / 2));
  let top: Element | null = null;
  for (const e of ELEMENTS) {
    if (elements[e] >= threshold && (top === null || elements[e] > elements[top])) top = e;
  }
  if (top) {
    return { ...CAUTION_MANY[top], basis: `${ELEMENT_COPY[top].easy}이 ${withRa(countWord(elements[top]))}` };
  }
  const none = ELEMENTS.find((e) => elements[e] === 0);
  if (none) {
    return { ...CAUTION_NONE[none], basis: `${ELEMENT_COPY[none].easy}이 없어서` };
  }
  return { ...CAUTION_BALANCED, basis: '다섯 기운이 고르게 있어서' };
}

/** "어떻게 계산했나요" 접이식 4줄 + 시간 모름 + 경계 안내 */
export const BASIS_COPY = {
  jeolgi: '절기 들어오는 시각으로 달을 나눴어요',
  dayBoundary: '밤 11시~12시는 그 날짜로 봤어요',
  dst: '1948~60·1987~88년생은 서머타임을 반영했어요',
  trueSolar: '경도 보정(진태양시)은 하지 않았어요',
  hourUnknown: '태어난 시간을 몰라 세 기둥으로 봤어요. 시간을 알면 시주까지 볼 수 있어요',
  boundaryJeolip: (at: string, alt: string): string =>
    `이날 ${at}에 절기가 바뀌어요. 태어난 시간에 따라 ${alt}일 수도 있어요`,
  boundaryMidnight: '밤 11~12시는 그 날짜로 봤어요. 날짜 기준이 다르면 일주가 달라질 수 있어요',
};

export const SOURCE_LINE = '절기·음력은 한국천문연구원 역법 데이터를 담은 만세력 라이브러리 기준이에요. 해석은 유파에 따라 다를 수 있어요.';
export const DISCLAIMER = '사주는 오랜 전통의 해석 놀이이고 과학적 진단이 아니에요. 재미로 읽고, 중요한 결정의 근거로 삼지 말아 주세요.';
