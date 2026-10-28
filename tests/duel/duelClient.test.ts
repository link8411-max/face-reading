import { describe, it, expect } from 'vitest';
import { abandonWarning, hitRects, needsAbandonConfirm, overlayLayout, resolveStarterUnlock, sortieTap, type Rect } from '@/components/duel/clientLogic';
import { DIALOG_BOX, FIELD_BOX, MENU_BOX, RESULT_TALL, RESULT_WIDE } from '@/game/duel/layout';
import { GAME_H_TALL } from '@/game/duel/config';

const inside = (r: Rect, W = 320, H = 240) => r.x >= 0 && r.y >= 0 && r.x + r.w <= W && r.y + r.h <= H;
// 배율 곱의 소수 오차(1e-12 수준)는 겹침으로 치지 않는다
const E = 1e-6;
const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w - E && b.x < a.x + a.w - E && a.y < b.y + b.h - E && b.y < a.y + a.h - E;
const noOverlap = (rs: Rect[]) => rs.every((a, i) => rs.every((b, j) => i === j || !overlaps(a, b)));

describe('resolveStarterUnlock', () => {
  it('시작 장수는 from 없이도 합치고, 이미 있으면 그대로', () => {
    expect(resolveStarterUnlock('zhaoyun', ['guanyu'])).toEqual(['guanyu', 'zhaoyun']);
    expect(resolveStarterUnlock('zhouyu', ['guanyu'], null)).toEqual(['guanyu', 'zhouyu']);
    expect(resolveStarterUnlock('guanyu', ['guanyu'])).toEqual(['guanyu']);
  });
  it('영입 장수는 닮은꼴 결과(from=samguk)에서 왔을 때만 합친다', () => {
    expect(resolveStarterUnlock('machao', ['guanyu'], 'samguk')).toEqual(['guanyu', 'machao']);
    expect(resolveStarterUnlock('jiangwei', ['guanyu'], 'samguk')).toEqual(['guanyu', 'jiangwei']);
  });
  it.each([[null], [''], ['generals'], ['SAMGUK'], ['samguk2']])('영입 장수 + from=%s는 변화 없음(장수 페이지·손으로 친 주소)', (from) => {
    expect(resolveStarterUnlock('machao', ['guanyu'], from as string | null)).toEqual(['guanyu']);
  });
  it('이미 장수록에 있는 영입 장수는 그대로(from 없이도 골라 쓸 수 있다)', () => {
    expect(resolveStarterUnlock('machao', ['guanyu', 'machao'])).toEqual(['guanyu', 'machao']);
  });
  it.each([['caocao'], ['<script>'], ['lvbu'], ['dongzhuo'], ['zhangjiao'], ['mob'], [''], [null]])('%s는 from=samguk이어도 변화 없음(보스·졸개·명단 밖)', (me) => {
    expect(resolveStarterUnlock(me as string | null, ['guanyu'], 'samguk')).toEqual(['guanyu']);
    expect(resolveStarterUnlock(me as string | null, ['guanyu'])).toEqual(['guanyu']);
  });
  it('입력 배열을 바꾸지 않는다', () => {
    const roster = ['guanyu'];
    resolveStarterUnlock('machao', roster, 'samguk');
    expect(roster).toEqual(['guanyu']);
  });
});

describe('needsAbandonConfirm (새로 출진 전에 한 번 더 묻기)', () => {
  it('전투·보상 중인 판이 있으면 묻는다', () => {
    expect(needsAbandonConfirm({ current: { phase: 'battle' } })).toBe(true);
    expect(needsAbandonConfirm({ current: { phase: 'reward' } })).toBe(true);
  });
  it('판이 없거나 끝났으면 묻지 않는다', () => {
    expect(needsAbandonConfirm({})).toBe(false);
    expect(needsAbandonConfirm({ current: null })).toBe(false);
    expect(needsAbandonConfirm({ current: { phase: 'won' } })).toBe(false);
    expect(needsAbandonConfirm({ current: { phase: 'lost' } })).toBe(false);
  });
  it('sortieTap: 진행 중이면 첫 누름은 확인만, 확인 뒤 두 번째 누름에 새 판', () => {
    const inRun = { current: { phase: 'battle' } };
    expect(sortieTap(inRun, false)).toBe('arm');
    expect(sortieTap(inRun, true)).toBe('start');
    expect(sortieTap({ current: { phase: 'reward' } }, false)).toBe('arm');
    // 판이 없으면 한 번에 출진
    expect(sortieTap({ current: null }, false)).toBe('start');
    expect(sortieTap({ current: { phase: 'lost' } }, false)).toBe('start');
  });
  it('경고 문구에 그 판의 싸움 번호', () => {
    expect(abandonWarning(7)).toBe('진행 중인 판(제7전)이 사라져요');
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
  it('전투 메뉴 줄 자리(메뉴 상자 x10~160 안, y 173+10i, 높이 10, 교체 줄은 상자 아래 테두리 안), 결정 단추는 대사창 전체', () => {
    const l = overlayLayout('battle');
    l.slice(0, 4).forEach((b, i) => expect(b).toMatchObject({ x: 10, y: 173 + 10 * i, w: 150, h: 10, panel: MENU_BOX }));
    expect(l[4]).toMatchObject({ x: 10, y: 213, w: 150, panel: MENU_BOX });
    expect(l[4].y + l[4].h).toBeLessThanOrEqual(MENU_BOX.y + MENU_BOX.h - 2);
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
    expect(l[4].y + l[4].h).toBeLessThanOrEqual(10 + 222 - 2);
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

// ── 세로형(폰·터치, 320×408) ──
describe('세로형 배치: 1배(폰)에서도 누를 칸이 44px 이상', () => {
  const H = GAME_H_TALL;
  const tall = { tall: true } as const;
  const at1x = (l: Rect[]) => hitRects(l, 320, H);
  const all44 = (rs: Rect[]) => rs.every((r) => r.w >= 44 && r.h >= 44);

  it('전투: 2×2 기술 카드 + 교체 단추 + 결정(대사창), 서로 겹치지 않고 320×408 안', () => {
    const l = overlayLayout('battle', 0, false, tall);
    expect(l.map((b) => b.id)).toEqual(['skill0', 'skill1', 'skill2', 'skill3', 'switch', 'confirm']);
    expect(l.every((b) => inside(b, 320, H))).toBe(true);
    expect(noOverlap(l)).toBe(true);
    // 카드는 2열 2행
    expect(l[0].y).toBe(l[1].y);
    expect(l[2].y).toBe(l[3].y);
    expect(l[0].x).toBe(l[2].x);
    expect(l[2].y).toBeGreaterThan(l[0].y);
    // 카드·교체는 벌판(가로형 240 위쪽)보다 아래
    l.slice(0, 5).forEach((b) => expect(b.y).toBeGreaterThanOrEqual(240));
  });
  it('전투 카드·교체·결정은 1배에서 그대로 44px 이상(넓힐 필요 없음)', () => {
    const l = overlayLayout('battle', 0, false, tall);
    expect(all44(l)).toBe(true);
    expect(all44(at1x(l))).toBe(true);
  });
  it.each([
    ['start', 9, false],
    ['start', 9, true],
    ['result', 0, false],
    ['recruit', 5, false],
    ['pick', 5, false],
    ['reward', 0, false],
  ] as const)('%s(n=%i, 이어하기 %s): 1배 터치 영역이 모두 44px 이상, 겹치지 않음', (scene, n, resume) => {
    const l = overlayLayout(scene, n, resume, tall);
    expect(l.every((b) => inside(b, 320, H))).toBe(true);
    const out = at1x(l);
    expect(noOverlap(out)).toBe(true);
    out.forEach((r, i) => expect(r.w >= 44 && r.h >= 44, `${l[i].id} ${r.w}x${r.h}`).toBe(true));
  });
  it('결과 별 5개는 각각 44px 이상(세로형 1배)', () => {
    const stars = overlayLayout('result', 0, false, tall).filter((b) => b.id.startsWith('star'));
    expect(stars).toHaveLength(5);
    expect(all44(stars)).toBe(true);
  });
});

describe('가로형 2배(데스크톱 640)에서 별·영입·고르기 줄 44px', () => {
  it.each([
    ['result', 0],
    ['recruit', 5],
    ['pick', 5],
  ] as const)('%s', (scene, n) => {
    const l = overlayLayout(scene, n).filter((b) => b.id !== 'page');
    const out = hitRects(l.map((r) => ({ x: r.x * 2, y: r.y * 2, w: r.w * 2, h: r.h * 2 })), 640, 480);
    out.forEach((r, i) => expect(r.h >= 44 && r.w >= 44, `${l[i].id} ${r.w}x${r.h}`).toBe(true));
  });
});

describe('결과 열전 쪽 넘김 단추', () => {
  it('쪽이 2쪽 이상이면 본문 창 자리에 page 단추가 생긴다', () => {
    expect(overlayLayout('result').some((b) => b.id === 'page')).toBe(false);
    const l = overlayLayout('result', 0, false, { pages: 2 });
    const page = l.find((b) => b.id === 'page')!;
    expect(page).toMatchObject(RESULT_WIDE.body);
    expect(noOverlap(l)).toBe(true);
    const lt = overlayLayout('result', 0, false, { pages: 3, tall: true });
    expect(lt.find((b) => b.id === 'page')).toMatchObject(RESULT_TALL.body);
  });
});
