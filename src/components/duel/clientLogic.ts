// 일기토 화면의 순수 함수: ?me= 잠금 해제, 투명 버튼 자리, 터치 영역 넓히기 (Phaser·React 없음)
import { getDuelGeneral } from '@/lib/duel/generals';
import { GAME_H, GAME_H_TALL, GAME_W, TALL_BELOW_CSS } from '@/game/duel/config';
import {
  BATTLE_CONFIRM,
  BATTLE_MENU,
  BATTLE_SWITCH,
  BATTLE_TALL,
  MENU_BOX,
  REWARD_CARD,
  START_CELL,
  START_NEW,
  START_RESUME,
  START_SORTIE,
  START_TALL,
  battleCardRect,
  pickLayout,
  recruitLayout,
  resultLayout,
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

/**
 * ?me=로 장수록에 더할 장수. 시작 장수 4명은 늘 더한다(처음부터 열린 장수).
 * 영입 장수는 삼국지 닮은꼴 결과에서 온 링크(from=samguk)일 때만 — 장수 소개 페이지나 손으로 친 주소로는 영입을 건너뛸 수 없다.
 * 보스·졸개·명단 밖·쓰레기 값은 그대로.
 */
export function resolveStarterUnlock(me: string | null, roster: string[], from: string | null = null): string[] {
  if (!me) return roster;
  const g = getDuelGeneral(me);
  if (!g) return roster;
  const ok = g.role === 'starter' || (g.role === 'recruit' && from === 'samguk');
  if (!ok) return roster;
  return roster.includes(me) ? roster : [...roster, me];
}

/** 진행 중인 판(전투·보상)이 있으면 "새로 출진" 전에 한 번 더 묻는다(그 판은 사라진다) */
export function needsAbandonConfirm(save: { current?: { phase: string } | null }): boolean {
  const p = save.current?.phase;
  return p === 'battle' || p === 'reward';
}

/** "새로 출진" 누름: 진행 중인 판이 있고 아직 확인 전이면 'arm'(경고만), 그 밖은 'start'(새 판) */
export function sortieTap(save: { current?: { phase: string } | null }, armed: boolean): 'arm' | 'start' {
  return needsAbandonConfirm(save) && !armed ? 'arm' : 'start';
}

/** 결과 화면 아래 피드백 폼: 세로형(폰)은 처음부터, 가로형은 캔버스 별을 누른 뒤 */
export const showFeedbackForm = (tall: boolean, stars: number) => tall || stars > 0;

/** 새로 출진 확인 문구 */
export const abandonWarning = (wave: number) => `진행 중인 판(제${wave}전)이 사라져요`;

export interface OverlayOpts {
  /** 세로형(320×408) 배치 */
  tall?: boolean;
  /** 결과 열전 쪽 수(2 이상이면 본문 창이 쪽 넘김 단추) */
  pages?: number;
}

/**
 * 설계 좌표(가로형 320×240, 세로형 320×408)의 투명 버튼 자리. 라벨은 기본값이고 화면이 실제 이름으로 바꿔 단다.
 * n: 시작 화면 장수 수·고르기 줄 수, resume: 시작 화면에 이어하기 칸이 있는지
 */
export function overlayLayout(scene: OverlayScene, n = 0, resume = false, opts: OverlayOpts = {}): OverlaySlot[] {
  const tall = !!opts.tall;
  switch (scene) {
    case 'battle':
      if (tall) {
        return [
          ...[0, 1, 2, 3].map((i) => ({ id: `skill${i}`, label: `기술 ${i + 1}`, ...battleCardRect(i) })),
          { id: 'switch', label: '장수 교체', ...BATTLE_TALL.switch },
          { id: 'confirm', label: '결정', ...BATTLE_TALL.dialog },
        ];
      }
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
    case 'pick': {
      const P = pickLayout(tall);
      return Array.from({ length: n }, (_, i) => ({
        id: `opt${i}`,
        label: `선택 ${i + 1}`,
        x: P.rowX,
        y: P.rowY0 + i * P.rowStep,
        w: P.rowW,
        h: P.rowH,
      }));
    }
    case 'result': {
      const L = resultLayout(tall);
      return [
        ...(['share', 'retry', 'samguk'] as const).map((id, i) => ({
          id,
          label: ['공유하기', '다시 출진', '내 얼굴은 어떤 장수?'][i],
          x: L.btn.x0 + i * L.btn.step,
          y: L.btn.y,
          w: L.btn.w,
          h: L.btn.h,
        })),
        ...[1, 2, 3, 4, 5].map((s) => ({
          id: `star${s}`,
          label: `별 ${s}개`,
          x: L.star.x0 + (s - 1) * L.star.step,
          y: L.star.y,
          w: L.star.w,
          h: L.star.h,
        })),
        ...((opts.pages ?? 1) > 1 ? [{ id: 'page', label: '열전 다음 쪽', ...L.body }] : []),
      ];
    }
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
              { id: 'resume', label: '이어서 출진', ...(tall ? START_TALL.resume : START_RESUME) },
              { id: 'sortie', label: '새로 출진', ...(tall ? START_TALL.fresh : START_NEW) },
            ]
          : [{ id: 'sortie', label: '출진', ...(tall ? START_TALL.sortie : START_SORTIE) }]),
      ];
    case 'recruit': {
      const R = recruitLayout(tall);
      return Array.from({ length: n }, (_, i) => ({
        id: `opt${i}`,
        label: `선택 ${i + 1}`,
        x: R.rowX,
        y: R.rowY0 + i * R.rowStep,
        w: R.rowW,
        h: R.rowH,
      }));
    }
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

/**
 * 캔버스 무대 크기(CSS px). 화소가 또렷하도록 기기 화소 기준 정수 배율(320×z)을 고른다.
 * 폭(wrapperW)과 높이 여유(maxH)를 둘 다 넘지 않는 가장 큰 정수 배율. gameH는 설계 높이(240 또는 세로형 408).
 * 래퍼가 320px보다 좁을 때만 래퍼에 맞춘 소수 배율로 물러선다.
 */
export function stageSize(wrapperW: number, dpr = 1, maxH = Infinity, gameH = GAME_H): { w: number; h: number; zoom: number } {
  const ratio = dpr > 0 ? dpr : 1;
  if (wrapperW < GAME_W) return { w: wrapperW, h: (wrapperW * gameH) / GAME_W, zoom: (wrapperW * ratio) / GAME_W };
  // 1) 기기 화소 정수 배율(예: 2배 화면 480px 래퍼 → 960 기기px = 3배 → CSS 480px), 높이도 넘지 않게
  const zd = Math.floor(Math.min((wrapperW * ratio) / GAME_W, (maxH * ratio) / gameH));
  const wd = (GAME_W * zd) / ratio;
  if (zd >= 1 && wd >= GAME_W) return { w: wd, h: (gameH * zd) / ratio, zoom: zd };
  // 2) 그게 CSS 320px보다 작아지면(1.5배 화면·낮은 창 등) CSS 정수 배율(최소 1배)
  const zc = Math.max(1, Math.floor(Math.min(wrapperW / GAME_W, maxH / gameH)));
  return { w: GAME_W * zc, h: gameH * zc, zoom: zc * ratio };
}

/**
 * 무대 배치: 캔버스가 좁거나(CSS 폭 < 400) 터치 화면이면 세로형(320×408, 아래 큰 명령 패널),
 * 아니면 가로형(320×240). 세로형이 화면 높이에 안 들어가면 가로형으로 물러선다.
 */
export function stageLayout(wrapperW: number, dpr: number, maxH: number, coarse: boolean): { w: number; h: number; zoom: number; tall: boolean } {
  const wide = stageSize(wrapperW, dpr, maxH, GAME_H);
  if (coarse || wide.w < TALL_BELOW_CSS) {
    const tall = stageSize(wrapperW, dpr, maxH, GAME_H_TALL);
    if (tall.h <= maxH) return { ...tall, tall: true };
  }
  return { ...wide, tall: false };
}
