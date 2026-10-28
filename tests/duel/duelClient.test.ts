import { describe, it, expect } from 'vitest';
import { hitRects, overlayLayout, resolveStarterUnlock, type Rect } from '@/components/duel/clientLogic';
import { DIALOG_BOX, FIELD_BOX, MENU_BOX } from '@/game/duel/layout';

const inside = (r: Rect, W = 320, H = 240) => r.x >= 0 && r.y >= 0 && r.x + r.w <= W && r.y + r.h <= H;
// 배율 곱의 소수 오차(1e-12 수준)는 겹침으로 치지 않는다
const E = 1e-6;
const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w - E && b.x < a.x + a.w - E && a.y < b.y + b.h - E && b.y < a.y + a.h - E;
const noOverlap = (rs: Rect[]) => rs.every((a, i) => rs.every((b, j) => i === j || !overlaps(a, b)));

describe('resolveStarterUnlock', () => {
  it('영입 장수(zhouyu)는 장수록에 합친다', () => {
    expect(resolveStarterUnlock('zhouyu', ['guanyu'])).toEqual(['guanyu', 'zhouyu']);
  });
  it('시작 장수도 합치고, 이미 있으면 그대로', () => {
    expect(resolveStarterUnlock('zhaoyun', ['guanyu'])).toEqual(['guanyu', 'zhaoyun']);
    expect(resolveStarterUnlock('guanyu', ['guanyu'])).toEqual(['guanyu']);
  });
  it.each([['caocao'], ['<script>'], ['lvbu'], ['mob'], [''], [null]])('%s는 변화 없음', (me) => {
    expect(resolveStarterUnlock(me as string | null, ['guanyu'])).toEqual(['guanyu']);
  });
  it('입력 배열을 바꾸지 않는다', () => {
    const roster = ['guanyu'];
    resolveStarterUnlock('machao', roster);
    expect(roster).toEqual(['guanyu']);
  });
});

describe('overlayLayout', () => {
  it('전투: 기술 4 + 교체 1 + 결정, 320×240 안, 겹치지 않음', () => {
    const l = overlayLayout('battle');
    expect(l.map((b) => b.id)).toEqual(['skill0', 'skill1', 'skill2', 'skill3', 'switch', 'confirm']);
    expect(l.every((b) => inside(b))).toBe(true);
    expect(noOverlap(l)).toBe(true);
    expect(l.every((b) => b.label.length > 0)).toBe(true);
  });
  it('전투 메뉴 줄 자리(메뉴 상자 x10~160 안, y 174+11i, 높이 11), 결정 단추는 대사창 전체', () => {
    const l = overlayLayout('battle');
    l.slice(0, 4).forEach((b, i) => expect(b).toMatchObject({ x: 10, y: 174 + 11 * i, w: 150, h: 11, panel: MENU_BOX }));
    expect(l[4]).toMatchObject({ x: 10, y: 219, w: 150, panel: MENU_BOX });
    l.slice(0, 5).forEach((b) => expect(b.x + b.w).toBeLessThanOrEqual(160));
    expect(l[5]).toMatchObject({ id: 'confirm', ...DIALOG_BOX });
  });
  it('결과: 버튼 3 + 별 5 = 8개', () => {
    const l = overlayLayout('result');
    expect(l).toHaveLength(8);
    expect(l.map((b) => b.id)).toEqual(['share', 'retry', 'samguk', 'star1', 'star2', 'star3', 'star4', 'star5']);
    expect(l.every((b) => inside(b))).toBe(true);
    expect(noOverlap(l)).toBe(true);
  });
  it('보상: 카드 3', () => {
    const l = overlayLayout('reward');
    expect(l.map((b) => b.id)).toEqual(['card0', 'card1', 'card2']);
    expect(noOverlap(l) && l.every((b) => inside(b))).toBe(true);
  });
  it('시작: 장수록 n개 + 출진', () => {
    const l = overlayLayout('start', 9);
    expect(l).toHaveLength(10);
    expect(l[9].id).toBe('sortie');
    expect(noOverlap(l) && l.every((b) => inside(b))).toBe(true);
  });
  it('시작: 진행 중 판이 있으면 이어하기 + 새로 출진', () => {
    const l = overlayLayout('start', 9, true);
    expect(l.map((b) => b.id).slice(-2)).toEqual(['resume', 'sortie']);
    expect(noOverlap(l) && l.every((b) => inside(b))).toBe(true);
  });
  it('항복 창: 동행 4명 + 데려가지 않는다 = 5줄', () => {
    const l = overlayLayout('recruit', 5);
    expect(l.map((b) => b.id)).toEqual(['opt0', 'opt1', 'opt2', 'opt3', 'opt4']);
    expect(noOverlap(l) && l.every((b) => inside(b))).toBe(true);
    expect(l[4].y + l[4].h).toBeLessThanOrEqual(16 + 214 - 2);
  });
  it('고르기 창: n줄', () => {
    const l = overlayLayout('pick', 5);
    expect(l.map((b) => b.id)).toEqual(['opt0', 'opt1', 'opt2', 'opt3', 'opt4']);
    expect(noOverlap(l) && l.every((b) => inside(b))).toBe(true);
  });
});

describe('hitRects', () => {
  const scale = (rs: Rect[], k: number) => rs.map((r) => ({ x: r.x * k, y: r.y * k, w: r.w * k, h: r.h * k }));

  it.each([
    ['battle', 390],
    ['battle', 358],
    ['battle', 343],
    ['battle', 480],
    ['result', 358],
    ['start', 343],
    ['result', 390],
    ['reward', 390],
    ['start', 390],
    ['recruit', 343],
  ] as const)('%s @%ipx: 래퍼 안, 서로 겹치지 않음, 원래 칸을 덮는다', (scene, W) => {
    const k = W / 320;
    const base = scale(overlayLayout(scene, scene === 'recruit' ? 5 : 9), k);
    const out = hitRects(base, W, W * 0.75);
    expect(out.every((r) => inside(r, W, W * 0.75))).toBe(true);
    expect(noOverlap(out)).toBe(true);
    out.forEach((r, i) => {
      const b = base[i];
      expect(r.x <= b.x + E && r.y <= b.y + E && r.x + r.w >= b.x + b.w - E && r.y + r.h >= b.y + b.h - E).toBe(true);
    });
  });

  // 375px 화면 = 캔버스 래퍼 343px(좌우 여백 16px)
  const battleAt = (W: number) => {
    const k = W / 320;
    const base = overlayLayout('battle').map((b) => ({
      x: b.x * k,
      y: b.y * k,
      w: b.w * k,
      h: b.h * k,
      ...(b.panel ? { panel: { x: b.panel.x * k, y: b.panel.y * k, w: b.panel.w * k, h: b.panel.h * k } } : {}),
    }));
    return { k, out: hitRects(base, W, W * 0.75) };
  };

  it.each([343, 358, 390, 480])('전투 @%ipx: 어떤 터치 영역도 벌판(체력바 포함)과 겹치지 않고 메뉴 줄은 메뉴 상자 안', (W) => {
    const { k, out } = battleAt(W);
    const field = { x: FIELD_BOX.x * k, y: FIELD_BOX.y * k, w: FIELD_BOX.w * k, h: (MENU_BOX.y - FIELD_BOX.y) * k };
    out.forEach((r) => expect(overlaps(r, field)).toBe(false));
    out.slice(0, 5).forEach((r) => {
      expect(r.y).toBeGreaterThanOrEqual(MENU_BOX.y * k - E);
      expect(r.y + r.h).toBeLessThanOrEqual((MENU_BOX.y + MENU_BOX.h) * k + E);
    });
    expect(noOverlap(out)).toBe(true);
  });

  it('결정 단추는 375px 화면(래퍼 343px)에서도 가로·세로 44px 이상', () => {
    const { out } = battleAt(343);
    const c = out[5];
    expect(c.w).toBeGreaterThanOrEqual(44);
    expect(c.h).toBeGreaterThanOrEqual(44);
  });

  it('panel을 주면 그 상자 밖으로 늘리지 않는다', () => {
    const [r] = hitRects([{ x: 10, y: 102, w: 100, h: 10, panel: { x: 0, y: 100, w: 200, h: 14 } }], 400, 300);
    expect(r).toEqual({ x: 10, y: 100, w: 100, h: 14 });
  });

  it('이웃이 없으면 44px까지 위아래로 똑같이 늘린다', () => {
    const [r] = hitRects([{ x: 100, y: 100, w: 80, h: 20 }], 400, 300);
    expect(r).toEqual({ x: 100, y: 88, w: 80, h: 44 });
  });

  it('래퍼 밖으로 나가지 않는다', () => {
    const [r] = hitRects([{ x: 0, y: 290, w: 80, h: 10 }], 400, 300);
    expect(r.y + r.h).toBeLessThanOrEqual(300);
  });

  it('결과 버튼은 390px에서도 44px 이상', () => {
    const k = 390 / 320;
    const out = hitRects(scale(overlayLayout('result'), k), 390, 292.5);
    expect(out.slice(0, 3).every((r) => r.h >= 44)).toBe(true);
  });
});
