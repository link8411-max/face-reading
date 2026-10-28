// 일기토 공용 팔레트(40색)와 양자화 도구(Phaser 없음). 게임용 초상·스프라이트를 미리 만드는 스크립트
// (scripts/duel-portraits.ts)가 쓰고, 화면 색(PALETTE)도 이 안에 든다.
import { PALETTE } from './config';

export type RGB = readonly [number, number, number];

/** 와꾸 PALETTE 12색 + 초상(살빛·갈색·갑옷)·벌판 색 28색 */
export const DUEL_PALETTE: readonly string[] = [
  ...Object.values(PALETTE),
  // 갈색·가죽·머리카락
  '#3B2A20',
  '#5E3F2B',
  '#8A5A3B',
  '#B98656',
  // 살빛
  '#E2B48A',
  '#C98E68',
  '#9A6448',
  // 빨강·주황
  '#6E2620',
  '#D9563C',
  '#E07B39',
  // 녹색(관우 전포)·청록
  '#2E6B3A',
  '#3E7F74',
  // 하늘·쇠·푸른 갑옷
  '#8FB6E0',
  '#CBDCEF',
  '#24365E',
  '#5D6E86',
  '#8C9AAE',
  // 따뜻한 회색
  '#3A3632',
  '#6B6259',
  '#A39C90',
  '#CFC8BC',
  // 벌판: 먼 산·숲·땅
  '#6F8C93',
  '#4F6B43',
  '#D2BF8A',
  '#B9A26A',
  '#8B7445',
  // 보라·밝은 금
  '#4B3A5A',
  '#F5D98A',
];

export function hexRgb(h: string): RGB {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export const PALETTE_RGB: readonly RGB[] = DUEL_PALETTE.map(hexRgb);

/** 가장 가까운 팔레트 색 번호(사람 눈에 가까운 redmean 거리) */
export function nearest(c: readonly number[], pal: readonly RGB[]): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < pal.length; i++) {
    const p = pal[i];
    const rm = (c[0] + p[0]) / 2;
    const dr = c[0] - p[0];
    const dg = c[1] - p[1];
    const db = c[2] - p[2];
    const d = (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

/** 4×4 바이어 행렬(0~15) */
export const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
] as const;

export interface QuantizeOpts {
  /** 오더드 디더 세기(0~255 단위 진폭). 0이면 가장 가까운 색만 */
  dither?: number;
  /** 알파가 이보다 작으면 투명, 아니면 불투명(기본 128) */
  alphaCut?: number;
}

/** RGBA 화소를 팔레트 색으로(4×4 오더드 디더). 새 배열을 돌려준다 */
export function quantize(src: ArrayLike<number>, w: number, h: number, pal: readonly RGB[], opts: QuantizeOpts = {}): Uint8ClampedArray {
  const amp = opts.dither ?? 0;
  const cut = opts.alphaCut ?? 128;
  const out = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (src[i + 3] < cut) continue;
      const off = amp ? ((BAYER4[y & 3][x & 3] + 0.5) / 16 - 0.5) * amp : 0;
      const p = pal[nearest([src[i] + off, src[i + 1] + off, src[i + 2] + off], pal)];
      out[i] = p[0];
      out[i + 1] = p[1];
      out[i + 2] = p[2];
      out[i + 3] = 255;
    }
  }
  return out;
}

/** 불투명 화소의 상하좌우 투명 이웃을 col로 칠한다(1px 외곽선). 새 배열을 돌려준다 */
export function outline(src: ArrayLike<number>, w: number, h: number, col: RGB): Uint8ClampedArray {
  const out = Uint8ClampedArray.from(src as ArrayLike<number>);
  const solid = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && src[(y * w + x) * 4 + 3] > 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (solid(x, y)) continue;
      if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) out.set([col[0], col[1], col[2], 255], (y * w + x) * 4);
    }
  }
  return out;
}
