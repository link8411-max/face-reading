// 일기토 화면의 순수 함수: ?me= 잠금 해제, 투명 버튼 자리, 터치 영역 넓히기 (Phaser·React 없음)
import { getDuelGeneral } from '@/lib/duel/generals';
import {
  BATTLE_CONFIRM,
  BATTLE_MENU,
  BATTLE_SWITCH,
  MENU_BOX,
  PICK,
  RECRUIT,
  RESULT_BTN,
  RESULT_STAR,
  REWARD_CARD,
  START_CELL,
  START_NEW,
  START_RESUME,
  START_SORTIE,
  startCellPos,
} from '@/game/duel/layout';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface OverlaySlot extends Rect {
  id: string;
  label: string;
  /** 터치 영역을 넓혀도 이 상자 밖으로는 나가지 않는다(전투 메뉴 줄 → 메뉴 상자) */
  panel?: Rect;
}

export type OverlayScene = 'start' | 'battle' | 'reward' | 'result' | 'pick' | 'recruit';

/** 삼국지 닮은꼴 결과(?me=)가 시작·영입 장수면 장수록에 더한다. 그 밖(보스·졸개·명단 밖·쓰레기 값)은 그대로 */
export function resolveStarterUnlock(me: string | null, roster: string[]): string[] {
  if (!me) return roster;
  const g = getDuelGeneral(me);
  if (!g || (g.role !== 'starter' && g.role !== 'recruit')) return roster;
  return roster.includes(me) ? roster : [...roster, me];
}

/**
 * 320×240 설계 좌표의 투명 버튼 자리. 라벨은 기본값이고 화면이 실제 이름으로 바꿔 단다.
 * n: 시작 화면 장수 수·고르기 줄 수, resume: 시작 화면에 이어하기 칸이 있는지
 */
export function overlayLayout(scene: OverlayScene, n = 0, resume = false): OverlaySlot[] {
  switch (scene) {
    case 'battle':
      return [
        ...[0, 1, 2, 3].map((i) => ({
          id: `skill${i}`,
          label: `기술 ${i + 1}`,
          x: BATTLE_MENU.x,
          y: BATTLE_MENU.y + i * BATTLE_MENU.rowH,
          w: BATTLE_MENU.w,
          h: BATTLE_MENU.rowH,
          panel: MENU_BOX,
        })),
        { id: 'switch', label: '장수 교체', ...BATTLE_SWITCH, panel: MENU_BOX },
        { id: 'confirm', label: '결정', ...BATTLE_CONFIRM },
      ];
    case 'reward':
      return [0, 1, 2].map((i) => ({
        id: `card${i}`,
        label: `보상 ${i + 1}`,
        x: REWARD_CARD.x0 + i * REWARD_CARD.step,
        y: REWARD_CARD.y,
        w: REWARD_CARD.w,
        h: REWARD_CARD.h,
      }));
    case 'pick':
      return Array.from({ length: n }, (_, i) => ({
        id: `opt${i}`,
        label: `선택 ${i + 1}`,
        x: PICK.rowX,
        y: PICK.rowY0 + i * PICK.rowStep,
        w: PICK.rowW,
        h: PICK.rowH,
      }));
    case 'result':
      return [
        ...(['share', 'retry', 'samguk'] as const).map((id, i) => ({
          id,
          label: ['공유하기', '다시 출진', '내 얼굴은 어떤 장수?'][i],
          x: RESULT_BTN.x0 + i * RESULT_BTN.step,
          y: RESULT_BTN.y,
          w: RESULT_BTN.w,
          h: RESULT_BTN.h,
        })),
        ...[1, 2, 3, 4, 5].map((s) => ({
          id: `star${s}`,
          label: `별 ${s}개`,
          x: RESULT_STAR.x0 + (s - 1) * RESULT_STAR.step,
          y: RESULT_STAR.y,
          w: RESULT_STAR.w,
          h: RESULT_STAR.h,
        })),
      ];
    case 'start':
      return [
        ...Array.from({ length: n }, (_, i) => ({
          id: `general${i}`,
          label: `장수 ${i + 1}`,
          ...startCellPos(i),
          w: START_CELL.w,
          h: START_CELL.h,
        })),
        ...(resume
          ? [
              { id: 'resume', label: '이어서 출진', ...START_RESUME },
              { id: 'sortie', label: '새로 출진', ...START_NEW },
            ]
          : [{ id: 'sortie', label: '출진', ...START_SORTIE }]),
      ];
    case 'recruit':
      return Array.from({ length: n }, (_, i) => ({
        id: `opt${i}`,
        label: `선택 ${i + 1}`,
        x: RECRUIT.rowX,
        y: RECRUIT.rowY0 + i * RECRUIT.rowStep,
        w: RECRUIT.rowW,
        h: RECRUIT.rowH,
      }));
  }
}

/** 배율을 곱한 좌표의 소수 오차(맞닿은 칸이 겹쳐 보이는 것)를 무시하는 여유 */
const EPS = 0.5;
const overlap1 = (a0: number, a1: number, b0: number, b1: number) => a0 < b1 - EPS && b0 < a1 - EPS;

/** 한 축 [a0,a1)을 min까지 양쪽으로 늘린다. 한쪽이 막히면 모자란 만큼 다른 쪽으로. lo·hi가 한계 */
function grow(a0: number, a1: number, lo: number, hi: number, min: number): [number, number] {
  if (a1 - a0 >= min) return [a0, a1];
  const need = (min - (a1 - a0)) / 2;
  let s = Math.max(lo, a0 - need);
  let e = Math.min(hi, a1 + need);
  const short = min - (e - s);
  if (short > 0) {
    s = Math.max(lo, s - short);
    e = Math.min(hi, s + min);
  }
  return [s, e];
}

/**
 * 터치 영역을 min(기본 44px)까지 넓힌다. 양쪽으로 똑같이 늘리되(한쪽이 막히면 다른 쪽으로),
 * 이웃과는 둘 사이 가운데까지만, 래퍼(W×H)와 제 상자(panel) 밖으로는 나가지 않는다.
 * 먼저 좌우를 늘리고, 그 결과를 이웃 판정에 써서 위아래를 늘리므로 대각선 이웃과도 겹치지 않는다.
 * 그래서 칸이 촘촘한 전투 메뉴 줄은 44px에 못 미친다 — 줄은 커서만 옮기고, 실행은 큰 '결정' 단추(대사창)가 맡는다.
 */
export function hitRects(rects: (Rect & { panel?: Rect })[], W: number, H: number, min = 44): Rect[] {
  const wide = rects.map((r, i) => {
    let lo = r.panel ? Math.max(0, r.panel.x) : 0;
    let hi = r.panel ? Math.min(W, r.panel.x + r.panel.w) : W;
    rects.forEach((o, j) => {
      if (j === i || !overlap1(r.y, r.y + r.h, o.y, o.y + o.h)) return;
      if (o.x + o.w <= r.x + EPS) lo = Math.max(lo, (o.x + o.w + r.x) / 2);
      if (o.x >= r.x + r.w - EPS) hi = Math.min(hi, (r.x + r.w + o.x) / 2);
    });
    const [x0, x1] = grow(r.x, r.x + r.w, lo, hi, min);
    return { x: x0, y: r.y, w: x1 - x0, h: r.h, panel: r.panel };
  });
  return wide.map((r, i) => {
    let lo = r.panel ? Math.max(0, r.panel.y) : 0;
    let hi = r.panel ? Math.min(H, r.panel.y + r.panel.h) : H;
    wide.forEach((o, j) => {
      if (j === i || !overlap1(r.x, r.x + r.w, o.x, o.x + o.w)) return;
      if (o.y + o.h <= r.y + EPS) lo = Math.max(lo, (o.y + o.h + r.y) / 2);
      if (o.y >= r.y + r.h - EPS) hi = Math.min(hi, (r.y + r.h + o.y) / 2);
    });
    const [y0, y1] = grow(r.y, r.y + r.h, lo, hi, min);
    return { x: r.x, y: y0, w: r.w, h: y1 - y0 };
  });
}
