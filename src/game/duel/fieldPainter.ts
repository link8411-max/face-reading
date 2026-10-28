// 일기토 정적 그림(Phaser 없음): 2D 컨텍스트에 벌판·천 바탕·장식 틀을 그린다.
// textures.ts가 HTMLCanvas에 한 번 그려 Phaser 텍스처로 올린다. 모든 사각형은 정수 픽셀.
import { PALETTE as S, GAME_W, GAME_H } from './config';

type Ctx = CanvasRenderingContext2D;

function px(ctx: Ctx, col: string, x: number, y: number, w = 1, h = 1) {
  ctx.fillStyle = col;
  ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
}

// 296×70 설계 기준 돌·풀 자리 (이전 fieldRenderer 값)
const ROCKS = [
  [20, 70], [48, 84], [75, 62], [110, 78], [140, 90], [172, 66],
  [205, 86], [238, 72], [268, 60], [296, 82], [160, 58], [90, 92],
].map(([x, y]) => [Math.round(x * 0.925), Math.round(36 + (y - 50) * 0.74)]);
const GRASS = [
  [36, 58], [128, 64], [220, 60], [300, 66], [60, 88], [250, 92],
].map(([x, y]) => [Math.round(x * 0.925), Math.round(36 + (y - 50) * 0.74)]);

/** 벌판 띠: 하늘 4단(체커 디더)·구름·산맥 둘·숲 띠·황토 벌판(가로줄+디더)·돌·풀. (0,0)부터 w×h */
export function paintField(ctx: Ctx, w: number, h: number): void {
  const sx = w / 296;
  const sy = h / 70;
  // 설계 좌표 → 픽셀
  const r = (col: string, x: number, y: number, ww = 1, hh = 1) => {
    const x0 = Math.round(x * sx);
    const y0 = Math.round(y * sy);
    px(ctx, col, x0, y0, Math.max(1, Math.round((x + ww) * sx) - x0), Math.max(1, Math.round((y + hh) * sy) - y0));
  };
  const W = 296;
  // 산이 낮은 곳에 하늘과 숲 사이 틈이 비지 않게 먼 산 색으로 먼저 깐다
  r('#6f8c93', 0, 0, W, 36);
  const sky = ['#8fb6e0', '#a3c3e6', '#b7d0ea', '#cbdcef'];
  for (let y = 0; y < 30; y++) {
    const b = Math.min(3, (y / 7.5) | 0);
    r(sky[b], 0, y, W, 1);
    if (y % 7 >= 5 && b < 3) for (let i = y % 2; i < W; i += 2) r(sky[b + 1], i, y);
  }
  for (const [cx, cy, cw] of [
    [28, 6, 13],
    [48, 9, 7],
    [166, 4, 16],
    [231, 7, 9],
  ]) {
    r('#e9f1f8', cx, cy, cw, 2);
    r('#e9f1f8', cx + 3, cy - 2, cw - 6, 2);
  }
  const ridge = (col: string, base: number, amp: number, seed: number, step: number) => {
    for (let x = 0; x < W; x++) {
      const hh = amp * (0.55 + 0.45 * Math.sin(x / step + seed) + 0.25 * Math.sin(x / (step * 0.37) + seed * 2));
      r(col, x, (base - hh) | 0, 1, (hh | 0) + 1);
    }
  };
  ridge('#6f8c93', 34, 10, 1.3, 26);
  ridge('#55727a', 35, 7, 4.1, 16);
  for (let y = 32; y < 36; y++) for (let i = y % 2; i < W; i += 2) r(y < 34 ? '#4f6b43' : '#5d7a4b', i, y);
  r('#5d7a4b', 0, 34, W, 2);
  const g = ['#c7ad70', '#bfa365', '#b3985b', '#a98e52'];
  for (let y = 36; y < 70; y++) {
    const b = Math.min(3, ((y - 36) / 9) | 0);
    r(g[b], 0, y, W, 1);
    if (y % 3 === 0) for (let i = y % 2; i < W; i += 2) r(g[Math.min(3, b + 1)], i, y);
  }
  for (const [rx, ry] of ROCKS) {
    r('#8b7445', rx, ry, 5, 2);
    r('#a48a52', rx + 1, ry - 1, 3, 1);
    r('#6d5a35', rx, ry + 2, 5, 1);
  }
  for (const [gx, gy] of GRASS) {
    r('#6f8a45', gx, gy, 1, 2);
    r('#6f8a45', gx + 2, gy - 1, 1, 3);
    r('#6f8a45', gx + 4, gy, 1, 2);
  }
}

/** 바탕: 녹색 천 + 체커 디더 + 용 문양처럼 보이는 곡선 (320×h, 세로형은 아래에 곡선 둘을 더) */
export function paintCloth(ctx: Ctx, h: number = GAME_H): void {
  px(ctx, S.green1, 0, 0, GAME_W, h);
  for (let y = 0; y < h; y++) for (let i = y % 2; i < GAME_W; i += 2) px(ctx, S.green2, i, y);
  ctx.strokeStyle = S.green3;
  ctx.lineWidth = 1;
  const seeds = [
    [40, 40, 38],
    [270, 60, 44],
    [70, 190, 30],
    [250, 200, 36],
    [160, 120, 60],
    ...(h > GAME_H ? [[60, 320, 44], [260, 360, 40]] : []),
  ];
  for (const [cx, cy, rad] of seeds) {
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.arc(cx, cy, rad - k * 9, k * 0.9, k * 0.9 + 4.2);
      ctx.stroke();
    }
  }
}

/** 장식 틀: 금-적-금 삼중선 + 네 모서리 문양 (320×h, 나머지는 투명) */
export function paintFrame(ctx: Ctx, h: number = GAME_H): void {
  const b = h - GAME_H;
  px(ctx, S.gold, 2, 2, 316, 1);
  px(ctx, S.gold, 2, 237 + b, 316, 1);
  px(ctx, S.gold, 2, 2, 1, 236 + b);
  px(ctx, S.gold, 317, 2, 1, 236 + b);
  px(ctx, S.red, 4, 4, 312, 1);
  px(ctx, S.red, 4, 235 + b, 312, 1);
  px(ctx, S.red, 4, 4, 1, 232 + b);
  px(ctx, S.red, 315, 4, 1, 232 + b);
  px(ctx, S.gold2, 6, 6, 308, 1);
  px(ctx, S.gold2, 6, 233 + b, 308, 1);
  px(ctx, S.gold2, 6, 6, 1, 228 + b);
  px(ctx, S.gold2, 313, 6, 1, 228 + b);
  for (const [cx, cy] of [
    [0, 0],
    [306, 0],
    [0, 226 + b],
    [306, 226 + b],
  ]) {
    px(ctx, S.gold, cx + 3, cy + 3, 11, 11);
    px(ctx, S.red, cx + 5, cy + 5, 7, 7);
    px(ctx, S.gold, cx + 7, cy + 7, 3, 3);
    px(ctx, S.navy, cx + 8, cy + 8, 1, 1);
  }
}
