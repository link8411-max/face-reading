// 장면 배치 좌표(320×240 설계 좌표). Phaser 없음 — 장면과 React 투명 버튼이 같은 값을 쓴다.

/** 전투 화면의 상자들: 벌판, 명령 메뉴 상자, 대사창 */
export const FIELD_BOX = { x: 10, y: 76, w: 300, h: 74 } as const;
export const MENU_BOX = { x: 10, y: 172, w: 150, h: 58 } as const;
export const DIALOG_BOX = { x: 164, y: 172, w: 146, h: 58 } as const;

/** 대사창 한 줄 글자 수(Galmuri9 10px 한글은 한 자 약 9~10px, 대사창 안쪽 138px). BattleScene과 view.ts가 같이 쓴다 */
export const MSG_CHARS = 14;

/** 가로형 전투 명령 메뉴 4줄(간격 10) + 교체 줄. 다섯째 줄이 상자 아래 테두리(228)에 걸리지 않게 줄 간격을 맞췄다 */
export const BATTLE_MENU = { x: 10, y: 173, w: 150, rowH: 10 } as const;
export const BATTLE_SWITCH = { x: 10, y: 213, w: 150, h: 15 } as const;
/** 결정 단추: 대사창 전체(고른 기술을 실제로 쓴다) */
export const BATTLE_CONFIRM = DIALOG_BOX;

/**
 * 세로형(320×408) 전투: 위 0~170은 가로형과 같고, 그 아래 넓은 대사창(=결정 단추),
 * 그 아래 2×2 기술 카드(각 146×50)와 교체 단추(300×46). 1배(폰)에서도 칸마다 44px 이상.
 */
export const BATTLE_TALL = {
  dialog: { x: 10, y: 178, w: 300, h: 56 },
  card: { x0: 10, colStep: 154, y0: 240, rowStep: 54, w: 146, h: 50 },
  switch: { x: 10, y: 350, w: 300, h: 46 },
} as const;
export const battleCardRect = (i: number) => ({
  x: BATTLE_TALL.card.x0 + (i % 2) * BATTLE_TALL.card.colStep,
  y: BATTLE_TALL.card.y0 + Math.floor(i / 2) * BATTLE_TALL.card.rowStep,
  w: BATTLE_TALL.card.w,
  h: BATTLE_TALL.card.h,
});

/** 보상 카드 3장(와꾸 v5 draw2) */
export const REWARD_CARD = { x0: 14, step: 100, y: 52, w: 92, h: 120 } as const;

/** 고르기 창(대상 장수·영입 교체): 줄 수 n에 따라 높이가 바뀐다. 줄은 맞닿아(간격 = 높이) 2배에서 44px, 세로형(1배)은 줄마다 44px */
export const PICK = { x: 56, y: 44, w: 208, titleH: 22, rowY0: 68, rowH: 22, rowStep: 22, rowX: 62, rowW: 196 } as const;
export const PICK_TALL = { x: 20, y: 44, w: 280, titleH: 22, rowY0: 68, rowH: 44, rowStep: 48, rowX: 28, rowW: 264 } as const;
export type PickLayout = typeof PICK | typeof PICK_TALL;
export const pickLayout = (tall = false): PickLayout => (tall ? PICK_TALL : PICK);
export const pickWindowH = (n: number, tall = false) => {
  const p = pickLayout(tall);
  return p.rowY0 - p.y + n * p.rowStep + 6;
};

/** 결과 화면 버튼 3개와 별 5개(와꾸 v5 draw3). 별은 2배에서 48×44 */
export const RESULT_BTN = { x0: 10, step: 101, y: 180, w: 98, h: 22 } as const;
export const RESULT_STAR = { x0: 110, step: 24, y: 208, w: 24, h: 22 } as const;

/** 결과 화면 배치: 열전 본문 창(쪽 넘김), 버튼, 별점 줄. 세로형은 본문 10줄·버튼과 별 44px */
export interface ResultLayout {
  body: { x: number; y: number; w: number; h: number };
  /** 한 쪽 줄 수(Galmuri11, 줄 간격 14) */
  bodyLines: number;
  btn: { x0: number; step: number; y: number; w: number; h: number };
  starBox: { x: number; y: number; w: number; h: number };
  star: { x0: number; step: number; y: number; w: number; h: number };
}
export const RESULT_WIDE: ResultLayout = {
  body: { x: 10, y: 76, w: 300, h: 96 },
  bodyLines: 6,
  btn: RESULT_BTN,
  starBox: { x: 10, y: 208, w: 300, h: 22 },
  star: RESULT_STAR,
};
export const RESULT_TALL: ResultLayout = {
  body: { x: 10, y: 76, w: 300, h: 160 },
  bodyLines: 10,
  btn: { x0: 10, step: 101, y: 244, w: 98, h: 44 },
  starBox: { x: 10, y: 296, w: 300, h: 68 },
  star: { x0: 30, step: 52, y: 316, w: 52, h: 44 },
};
export const resultLayout = (tall = false): ResultLayout => (tall ? RESULT_TALL : RESULT_WIDE);
/** 열전 한 줄 글자 수(Galmuri11 12px, 안쪽 288px) */
export const BODY_CHARS_11 = 23;

/** 시작 화면 장수록 칸(5열): 초상 액자 50×58 + 이름 줄 */
export const START_CELL = { x0: 14, colStep: 60, y0: 38, rowStep: 72, w: 50, h: 70, cols: 5 } as const;
export const START_SORTIE = { x: 214, y: 184, w: 96, h: 46 } as const;
export const START_HISTORY = { x: 10, y: 184, w: 200, h: 46 } as const;

export const startCellPos = (i: number) => ({
  x: START_CELL.x0 + (i % START_CELL.cols) * START_CELL.colStep,
  y: START_CELL.y0 + Math.floor(i / START_CELL.cols) * START_CELL.rowStep,
});

/** 진행 중 판이 있을 때 출진 칸을 둘로 나눈다: 위 이어하기, 아래 새로 출진 */
export const START_RESUME = { x: 214, y: 184, w: 96, h: 22 } as const;
export const START_NEW = { x: 214, y: 208, w: 96, h: 22 } as const;

/** 세로형 시작 화면: 행군 기록은 가로로 넓게, 출진(또는 이어하기·새로 출진)은 아래 큰 단추 */
export const START_TALL = {
  history: { x: 10, y: 184, w: 300, h: 46 },
  sortie: { x: 10, y: 240, w: 300, h: 56 },
  resume: { x: 10, y: 240, w: 300, h: 48 },
  fresh: { x: 10, y: 294, w: 300, h: 44 },
  /** 저장 안 됨 안내 줄 */
  noteY: 350,
} as const;

/** 항복(영입) 창: 초상이 미끄러져 들어오고, 동행 칸, 그 아래 고르기 줄. 줄은 맞닿아 2배에서 44px */
export const RECRUIT = {
  x: 20,
  y: 10,
  w: 280,
  h: 222,
  portX: 32,
  portY: 34,
  slotX: 100,
  slotY: 66,
  slotStep: 36,
  slotW: 32,
  slotH: 36,
  rowX: 32,
  rowY0: 118,
  rowStep: 22,
  rowH: 22,
  rowW: 256,
};
export type RecruitLayout = typeof RECRUIT;
/** 세로형 항복 창: 줄마다 44px(1배) */
export const RECRUIT_TALL: RecruitLayout = { ...RECRUIT, y: 16, h: 380, portY: 40, slotY: 80, rowY0: 136, rowStep: 48, rowH: 44 };
export const recruitLayout = (tall = false): RecruitLayout => (tall ? RECRUIT_TALL : RECRUIT);
