// 장면 배치 좌표(320×240 설계 좌표). Phaser 없음 — 장면과 React 투명 버튼이 같은 값을 쓴다.

/** 전투 화면의 상자들: 벌판, 명령 메뉴 상자, 대사창 */
export const FIELD_BOX = { x: 10, y: 76, w: 300, h: 74 } as const;
export const MENU_BOX = { x: 10, y: 172, w: 150, h: 58 } as const;
export const DIALOG_BOX = { x: 164, y: 172, w: 146, h: 58 } as const;

/** 대사창 한 줄 글자 수(Galmuri9로 146px 대사창에 맞는 값). BattleScene과 view.ts가 같이 쓴다 */
export const MSG_CHARS = 15;

/** 전투 명령 메뉴 4줄 + 교체 줄(BattleScene의 MENU_Y 174, 간격 11 줄). 줄을 누르면 커서만 옮긴다 */
export const BATTLE_MENU = { x: 10, y: 174, w: 150, rowH: 11 } as const;
export const BATTLE_SWITCH = { x: 10, y: 219, w: 150, h: 11 } as const;
/** 결정 단추: 대사창 전체(고른 기술을 실제로 쓴다) */
export const BATTLE_CONFIRM = DIALOG_BOX;

/** 보상 카드 3장(와꾸 v5 draw2) */
export const REWARD_CARD = { x0: 14, step: 100, y: 52, w: 92, h: 120 } as const;

/** 고르기 창(대상 장수·영입 교체): 줄 수 n에 따라 높이가 바뀐다 */
export const PICK = { x: 56, y: 44, w: 208, titleH: 22, rowY0: 68, rowH: 20, rowStep: 22, rowX: 62, rowW: 196 } as const;
export const pickWindowH = (n: number) => PICK.rowY0 - PICK.y + n * PICK.rowStep + 6;

/** 결과 화면 버튼 3개와 별 5개(와꾸 v5 draw3) */
export const RESULT_BTN = { x0: 10, step: 101, y: 180, w: 98, h: 22 } as const;
export const RESULT_STAR = { x0: 104, step: 20, y: 208, w: 20, h: 22 } as const;

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

/** 항복(영입) 창: 초상이 미끄러져 들어오고, 동행 칸, 그 아래 고르기 줄 */
export const RECRUIT = {
  x: 20,
  y: 16,
  w: 280,
  h: 214,
  portX: 32,
  portY: 40,
  slotX: 100,
  slotY: 80,
  slotStep: 36,
  slotW: 32,
  slotH: 36,
  rowX: 32,
  rowY0: 130,
  rowStep: 19,
  rowH: 17,
  rowW: 256,
} as const;
