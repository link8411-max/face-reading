import { describe, it, expect } from 'vitest';
import { DUEL_PALETTE, PALETTE_RGB, hexRgb, nearest, quantize, outline } from '@/game/duel/palette';
import { PALETTE } from '@/game/duel/config';

const key = (d: ArrayLike<number>, i: number) => `${d[i]},${d[i + 1]},${d[i + 2]}`;
const palKeys = new Set(PALETTE_RGB.map((c) => c.join(',')));

describe('공용 팔레트', () => {
  it('32~40색, 겹치지 않고, 기존 PALETTE를 모두 담는다', () => {
    expect(DUEL_PALETTE.length).toBeGreaterThanOrEqual(32);
    expect(DUEL_PALETTE.length).toBeLessThanOrEqual(40);
    expect(new Set(DUEL_PALETTE.map((c) => c.toUpperCase())).size).toBe(DUEL_PALETTE.length);
    for (const c of Object.values(PALETTE)) expect(DUEL_PALETTE.map((x) => x.toUpperCase())).toContain(c.toUpperCase());
  });
  it('hexRgb', () => {
    expect(hexRgb('#1A1C2C')).toEqual([26, 28, 44]);
  });
  it('nearest: 팔레트 색은 자기 자신을 고른다', () => {
    PALETTE_RGB.forEach((c, i) => expect(nearest(c, PALETTE_RGB)).toBe(i));
  });
});

describe('quantize: 팔레트 양자화 + 4×4 오더드 디더', () => {
  const W = 8;
  const H = 8;
  const solid = (r: number, g: number, b: number, a = 255) => {
    const d = new Uint8ClampedArray(W * H * 4);
    for (let i = 0; i < W * H; i++) d.set([r, g, b, a], i * 4);
    return d;
  };
  it('모든 불투명 화소가 팔레트 색이 되고, 같은 입력이면 같은 결과', () => {
    const src = new Uint8ClampedArray(W * H * 4);
    for (let i = 0; i < W * H; i++) src.set([(i * 37) % 256, (i * 91) % 256, (i * 13) % 256, 255], i * 4);
    const a = quantize(src, W, H, PALETTE_RGB, { dither: 32 });
    for (let i = 0; i < a.length; i += 4) expect(palKeys.has(key(a, i))).toBe(true);
    expect(Array.from(a)).toEqual(Array.from(quantize(src, W, H, PALETTE_RGB, { dither: 32 })));
  });
  it('두 팔레트 색 사이의 중간색은 디더로 두 색이 섞인다(디더 없으면 한 색)', () => {
    const [r, g, b] = [0, 1, 2].map((k) => Math.round((PALETTE_RGB[0][k] + PALETTE_RGB[7][k]) / 2));
    const pal = [PALETTE_RGB[0], PALETTE_RGB[7]];
    const flat = quantize(solid(r, g, b), W, H, pal, { dither: 0 });
    const dith = quantize(solid(r, g, b), W, H, pal, { dither: 48 });
    const colors = (d: Uint8ClampedArray) => new Set(Array.from({ length: W * H }, (_, i) => key(d, i * 4))).size;
    expect(colors(flat)).toBe(1);
    expect(colors(dith)).toBe(2);
  });
  it('알파: 기준보다 옅으면 투명(0), 아니면 불투명(255)', () => {
    const q = quantize(solid(200, 100, 50, 60), W, H, PALETTE_RGB, { alphaCut: 128 });
    for (let i = 3; i < q.length; i += 4) expect(q[i]).toBe(0);
    const q2 = quantize(solid(200, 100, 50, 200), W, H, PALETTE_RGB, { alphaCut: 128 });
    for (let i = 3; i < q2.length; i += 4) expect(q2[i]).toBe(255);
  });
});

describe('outline: 1px 먹색 외곽선', () => {
  it('불투명 화소의 상하좌우 투명 이웃만 먹색으로 칠한다(대각선·안쪽은 그대로)', () => {
    const W = 5;
    const d = new Uint8ClampedArray(W * W * 4);
    d.set([255, 0, 0, 255], (2 * W + 2) * 4);
    const o = outline(d, W, W, [27, 26, 23]);
    const at = (x: number, y: number) => Array.from(o.slice((y * W + x) * 4, (y * W + x) * 4 + 4));
    expect(at(2, 2)).toEqual([255, 0, 0, 255]);
    for (const [x, y] of [[1, 2], [3, 2], [2, 1], [2, 3]]) expect(at(x, y)).toEqual([27, 26, 23, 255]);
    for (const [x, y] of [[1, 1], [3, 3], [0, 0]]) expect(at(x, y)[3]).toBe(0);
  });
});
