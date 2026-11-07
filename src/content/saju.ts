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

/** 다음 대운 한 줄: "다음 10년(47~56세)은 '…'예요" */
export function nextDaeunCopy(p: { countingAge: number; korean: string; tenGod: TenGod }): Reading {
  const from = p.countingAge;
  return {
    text: `다음 10년(${from}~${from + 9}세)은 '${TEN_GOD_COPY[p.tenGod].period}'로 이어져요.`,
    basis: `다음 ${p.korean} 대운 · ${p.tenGod}`,
  };
}

/** 많이 나온 것이 셋 이상 같은 수일 때 "제일 센 것 두 가지" 대신 쓰는 제목과 한 줄 */
export const TEN_GOD_TIED = {
  heading: '내 사주에 고르게 섞인 기운',
  lead: '어느 하나가 크게 앞서지 않고 여러 기운이 비슷하게 있어요. 그중 태어난 달에 가까운 두 가지를 먼저 보여 드려요.',
} as const;

// ---- 다섯 기운 한 줄 풀이 ----
const ELEMENT_TRAIT: Record<Element, { many: string; none: string }> = {
  목: { many: '새로 시작하고 넓혀 가는 힘', none: '새로 시작하는 힘' },
  화: { many: '표현하고 밀어붙이는 열정', none: '마음을 겉으로 꺼내는 힘' },
  토: { many: '버티고 지키는 묵직함', none: '중심을 잡고 쉬어 가는 힘' },
  금: { many: '정리하고 매듭짓는 힘', none: '마무리하고 매듭짓는 힘' },
  수: { many: '생각하고 헤아리는 깊이', none: '한 템포 쉬며 식히는 힘' },
};

function eunNeun(word: string): string { return hasBatchim(word) ? '은' : '는'; }
function iGa(word: string): string { return hasBatchim(word) ? '이' : '가'; }
function gwaWa(word: string): string { return hasBatchim(word) ? '과' : '와'; }

/** 다섯 기운 막대 아래 한 줄: 가장 많은 기운의 성격 + 없는 기운은 챙기면 좋은 점. 고르면 균형형 */
export function elementSummary(elements: Record<Element, number>): Reading {
  const max = Math.max(...ELEMENTS.map((e) => elements[e]));
  const most = ELEMENTS.filter((e) => elements[e] === max);
  const none = ELEMENTS.filter((e) => elements[e] === 0);
  const min = Math.min(...ELEMENTS.map((e) => elements[e]));
  const counts = ELEMENTS.map((e) => `${ELEMENT_COPY[e].easy}(${e}) ${elements[e]}`).join(' · ');
  if (max - min <= 1) {
    return { text: '다섯 기운이 고르게 있어서 상황에 따라 여러 면을 꺼내 쓰는 편이에요.', basis: counts };
  }
  const names = most.slice(0, 2).map((e) => ELEMENT_COPY[e].easy);
  const subject = names.length === 2 ? `${names[0]}${gwaWa(names[0])} ${names[1]}` : names[0];
  const traits = most.slice(0, 2).map((e) => ELEMENT_TRAIT[e].many);
  const traitText = traits.length === 2 ? `${traits[0]}${gwaWa(traits[0])} ${traits[1]}${iGa(traits[1])}` : `${traits[0]}${iGa(traits[0])}`;
  let text = `${subject}${iGa(subject)} 가장 많아서 ${traitText} 돋보이는 편이에요.`;
  if (none.length > 0) {
    const n = ELEMENT_COPY[none[0]].easy;
    const t = ELEMENT_TRAIT[none[0]].none;
    text += ` ${n}${eunNeun(n)} 없으니 ${t}${eunNeun(t)} 의식해서 챙기면 좋아요.`;
  }
  return { text, basis: counts };
}

// ---- 연애·일·돈·사람: 가장 많은 십신 무리(다섯 갈래)로 고른다 ----
export type TenGodGroup = 'self' | 'express' | 'wealth' | 'duty' | 'learn';
export const TEN_GOD_GROUP: Record<TenGod, TenGodGroup> = {
  비견: 'self', 겁재: 'self', 식신: 'express', 상관: 'express', 편재: 'wealth', 정재: 'wealth', 편관: 'duty', 정관: 'duty', 편인: 'learn', 정인: 'learn',
};
const GROUP_ORDER: TenGodGroup[] = ['self', 'express', 'wealth', 'duty', 'learn'];
const GROUP_BASIS: Record<TenGodGroup, string> = {
  self: '비겁(비견·겁재)', express: '식상(식신·상관)', wealth: '재성(편재·정재)', duty: '관성(편관·정관)', learn: '인성(편인·정인)',
};
export const AREAS = [
  { key: 'love', label: '연애' },
  { key: 'work', label: '일' },
  { key: 'money', label: '돈' },
  { key: 'people', label: '사람' },
] as const;
export type AreaKey = (typeof AREAS)[number]['key'];

export const AREA_COPY: Record<TenGodGroup, Record<AreaKey, string>> = {
  self: {
    love: '연애에서도 내 속도와 생각이 분명한 편이에요. 서로의 시간을 지켜 주는 사람과 오래 가요.',
    work: '혼자 맡아서 끝까지 밀고 가는 일에 강해요. 함께 달리는 동료가 있으면 힘이 더 나요.',
    money: '돈도 내 손으로 벌어서 쓰는 걸 좋아하는 편이에요. 친한 사이의 돈 약속은 금액과 날짜를 적어 두면 좋아요.',
    people: '또래나 친구와 나란히 어울릴 때 마음이 편한 편이에요. 내 생각을 말한 다음 상대 생각도 한 번 물어 보세요.',
  },
  express: {
    love: '좋아하는 마음을 숨기지 않고 표현하는 편이에요. 말뿐 아니라 작은 행동으로 보여 줄 때 더 잘 전해져요.',
    work: '아이디어를 내고 만들어 보여 주는 일에 강해요. 마감 날짜를 먼저 적어 두면 떠오른 생각이 결과로 이어져요.',
    money: '재주가 돈으로 이어지기 쉬운 편이에요. 좋아하는 일로 작게 벌어 보는 시도가 잘 맞아요.',
    people: '분위기를 풀고 대화를 이끄는 편이에요. 농담이 길어질 땐 상대 표정을 한 번 살펴 주세요.',
  },
  wealth: {
    love: '상대를 현실적으로 챙기고 함께할 계획을 잘 세우는 편이에요. 계획 사이사이 마음을 표현하는 말도 섞어 주세요.',
    work: '결과와 숫자가 보이는 일에 강해요. 사람을 만나고 기회를 연결하는 자리에서 실력이 잘 드러나요.',
    money: '돈의 흐름을 읽고 관리하는 감각이 있는 편이에요. 들어오고 나가는 돈을 한 달에 한 번 적어 보면 더 잘 보여요.',
    people: '필요한 사람을 잘 알아보고 넓게 이어 주는 편이에요. 바쁠수록 가까운 사람과 보내는 시간을 따로 잡아 두세요.',
  },
  duty: {
    love: '약속을 잘 지키고 믿음을 주는 연애를 하는 편이에요. 가끔은 계획 밖의 즉흥 데이트도 즐겨 보세요.',
    work: '책임이 분명한 자리에서 믿음을 쌓아 가는 일에 강해요. 맡은 일이 많아지면 먼저 할 일 세 개만 고르세요.',
    money: '계획한 대로 꾸준히 모으는 편이에요. 자동이체처럼 저절로 쌓이는 방법이 잘 맞아요.',
    people: '예의와 선을 잘 지켜서 믿을 만한 사람으로 보이는 편이에요. 친한 사이에는 조금 더 편하게 기대도 괜찮아요.',
  },
  learn: {
    love: '상대를 깊이 이해하려 하고 대화가 통하는 연애를 좋아하는 편이에요. 생각만 하지 말고 마음을 먼저 말해 보세요.',
    work: '배우고 정리해서 내 것으로 만드는 일에 강해요. 공부한 것을 짧게라도 밖으로 꺼내 보이면 기회가 늘어요.',
    money: '돈을 쓰기 전에 충분히 알아보고 신중하게 고르는 편이에요. 배움이나 자격에 쓰는 돈은 오래 남는 쪽이에요.',
    people: '도움을 주고받는 관계를 소중히 여기는 편이에요. 받은 도움은 짧은 말 한마디로라도 돌려주세요.',
  },
};

/** 가장 많은 십신 무리. 같으면 태어난 달(월지 → 월간) 무리, 그다음 목록 순서 */
export function dominantGroup(counts: Record<TenGod, number>, month: { stem: TenGod; branch: TenGod }): { group: TenGodGroup; count: number } {
  const sum = (g: TenGodGroup) => (Object.keys(counts) as TenGod[]).filter((t) => TEN_GOD_GROUP[t] === g).reduce((a, t) => a + counts[t], 0);
  const rank = (g: TenGodGroup) => (TEN_GOD_GROUP[month.branch] === g ? 0 : TEN_GOD_GROUP[month.stem] === g ? 1 : 2);
  const group = [...GROUP_ORDER].sort((a, b) => sum(b) - sum(a) || rank(a) - rank(b) || GROUP_ORDER.indexOf(a) - GROUP_ORDER.indexOf(b))[0];
  return { group, count: sum(group) };
}

/** 연애·일·돈·사람 네 줄과 꼬리 줄 */
export function areaReadings(counts: Record<TenGod, number>, month: { stem: TenGod; branch: TenGod }): { lines: { key: AreaKey; label: string; text: string }[]; basis: string } {
  const { group, count } = dominantGroup(counts, month);
  return {
    lines: AREAS.map((a) => ({ key: a.key, label: a.label, text: AREA_COPY[group][a.key] })),
    basis: `가장 많은 무리: ${GROUP_BASIS[group]} ${count}개`,
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

/** "왜 믿을 수 있나요": 사주 표는 달력 계산이라 누가 계산해도 같다는 근거와, 직접 대조한 결과(2026-11-07 운영 사이트 기준) */
export const TRUST_COPY = {
  title: '왜 믿을 수 있나요',
  lines: [
    '사주 표는 점이 아니라 달력 계산이에요. 같은 생년월일시면 누가 계산해도 같은 여덟 글자가 나와요.',
    '해와 달은 한국천문연구원이 분 단위로 계산한 절기 시각으로, 날짜는 60일마다 도는 순서로, 시간은 태어난 날과 두 시간 단위 시각으로 정해져요.',
    '언론 기사에 실린 사주와 유명인 생일 13건을 다른 만세력과 함께 맞춰 봤더니 모두 같았어요. 시간 기둥도 열 가지 날 × 열두 시간 360가지를 전통 규칙과 맞춰 봤고 다른 곳이 없었어요.',
    '맞는 건 글자 계산까지예요. 그 글자를 어떻게 읽느냐는 전통 해석이라, 풀이는 재미로 봐 주세요.',
  ],
} as const

export const SOURCE_LINE = '절기·음력은 한국천문연구원 역법 데이터를 담은 만세력 라이브러리 기준이에요. 해석은 유파에 따라 다를 수 있어요.';
export const DISCLAIMER = '사주는 오랜 전통의 해석 놀이이고 과학적 진단이 아니에요. 재미로 읽고, 중요한 결정의 근거로 삼지 말아 주세요.';
