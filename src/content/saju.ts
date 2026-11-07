// 사주 풀이 문구. 규칙은 tests/saju/copy.test.ts가 막는다(해요체, 이모지·금지어·평가어·예언어 없음, 난수 없음).
// 설계: docs/superpowers/specs/2026-11-07-saju-engine-design.md ("신뢰 장치", "쉬운 말 규칙 추가")
// 모든 풀이는 { text, basis }: text(본문)에는 전통 용어(십신·간지·오행 한자·대운·세운·일간·일지)를 쓰지 않고,
// 전통 용어는 작은 회색 꼬리 줄 basis에만 둔다.
import { ELEMENTS, STEMS, type Branch, type Element, type RelationKind, type Stem, type TenGod } from '@/lib/saju/keys';

export type Reading = { text: string; basis: string };

/** 일간 10종: "나는 ○○ 같은 사람이에요" + 행동 한 문장 + 어떤 상황에 좋은지 한 문장 */
export const DAY_MASTER_COPY: Record<Stem, { title: string; text: string; basis: string }> = {
  갑: { title: '나는 큰 나무 같은 사람이에요', text: '한 번 방향을 잡으면 곧게 위로 뻗어 가는 편이에요. 목표가 분명한 일을 꾸준히 키워 갈 때 잘 맞아요.', basis: '갑목 일간 · 새싹(목)' },
  을: { title: '나는 들꽃 같은 사람이에요', text: '환경이 바뀌어도 부드럽게 맞춰 가며 길을 찾는 편이에요. 변화가 많은 곳이나 사람 사이를 잇는 일에 잘 맞아요.', basis: '을목 일간 · 새싹(목)' },
  병: { title: '나는 한낮의 해 같은 사람이에요', text: '있는 자리를 밝고 환하게 만드는 편이에요. 사람들 앞에 서거나 분위기를 띄워야 하는 일에 잘 맞아요.', basis: '병화 일간 · 불꽃(화)' },
  정: { title: '나는 촛불 같은 사람이에요', text: '가까운 사람을 세심하게 챙기며 따뜻하게 밝혀 주는 편이에요. 한 사람 한 사람과 깊게 마주하는 일에 잘 맞아요.', basis: '정화 일간 · 불꽃(화)' },
  무: { title: '나는 너른 산 같은 사람이에요', text: '쉽게 흔들리지 않고 묵직하게 자리를 지키는 편이에요. 주변이 기대어 쉴 중심이 필요한 일에 잘 맞아요.', basis: '무토 일간 · 대지(토)' },
  기: { title: '나는 기름진 밭 같은 사람이에요', text: '사람과 일을 품어 차분히 자라게 하는 편이에요. 오래 돌보고 키워야 하는 일에 잘 맞아요.', basis: '기토 일간 · 대지(토)' },
  경: { title: '나는 바위 같은 사람이에요', text: '한번 정하면 깔끔하게 끊고 가는 편이에요. 결단이 필요한 일이나 원칙을 지켜야 하는 일에 잘 맞아요.', basis: '경금 일간 · 칼날(금)' },
  신: { title: '나는 보석 같은 사람이에요', text: '작은 차이까지 알아보고 섬세하게 다듬는 편이에요. 완성도가 중요한 일이나 세밀한 작업에 잘 맞아요.', basis: '신금 일간 · 칼날(금)' },
  임: { title: '나는 큰 강 같은 사람이에요', text: '생각과 마음이 넓게 흘러서 많은 것을 담고 멀리 가는 편이에요. 여러 분야를 넘나들거나 큰 그림을 그리는 일에 잘 맞아요.', basis: '임수 일간 · 물결(수)' },
  계: { title: '나는 봄비 같은 사람이에요', text: '조용히 스며들듯 마음을 헤아리고 생각을 깊게 하는 편이에요. 차분히 듣고 살펴야 하는 일에 잘 맞아요.', basis: '계수 일간 · 물결(수)' },
};

/** 십신 10종: 짧은 이름표 + 두 문장(text) + 대운용 한 줄(period) + 세운용 한 문장(year). 꼬리 줄은 tenGodBasis */
export const TEN_GOD_COPY: Record<TenGod, { label: string; text: string; period: string; year: string }> = {
  비견: { label: '독립심', text: '무슨 일이든 내 힘으로 해내려는 편이에요. 믿는 사람과 나란히 달릴 때 힘이 더 나요.', period: '내 힘을 믿고 나아가는 시기', year: '올해는 내 뜻대로 밀고 나가려는 마음이 커지는 해예요.' },
  겁재: { label: '승부욕', text: '지고 싶지 않은 마음이 들면 집중력이 확 올라가는 편이에요. 경쟁이 있거나 목표가 뚜렷한 일에서 빛나요.', period: '겨루며 실력을 키우는 시기', year: '올해는 경쟁심이 살아나서 목표에 힘을 쏟기 쉬운 해예요.' },
  식신: { label: '즐기는 재주', text: '좋아하는 일은 여유롭게 즐기면서 결과까지 내는 편이에요. 만들기나 요리처럼 손으로 하는 일에 잘 맞아요.', period: '좋아하는 일을 즐기며 키우는 시기', year: '올해는 하고 싶은 일을 편하게 풀어 내기 좋은 해예요.' },
  상관: { label: '톡톡 표현', text: '생각이 떠오르면 숨기지 않고 솔직하게 꺼내는 편이에요. 새 아이디어가 필요한 일이나 사람 앞에 서는 일에 잘 맞아요.', period: '나를 표현하며 드러내는 시기', year: '올해는 하고 싶은 말과 새 아이디어가 많아지는 해예요.' },
  편재: { label: '넓은 활동', text: '사람을 만나고 판을 넓힐수록 기운이 나는 편이에요. 여러 곳을 오가거나 기회를 찾아다니는 일에 잘 맞아요.', period: '기회를 넓게 찾아 나서는 시기', year: '올해는 새 사람과 기회를 만날 일이 늘어나기 쉬운 해예요.' },
  정재: { label: '꼼꼼한 살림', text: '계획을 세워 차곡차곡 모으고 지키는 편이에요. 돈이나 시간을 관리하는 일에 잘 맞아요.', period: '돈을 꾸준히 모으는 시기', year: '올해는 내 살림을 차분히 정리하기 좋은 해예요.' },
  편관: { label: '도전 의욕', text: '어려운 과제를 만나면 오히려 머리가 또렷해지는 편이에요. 부담이 큰 프로젝트나 빠르게 돌아가는 현장에 잘 맞아요.', period: '큰 과제에 부딪히며 자라는 시기', year: '올해는 부담되는 일이 생겨도 해내는 힘이 붙기 쉬운 해예요.' },
  정관: { label: '책임감', text: '맡은 일은 끝까지 해내는 편이에요. 규칙이 분명하고 신뢰가 중요한 곳에서 더 잘 돼요.', period: '신뢰를 차곡차곡 쌓는 시기', year: '올해는 맡은 일에 대한 믿음이 쌓이기 쉬운 해예요.' },
  편인: { label: '남다른 관심', text: '남들이 잘 안 보는 분야에 깊이 빠져드는 편이에요. 독특한 아이디어나 연구가 필요한 일에 잘 맞아요.', period: '나만의 관심사를 파고드는 시기', year: '올해는 낯선 분야에 눈길이 가기 쉬운 해예요.' },
  정인: { label: '든든한 배움', text: '차근차근 배우고 도움을 받아 내 것으로 만드는 편이에요. 공부나 자격 준비처럼 쌓아 가는 일에 잘 맞아요.', period: '배우며 든든히 채우는 시기', year: '올해는 배움과 도움이 따르기 쉬운 해예요.' },
};

/** 십신 꼬리 줄: "정재 2개" */
export function tenGodBasis(g: TenGod, count: number): string {
  return `${g} ${count}개`;
}

/** 오행 쉬운 이름(본문에 써도 되는 이름)과 한자(작은 회색으로만) */
export const ELEMENT_COPY: Record<Element, { easy: string; hanja: string }> = {
  목: { easy: '새싹', hanja: '木' },
  화: { easy: '불꽃', hanja: '火' },
  토: { easy: '대지', hanja: '土' },
  금: { easy: '칼날', hanja: '金' },
  수: { easy: '물결', hanja: '水' },
};

/** 일간 기준 다른 천간의 십신 (엔진 stemTenGod와 같은 결과. 클라이언트 번들에 만세력 라이브러리를 싣지 않으려고 따로 둔다) */
const STEM_ELEMENT: Record<Stem, number> = { 갑: 0, 을: 0, 병: 1, 정: 1, 무: 2, 기: 2, 경: 3, 신: 3, 임: 4, 계: 4 };
export function tenGodOfStem(day: Stem, target: Stem): TenGod {
  const d = STEM_ELEMENT[day];
  const t = STEM_ELEMENT[target];
  const same = STEMS.indexOf(day) % 2 === STEMS.indexOf(target) % 2;
  const diff = (t - d + 5) % 5;
  const pairs: [TenGod, TenGod][] = [['비견', '겁재'], ['식신', '상관'], ['편재', '정재'], ['편관', '정관'], ['편인', '정인']];
  const [a, b] = pairs[diff];
  return same ? a : b;
}

/** 일지와 올해 지지의 관계를 쉬운 말로 (세운 본문의 둘째 문장) */
export const RELATION_COPY: Record<RelationKind, string> = {
  합: '내 사주와 잘 맞는 기운이 와서 사람이나 일이 자연스럽게 어우러지기 쉬워요.',
  충: '내 사주와 부딪히는 기운이 와서 변화가 생기기 쉬워요.',
  형: '나를 다듬는 기운이 와서 마찰이 있어도 배우는 것이 많아요.',
  파: '계획이 살짝 틀어질 수 있는 기운이 와서 미리 점검해 두면 좋아요.',
  해: '사소한 오해가 생길 수 있는 기운이 와서 소통을 챙기면 좋아요.',
  반합: '은근히 손을 잡아 주는 기운이 와서 조금씩 어우러져요.',
  같음: '내 사주와 같은 기운이 와서 익숙하고 편안한 흐름이에요.',
  없음: '내 사주와 특별히 얽히는 기운이 없어서 담담하게 흐르는 해예요.',
};

function hasBatchim(s: string): boolean {
  const c = s.charCodeAt(s.length - 1) - 0xac00;
  return c >= 0 && c <= 11171 && c % 28 !== 0;
}

/** 대운 한 구간. countingAge는 세는 나이: "37세부터 46세까지는 '돈을 꾸준히 모으는 시기'예요" */
export function daeunCopy(p: { countingAge: number; korean: string; tenGod: TenGod }): Reading {
  const from = p.countingAge;
  return {
    text: `${from}세부터 ${from + 9}세까지는 '${TEN_GOD_COPY[p.tenGod].period}'예요. 큰 흐름의 참고일 뿐이고, 어떻게 보낼지는 내 몫이에요.`,
    basis: `${p.korean} 대운 · ${p.tenGod}`,
  };
}

/** 올해 운(세운): 제목 "2027년은 나에게". 본문은 올해 기운의 성격 + 내 일지와의 관계를 쉬운 말로 */
export function seunCopy(p: { korean: string; tenGod: TenGod; relation: RelationKind; dayBranch: Branch }): Reading {
  const gwa = hasBatchim(p.dayBranch) ? '과' : '와';
  const rel =
    p.relation === '없음' ? `일지 ${p.dayBranch}${gwa} 특별한 관계 없음`
    : p.relation === '같음' ? `일지 ${p.dayBranch}${gwa} 같은 글자`
    : `일지 ${p.dayBranch}${gwa} ${p.relation}`;
  return {
    text: `${TEN_GOD_COPY[p.tenGod].year} ${RELATION_COPY[p.relation]}`,
    basis: `${p.korean}년 · ${p.tenGod} · ${rel}`,
  };
}

type CautionCopy = { situation: string; action: string };

const CAUTION_MANY: Record<Element, CautionCopy> = {
  목: { situation: '새싹 기운이 많아서 계획을 자꾸 넓히다가 하나를 놓치기 쉬운 해예요.', action: '이번 달 할 일을 세 가지로만 줄여 적어 보세요.' },
  화: { situation: '불꽃 기운이 많아서 결정을 빨리 내리려고 하기 쉬운 해예요.', action: '큰 결정은 하룻밤 지나서 한 번 더 읽어 보고 확정하세요.' },
  토: { situation: '대지 기운이 많아서 익숙한 자리를 지키느라 새 시도를 미루기 쉬운 상황이에요.', action: '이번 주에 안 해 본 일을 하나만 가볍게 해 보세요.' },
  금: { situation: '칼날 기운이 많아서 기준이 엄격해져 스스로를 몰아붙이기 쉬운 해예요.', action: '하루 끝에 잘한 일을 한 줄 적고 마무리하세요.' },
  수: { situation: '물결 기운이 많아서 생각이 꼬리를 물어 행동이 늦어지기 쉬운 상황이에요.', action: '고민이 길어지면 타이머 10분을 맞추고 일단 한 걸음 움직이세요.' },
};

const CAUTION_NONE: Record<Element, CautionCopy> = {
  목: { situation: '뻗어 나가게 해 주는 새싹 기운이 없어서 시작할 때 한 발 늦춰지기 쉬운 상황이에요.', action: '작은 시작 하나를 오늘 안에 해 보세요.' },
  화: { situation: '따뜻하게 달궈 주는 불꽃 기운이 없어서 마음을 겉으로 꺼내기 어려워지기 쉬운 상황이에요.', action: '고마운 마음을 한 사람에게 말로 전해 보세요.' },
  토: { situation: '중심을 잡아 주는 대지 기운이 없어서 마음이 바쁘게 움직이기 쉬워요.', action: '하루 한 번 같은 시간에 쉬는 루틴을 잡아 두세요.' },
  금: { situation: '매듭을 지어 주는 칼날 기운이 없어서 일을 벌여 놓고 마무리가 늘어지기 쉬운 상황이에요.', action: '진행 중인 일마다 마감일을 하나씩 적어 두세요.' },
  수: { situation: '식혀 주는 물결 기운이 없어서 쉬어야 할 때도 계속 움직이기 쉬운 상황이에요.', action: '잠들기 전 10분은 화면을 끄고 조용히 보내 보세요.' },
};

const CAUTION_BALANCED: CautionCopy = {
  situation: '다섯 기운이 고르게 있어서 어느 한쪽으로 크게 치우치지 않는 해예요.',
  action: '이번 달에 가장 하고 싶은 일 하나를 골라 먼저 시작하세요.',
};

/** 조심할 점 하나: 가장 많은 오행 → 없는 오행(목화토금수 순 첫째) → 균형형. text = situation + action, basis에 전통 표기 */
export function cautionFor(elements: Record<Element, number>, total: number): { situation: string; action: string; text: string; basis: string } {
  const threshold = Math.max(1, Math.round(total / 2));
  let top: Element | null = null;
  for (const e of ELEMENTS) {
    if (elements[e] >= threshold && (top === null || elements[e] > elements[top])) top = e;
  }
  const pack = (c: CautionCopy, basis: string) => ({ ...c, text: `${c.situation} ${c.action}`, basis });
  if (top) return pack(CAUTION_MANY[top], `${ELEMENT_COPY[top].easy}(${top}) ${elements[top]}개`);
  const none = ELEMENTS.find((e) => elements[e] === 0);
  if (none) return pack(CAUTION_NONE[none], `${ELEMENT_COPY[none].easy}(${none}) 0개`);
  return pack(CAUTION_BALANCED, '다섯 기운이 고르게 있어요');
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
