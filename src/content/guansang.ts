// 관상 2판 문구. 규칙은 tests/guansang/copy.test.ts가 막는다(해요체, 이모지·금지어·평가어 없음, 난수 없음).
import type { GuansangTypeKey, PalaceKey, PalaceLabel, ShapeKey, ZoneKey } from '@/lib/face/guansangKeys';

export interface GuansangTypeCopy {
  key: GuansangTypeKey;
  nickname: string;
  oneLiner: string;
  caution: { situation: string; action: string };
  partner: GuansangTypeKey;
  partnerLine: string;
}

export const GUANSANG_TYPES: Record<GuansangTypeKey, GuansangTypeCopy> = {
  'wood-up': {
    key: 'wood-up',
    nickname: '일찍 싹 트는 상',
    oneLiner: '길게 뻗은 얼굴에 이마가 앞서, 시작이 빠르고 호기심이 먼저 움직이는 상으로 풀어요.',
    caution: { situation: '새 일이 자꾸 눈에 들어와 마무리 전에 다음 일에 집중하기 쉬운 해예요.', action: '시작할 때 끝나는 날짜를 하나 적어 두세요.' },
    partner: 'water-down',
    partnerLine: '물이 나무를 키우듯 바다처럼 품는 상이 앞서 가는 걸음을 든든히 받쳐 줘요.',
  },
  'wood-mid': {
    key: 'wood-mid',
    nickname: '곧게 뻗는 상',
    oneLiner: '곧고 길게 뻗은 얼굴 한가운데에 힘이 실려, 한번 정한 길을 꾸준히 가는 상으로 풀어요.',
    caution: { situation: '정한 길만 보고 달리느라 주변 의견을 가볍게 처리하기 쉬운 상황이에요.', action: '중간 지점에서 한 사람에게 진행 상황을 물어보세요.' },
    partner: 'water-up',
    partnerLine: '물이 나무를 키우듯 생각이 깊은 상이 가는 길의 방향을 함께 짚어 줘요.',
  },
  'wood-down': {
    key: 'wood-down',
    nickname: '뿌리 깊은 상',
    oneLiner: '길게 뻗은 얼굴에 턱까지 힘이 실려, 서두르지 않고 깊이 뿌리내리는 상으로 풀어요.',
    caution: { situation: '뿌리내리는 동안 익숙한 방식만 반복하기 쉬운 해예요.', action: '이번 달에 안 해 본 일을 하나만 시도해 보세요.' },
    partner: 'water-up',
    partnerLine: '물이 나무를 키우듯 생각이 깊은 상이 단단한 뿌리에 새로운 시각을 보태 줘요.',
  },
  'fire-up': {
    key: 'fire-up',
    nickname: '번뜩이는 상',
    oneLiner: '넓게 트인 이마와 갸름한 턱선이 어우러져, 아이디어가 번뜩 떠오르는 상으로 풀어요.',
    caution: { situation: '속도를 앞세우다 설명을 생략하기 쉬운 상황이에요.', action: '말하기 전에 이유 한 가지를 먼저 덧붙여 보세요.' },
    partner: 'wood-down',
    partnerLine: '나무가 불을 키우듯 뿌리 깊은 상이 번뜩이는 생각을 오래 가는 힘으로 바꿔 줘요.',
  },
  'fire-mid': {
    key: 'fire-mid',
    nickname: '한창 타오르는 상',
    oneLiner: '이마와 갸름한 턱 사이 한가운데에 열기가 실려, 지금 이 순간에 몰입하는 상으로 풀어요.',
    caution: { situation: '의욕이 앞서 일정을 가득 채우고 쉴 틈을 생략하기 쉬운 해예요.', action: '일정 사이에 비워 둘 시간을 하루 한 칸 만들어 보세요.' },
    partner: 'wood-up',
    partnerLine: '나무가 불을 키우듯 일찍 싹 트는 상이 타오르는 불씨에 새 연료를 건네 줘요.',
  },
  'fire-down': {
    key: 'fire-down',
    nickname: '오래 데우는 상',
    oneLiner: '갸름한 턱선까지 힘이 내려와, 천천히 오래 온기를 지키는 상으로 풀어요.',
    caution: { situation: '속에 열기를 담아 둔 채 표현을 미루고 혼자 감당하기 쉬운 상황이에요.', action: '힘든 일은 하루 안에 한 사람에게 말해 보세요.' },
    partner: 'wood-up',
    partnerLine: '나무가 불을 키우듯 일찍 싹 트는 상이 느긋한 온기에 새로운 불씨를 더해 줘요.',
  },
  'earth-up': {
    key: 'earth-up',
    nickname: '터전이 단단한 상',
    oneLiner: '둥글고 넉넉한 얼굴에 이마가 든든해, 기반을 먼저 다지고 움직이는 상으로 풀어요.',
    caution: { situation: '확신이 설 때까지 기다리다 결정을 보류하기 쉬운 해예요.', action: '결정 기한을 먼저 정하고 그날까지만 알아보세요.' },
    partner: 'fire-down',
    partnerLine: '불이 흙을 단단히 굳히듯 오래 데우는 상이 쌓아 온 터전에 온기를 보태 줘요.',
  },
  'earth-mid': {
    key: 'earth-mid',
    nickname: '곳간이 든든한 상',
    oneLiner: '둥글고 넉넉한 얼굴 한가운데에 힘이 실려, 쌓고 지키는 데 강한 상으로 풀어요.',
    caution: { situation: '써야 할 순간에도 계산부터 하기 쉬운 해예요.', action: '한 달에 한 번, 나를 위한 지출 하나를 정해 보세요.' },
    partner: 'fire-up',
    partnerLine: '불이 흙을 단단히 굳히듯 번뜩이는 상이 쌓아 둔 것에 새 쓰임새를 비춰 줘요.',
  },
  'earth-down': {
    key: 'earth-down',
    nickname: '쉼터가 되는 상',
    oneLiner: '둥글고 넉넉한 얼굴이 턱까지 이어져, 곁에 있으면 마음이 놓이는 상으로 풀어요.',
    caution: { situation: '남의 부탁을 먼저 챙기느라 내 몫을 양보하기 쉬운 상황이에요.', action: '부탁을 받으면 하루 뒤에 답한다고 말해 보세요.' },
    partner: 'fire-up',
    partnerLine: '불이 흙을 단단히 굳히듯 번뜩이는 상이 편안한 쉼터에 새 자극을 보태 줘요.',
  },
  'metal-up': {
    key: 'metal-up',
    nickname: '설계하는 상',
    oneLiner: '각지고 또렷한 윤곽에 이마가 앞서, 계획을 먼저 그리고 움직이는 상으로 풀어요.',
    caution: { situation: '계획을 완벽히 다듬느라 실행을 지연하기 쉬운 해예요.', action: '계획이 어느 정도 서면 첫 걸음을 먼저 옮겨 보세요.' },
    partner: 'earth-down',
    partnerLine: '흙이 금을 품어 키우듯 쉼터가 되는 상이 설계에 여유를 보태 줘요.',
  },
  'metal-mid': {
    key: 'metal-mid',
    nickname: '결단하는 상',
    oneLiner: '각지고 또렷한 얼굴 한가운데에 힘이 실려, 고르고 정하는 데 망설임이 적은 상으로 풀어요.',
    caution: { situation: '결론을 빨리 내리다 상대의 사정을 생략하기 쉬운 상황이에요.', action: '결정을 말하기 전에 상대의 의견을 한 번 물어보세요.' },
    partner: 'earth-up',
    partnerLine: '흙이 금을 품어 키우듯 터전이 단단한 상이 결단에 믿을 구석을 만들어 줘요.',
  },
  'metal-down': {
    key: 'metal-down',
    nickname: '끝까지 지키는 상',
    oneLiner: '각지고 또렷한 턱선에 힘이 실려, 맡은 일을 끝까지 해내는 상으로 풀어요.',
    caution: { situation: '혼자 끝까지 책임지려다 도움 요청을 보류하기 쉬운 해예요.', action: '벅찬 일은 절반만 나눠 달라고 말해 보세요.' },
    partner: 'earth-up',
    partnerLine: '흙이 금을 품어 키우듯 터전이 단단한 상이 끝까지 가는 길에 든든한 바닥이 돼 줘요.',
  },
  'water-up': {
    key: 'water-up',
    nickname: '생각이 깊은 상',
    oneLiner: '둥글고 부드러운 얼굴에 이마가 앞서, 오래 생각하고 깊이 헤아리는 상으로 풀어요.',
    caution: { situation: '생각이 깊어질수록 결정을 계속 숙고하기 쉬운 해예요.', action: '고민은 하루 시간을 정해 두고 그 안에 답을 내 보세요.' },
    partner: 'metal-down',
    partnerLine: '금이 물을 길러 내듯 끝까지 지키는 상이 깊은 생각을 행동으로 이어 줘요.',
  },
  'water-mid': {
    key: 'water-mid',
    nickname: '사람을 잇는 상',
    oneLiner: '둥글고 부드러운 얼굴 한가운데에 힘이 실려, 사람과 사람 사이를 잇는 상으로 풀어요.',
    caution: { situation: '모두의 사정을 살피다 내 의견을 생략하기 쉬운 상황이에요.', action: '모임에서 내 생각을 한 문장으로 먼저 말해 보세요.' },
    partner: 'metal-up',
    partnerLine: '금이 물을 길러 내듯 설계하는 상이 사람들 사이의 흐름에 틀을 잡아 줘요.',
  },
  'water-down': {
    key: 'water-down',
    nickname: '바다처럼 품는 상',
    oneLiner: '둥글고 부드러운 얼굴이 턱까지 이어져, 넓게 받아들이고 품는 상으로 풀어요.',
    caution: { situation: '남의 걱정까지 떠안아 내 일을 뒤로 하기 쉬운 해예요.', action: '내 몫의 일을 먼저 끝내고 도움을 건네 보세요.' },
    partner: 'metal-up',
    partnerLine: '금이 물을 길러 내듯 설계하는 상이 품은 마음에 방향을 잡아 줘요.',
  },
};

export const SHAPE_COPY: Record<ShapeKey, { easy: string; traditional: string; evidence: string }> = {
  wood: { easy: '길쭉하고 곧은 얼굴', traditional: '목형', evidence: '얼굴이 위아래로 길게 뻗고 선이 곧아 목형으로 풀어요.' },
  fire: { easy: '이마가 넓고 턱이 갸름한 얼굴', traditional: '화형', evidence: '이마가 시원하게 트이고 턱끝이 갸름하게 모여 화형으로 풀어요.' },
  earth: { easy: '둥글고 넉넉한 얼굴', traditional: '토형', evidence: '얼굴 선이 둥글고 턱까지 폭이 넉넉하게 이어져 토형으로 풀어요.' },
  metal: { easy: '각지고 또렷한 얼굴', traditional: '금형', evidence: '턱선이 각지고 광대와 턱 윤곽이 또렷해 금형으로 풀어요.' },
  water: { easy: '둥글고 부드러운 얼굴', traditional: '수형', evidence: '얼굴 선이 둥글게 흐르고 턱이 부드럽게 이어져 수형으로 풀어요.' },
};

export const ZONE_COPY: Record<ZoneKey, { easy: string; traditional: string; evidence: string }> = {
  up: { easy: '이마가 센 얼굴', traditional: '상정', evidence: '힘이 이마 쪽에 가장 많이 실려 있어서 생각하고 시작하는 데 강한 얼굴이에요.' },
  mid: { easy: '코·광대가 센 얼굴', traditional: '중정', evidence: '힘이 코와 광대가 있는 한가운데에 실려 있어서 사람과 일을 이어 가는 데 강한 얼굴이에요.' },
  down: { easy: '턱이 센 얼굴', traditional: '하정', evidence: '힘이 코끝 아래부터 턱까지 실려 있어서 버티고 지키는 데 강한 얼굴이에요.' },
};

export const PALACE_COPY: Record<PalaceKey, { easy: string; part: string; traditional: string; lines: Record<PalaceLabel, string>; grow: string }> = {
  money: {
    easy: '돈 자리', part: '코', traditional: '재백궁',
    lines: {
      strong: '콧대가 길고 콧방울이 넉넉해 돈이 붙는 상으로 풀어요.',
      even: '콧대와 콧방울이 어우러져 벌고 쓰는 균형이 안정적인 상으로 풀어요.',
      grow: '코가 아담하고 단정해 크게 벌이기보다 알뜰히 모으는 쪽으로 풀어요. 쓴 돈을 하루 한 줄 적어 두면 자라요.',
    },
    grow: '그날 쓴 돈을 한 줄만 적어도 돈 자리가 눈에 띄게 자라요.',
  },
  work: {
    easy: '일 자리', part: '이마', traditional: '관록궁',
    lines: {
      strong: '이마가 훤하게 트여 일에서 존재감이 먼저 보이는 상으로 풀어요.',
      even: '이마가 얼굴과 고르게 어우러져 일을 차분하게 풀어 가는 상으로 풀어요.',
      grow: '이마가 단정하게 모여 요란하지 않게 일하는 인상이에요. 하루 끝에 한 일을 세 줄로 남기면 자라요.',
    },
    grow: '하루 끝에 오늘 한 일을 세 줄로 남기면 일 자리가 자라요.',
  },
  love: {
    easy: '사랑 자리', part: '눈꼬리 옆', traditional: '부처궁',
    lines: {
      strong: '눈꼬리 옆이 시원하게 트여 마음을 표현하는 힘이 큰 상으로 풀어요.',
      even: '눈꼬리 옆이 고르게 자리 잡아 관계를 차분하게 이어 가는 상으로 풀어요.',
      grow: '눈꼬리 옆이 단정하게 모여 속마음을 아끼는 인상이에요. 좋았던 점을 말로 먼저 건네면 자라요.',
    },
    grow: '좋았던 점을 말로 한 번 먼저 건네면 사랑 자리가 자라요.',
  },
  people: {
    easy: '곁 사람 자리', part: '눈썹', traditional: '형제궁',
    lines: {
      strong: '눈썹이 길게 이어져 사람을 모으고 이끄는 힘이 도드라진 상으로 풀어요.',
      even: '눈썹의 길이와 결이 고르게 이어져 편하게 어울리는 상으로 풀어요.',
      grow: '눈썹이 단정하게 모여 소수와 깊게 지내는 인상이에요. 안부 한 줄을 먼저 보내면 자라요.',
    },
    grow: '한 달에 한 번 먼저 안부를 보내면 곁 사람 자리가 자라요.',
  },
  base: {
    easy: '받쳐 주는 자리', part: '턱', traditional: '노복궁',
    lines: {
      strong: '턱선이 단단하게 받쳐 줘 끝까지 버티는 힘이 든든한 상으로 풀어요.',
      even: '턱선이 고르게 이어져 흔들림 없이 중심을 잡는 상으로 풀어요.',
      grow: '턱선이 부드럽게 모여 온화한 인상이에요. 버티는 힘은 작은 루틴 하나로 자라요.',
    },
    grow: '매일 같은 시간에 할 작은 루틴 하나를 정하면 받쳐 주는 자리가 자라요.',
  },
};

export const LABEL_COPY: Record<PalaceLabel, string> = {
  strong: '두드러진 자리',
  even: '고른 자리',
  grow: '가꿀수록 자라는 자리',
};

export const BALANCED_CHIP = '고르게 짜인 얼굴';
export const FOREHEAD_NOTE = '앞머리로 이마가 가려져 이마 자리는 추정이에요';
export const DISCLAIMER = '관상은 오랜 전통의 해석 놀이이고 과학적 진단이 아니에요. 사진의 윤곽과 비율을 전통 틀에 맞춰 재미로 풀어본 결과예요.';
export const SCHOOL_NOTE = '유파마다 얼굴형 분류가 조금씩 달라요';

export function evidenceText(shape: ShapeKey, zone: ZoneKey): string {
  return `${SHAPE_COPY[shape].evidence} ${ZONE_COPY[zone].evidence}`;
}

export const LEGACY_FACE_KEYS: Record<string, GuansangTypeKey> = {
  wealth: 'earth-mid',
  blessing: 'water-mid',
  leader: 'metal-mid',
  noble: 'metal-up',
  scholar: 'wood-up',
  artist: 'fire-up',
};
