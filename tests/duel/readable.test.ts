import { describe, it, expect } from 'vitest';
import { FONT_KO_7, FONT_KO_9, FONT_KO_11, FONT_NUM_PX, KO_FAMILY, KO_PX } from '@/game/duel/config';
import { BODY_CHARS, BODY_MAX, bodyLines } from '@/game/duel/wrap';
import { stageSize } from '@/components/duel/clientLogic';

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

describe('열전 본문 bodyLines', () => {
  it('7줄을 넘지 않고 첫 문장·마지막 문장은 남긴다', () => {
    const first = '관우, 황건적을 셋 베고 나아가다.';
    const last = '관우가 여포를 꺾으니, 천하에 이름을 떨치다.';
    const mid = Array.from({ length: 8 }, (_, i) => `열${i}째 싸움, 누군가를 꺾고 앞으로 나아가니 사기가 올랐다.`);
    const out = bodyLines([first, ...mid, last]);
    expect(out.length).toBeLessThanOrEqual(BODY_MAX);
    expect(out.every((l) => l.length <= BODY_CHARS)).toBe(true);
    const joined = out.join(' ');
    expect(joined.startsWith('관우, 황건적을')).toBe(true);
    expect(joined.endsWith('떨치다.')).toBe(true);
  });
});
