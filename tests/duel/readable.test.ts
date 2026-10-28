import { describe, it, expect } from 'vitest';
import { FONT_KO_7, FONT_KO_9, FONT_KO_11, FONT_NUM_PX, KO_FAMILY, KO_PX } from '@/game/duel/config';
import { bodyPages } from '@/game/duel/wrap';
import { BODY_CHARS_11 } from '@/game/duel/layout';
import { stageLayout, stageSize } from '@/components/duel/clientLogic';
import { GAME_H, GAME_H_TALL, GAME_W } from '@/game/duel/config';

describe('글꼴은 제 화소 크기로만', () => {
  it('Galmuri7 8px · Galmuri9 10px · Galmuri11 12px, Silkscreen 8px', () => {
    expect(KO_PX).toEqual({ 7: 8, 9: 10, 11: 12 });
    expect(KO_FAMILY).toEqual({ 7: FONT_KO_7, 9: FONT_KO_9, 11: FONT_KO_11 });
    expect(FONT_NUM_PX).toBe(8);
  });
});

describe('stageSize: 정수 배율 무대', () => {
  it.each([
    [343, 3, 320, 240], // 375px 폰(3배): 1029 기기px → 3배 → CSS 320
    [343, 2, 320, 240],
    [480, 2, 480, 360], // 2배 데스크톱: 960 → 3배 → CSS 480
    [480, 1, 320, 240], // 1배 데스크톱: CSS 정수 1배
    [343, 1.5, 320, 240], // 1.5배: 기기 정수 배율이 320 CSS보다 작아져 CSS 정수 배율로
  ])('래퍼 %ipx · 배율 %s → %ix%i', (W, dpr, w, h) => {
    const s = stageSize(W, dpr);
    expect(s.w).toBe(w);
    expect(s.h).toBe(h);
    expect(s.w).toBeLessThanOrEqual(W);
    // 기기 배율이 정수면 기기 화소도 정수 배율, 아니면 CSS 정수 배율
    expect(Number.isInteger(dpr) ? Number.isInteger(s.zoom) : Number.isInteger(s.w / 320)).toBe(true);
  });
  it('320px보다 좁으면 래퍼에 맞춘 소수 배율(4:3)', () => {
    expect(stageSize(300, 2)).toMatchObject({ w: 300, h: 225 });
  });
});

describe('stageSize: 화면 높이도 본다(세로로 넘치지 않는 최대 정수 배율)', () => {
  it('데스크톱 1280×800(래퍼 1248, 높이 여유 720): 폭으로는 3배지만 높이로 3배 → 960×720', () => {
    expect(stageSize(1248, 1, 720)).toMatchObject({ w: 960, h: 720, zoom: 3 });
  });
  it('높이가 모자라면 배율을 낮춘다(래퍼 1248, 높이 600 → 2배)', () => {
    expect(stageSize(1248, 1, 600)).toMatchObject({ w: 640, h: 480, zoom: 2 });
  });
  it('480px 상한이 없다: 래퍼 1000 · 2배 화면 · 높이 넉넉 → 기기 6배 = CSS 960', () => {
    expect(stageSize(1000, 2, 2000)).toMatchObject({ w: 960, h: 720, zoom: 6 });
  });
  it('세로형(320×408) 높이로도 잰다', () => {
    expect(stageSize(375, 2, 800, GAME_H_TALL)).toMatchObject({ w: 320, h: GAME_H_TALL, zoom: 2 });
  });
  it('높이가 1배도 안 되면 1배로 둔다(아주 낮은 창)', () => {
    expect(stageSize(1248, 1, 100)).toMatchObject({ w: 320, h: 240, zoom: 1 });
  });
});

describe('stageLayout: 폰·터치는 세로형, 넓은 마우스 화면은 가로형', () => {
  it('375@2 폰(래퍼 375, 높이 750): 캔버스 폭 320 < 400 → 세로형 320×408', () => {
    expect(stageLayout(375, 2, 750, false)).toMatchObject({ w: GAME_W, h: GAME_H_TALL, tall: true });
  });
  it('데스크톱 1280×800 마우스: 가로형 최대 배율', () => {
    expect(stageLayout(1248, 1, 720, false)).toMatchObject({ w: 960, h: 720, tall: false });
  });
  it('태블릿(터치) 768×1024: 세로형 2배', () => {
    expect(stageLayout(768, 2, 950, true)).toMatchObject({ w: 640, h: GAME_H_TALL * 2, tall: true });
  });
  it('세로형이 높이에 안 들어가면(가로로 눕힌 폰) 가로형으로', () => {
    expect(stageLayout(667, 2, 300, true)).toMatchObject({ h: GAME_H, tall: false });
  });
});

describe('열전 본문 bodyPages: 쪽 나눔(문장을 빼지 않는다)', () => {
  const first = '관우, 황건적을 셋 베고 나아가다.';
  const last = '관우가 여포를 꺾으니, 천하에 이름을 떨치다.';
  const mid = Array.from({ length: 8 }, (_, i) => `열${i}째 싸움, 누군가를 꺾고 앞으로 나아가니 사기가 올랐다.`);
  it('쪽마다 perPage줄 이하, 줄은 BODY_CHARS_11자 이하, 모든 글이 순서대로 남는다', () => {
    const pages = bodyPages([first, ...mid, last], 6);
    expect(pages.length).toBeGreaterThan(1);
    expect(pages.every((p) => p.length >= 1 && p.length <= 6)).toBe(true);
    expect(pages.flat().every((l) => l.length <= BODY_CHARS_11)).toBe(true);
    const joined = pages.flat().join(' ');
    expect(joined.startsWith('관우, 황건적을')).toBe(true);
    expect(joined.endsWith('떨치다.')).toBe(true);
    for (const m of mid) expect(joined.replace(/\s+/g, '')).toContain(m.replace(/\s+/g, ''));
  });
  it('짧으면 한 쪽, 비면 빈 한 쪽', () => {
    expect(bodyPages([first], 6)).toHaveLength(1);
    expect(bodyPages([], 6)).toEqual([[]]);
  });
});
