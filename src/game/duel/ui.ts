// 캔버스 UI 그리기 헬퍼(와꾸 v5의 box·tag·hp·cursor·fire를 Phaser Graphics/Text로)
import type * as Phaser from 'phaser';
import { FONT_KR, FONT_NUM, FONT_NUM_PX, KO_FAMILY, KO_PX, MUTED, PALETTE as S, hex, type KoFont } from './config';

type G = Phaser.GameObjects.Graphics;

/** next/font가 붙인 실제 글꼴 이름(BootScene이 채운다) */
export const fonts = { kr: FONT_KR, num: FONT_NUM };

function px(g: G, col: string, x: number, y: number, w = 1, h = 1) {
  g.fillStyle(hex(col), 1);
  g.fillRect(x, y, w, h);
}

/** 베벨 상자: 먹 테두리 + 안쪽 채움 + 금(위·왼)/진금(아래·오른) 선 */
export function box(g: G, x: number, y: number, w: number, h: number, fill: string = S.cream): void {
  px(g, S.ink, x, y, w, h);
  px(g, fill, x + 2, y + 2, w - 4, h - 4);
  px(g, S.gold, x + 1, y + 1, w - 2, 1);
  px(g, S.gold, x + 1, y + 1, 1, h - 2);
  px(g, S.gold2, x + 1, y + h - 2, w - 2, 1);
  px(g, S.gold2, x + w - 2, y + 1, 1, h - 2);
}

/** 체력바(눈금 6px마다). ratio 0~1 */
export function hpBar(g: G, x: number, y: number, w: number, ratio: number, col: string): void {
  const r = ratio < 0 ? 0 : ratio > 1 ? 1 : ratio;
  px(g, S.ink, x, y, w, 6);
  px(g, S.gold2, x, y, w, 1);
  px(g, S.gold2, x, y + 5, w, 1);
  const fill = Math.round((w - 2) * r);
  if (fill > 0) px(g, col, x + 1, y + 1, fill, 4);
  for (let i = x + 1; i < x + w - 1; i += 6) px(g, S.ink, i, y + 1, 1, 4);
}

/** ▶ 커서(빨강 삼각, 3×5) */
export function cursor(g: G, x: number, y: number): void {
  px(g, S.red, x, y, 1, 5);
  px(g, S.red, x + 1, y + 1, 1, 3);
  px(g, S.red, x + 2, y + 2, 1, 1);
}

/** 불꽃 한 프레임(k = 0..2, 클수록 크다) */
export function spark(g: G, cx: number, cy: number, k: number): void {
  const cols = ['#ffffff', '#ffe08a', '#ff9a3c'];
  for (let i = 0; i <= k; i++) {
    px(g, cols[i], cx - 1 - i, cy, 3 + 2 * i, 1);
    px(g, cols[i], cx, cy - 1 - i, 1, 3 + 2 * i);
  }
}

/** 흰 베기 호 한 프레임(k = 0..2), dir 1=오른쪽으로 벤다 */
export function slashArc(g: G, cx: number, cy: number, k: number, dir: 1 | -1): void {
  g.lineStyle(k === 1 ? 2 : 1, hex(S.white), k === 2 ? 0.5 : 1);
  const start = dir === 1 ? -2.2 : -0.9;
  g.beginPath();
  g.arc(cx, cy, 10 + k * 4, start + k * 0.3, start + 1.8 + k * 0.3, false);
  g.strokePath();
}

export interface TextOpt {
  size?: number;
  color?: string;
  bold?: boolean;
  num?: boolean;
  /** Galmuri 글꼴(7·9·11). 늘 그 글꼴의 제 화소 크기로만 그린다(size 무시). 없는 글자(한자 등)는 본문 글꼴로 */
  ko?: KoFont;
  wrap?: number;
  /** 어두운 바탕 위 밝은 글씨: 1px 먹색 그림자 */
  shadow?: boolean;
}

const family = (opt: TextOpt) =>
  opt.num ? fonts.num : opt.ko ? `${KO_FAMILY[opt.ko]}, ${fonts.kr}` : fonts.kr;

/** 도트 느낌 글씨(resolution 1). num이면 Silkscreen, ko면 Galmuri */
export function text(scene: Phaser.Scene, x: number, y: number, s: string, opt: TextOpt = {}): Phaser.GameObjects.Text {
  // 비트맵 글꼴은 제 크기에서만 또렷하다: Galmuri는 KO_PX, Silkscreen 숫자는 FONT_NUM_PX(또는 그 배수)
  const px = opt.ko ? KO_PX[opt.ko] : opt.num ? (opt.size && opt.size >= FONT_NUM_PX * 2 ? FONT_NUM_PX * 2 : FONT_NUM_PX) : (opt.size ?? 8);
  const t = scene.add.text(Math.round(x), Math.round(y), s, {
    fontFamily: family(opt),
    fontSize: `${px}px`,
    ...(opt.wrap ? { wordWrap: { width: opt.wrap, useAdvancedWrap: true } } : {}),
    fontStyle: opt.bold ? 'bold' : 'normal',
    color: opt.color ?? S.ink,
    resolution: 1,
  });
  if (opt.shadow) t.setShadow(1, 1, S.ink, 0, false, true);
  return t;
}

/** 표찰(예: 무력 73). 값 글씨를 돌려준다 */
export function tag(scene: Phaser.Scene, g: G, x: number, y: number, label: string): Phaser.GameObjects.Text {
  box(g, x, y, 44, 12, S.cream);
  text(scene, x + 3, y + 1, label, { ko: 9, color: S.red });
  return text(scene, x + 25, y + 2, '', { num: true });
}

/** 유형 한 글자(猛·騎·智) */
export const KIND_MARK: Record<string, string> = { 맹장: '猛', 기장: '騎', 지장: '智' };

export { MUTED };
