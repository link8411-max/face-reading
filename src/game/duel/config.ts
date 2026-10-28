// 일기토 화면 상수: 320×240 한 장, 와꾸 v5의 팔레트·좌표 그대로
export const GAME_W = 320;
export const GAME_H = 240;

/** 벌판 띠(전투 장면) 자리 */
export const FIELD = { x: 12, y: 78, w: 296, h: 70 } as const;

/** 스프라이트 크기(128px 원본을 줄여 그림) */
export const SPRITE_PX = 34;

/** 와꾸 v5의 S 객체 */
export const PALETTE = {
  navy: '#1A1C2C',
  green1: '#1E3A24',
  green2: '#27482C',
  green3: '#2F5433',
  gold: '#E8B547',
  gold2: '#9C7320',
  red: '#B9402E',
  cream: '#F2E6C9',
  cream2: '#D9CBA6',
  ink: '#1B1A17',
  blue: '#3E6FC7',
  white: '#FFFFFF',
} as const;

/** 회색 글씨(보조 설명) */
export const MUTED = '#6B6259';

export const FONT_KR = '"Noto Sans KR", sans-serif';
export const FONT_NUM = 'Silkscreen, monospace';

/** Galmuri 비트맵 한글(SIL OFL, public/fonts/galmuri, duel.css의 @font-face). 숫자는 Silkscreen 그대로 */
export const FONT_KO_9 = 'Galmuri9';
export const FONT_KO_11 = 'Galmuri11';
export const FONT_KO_7 = 'Galmuri7';
export type KoFont = 7 | 9 | 11;
export const KO_FAMILY: Record<KoFont, string> = { 7: FONT_KO_7, 9: FONT_KO_9, 11: FONT_KO_11 };
/** 각 글꼴의 화소 격자에 맞는 글자 크기(px). Galmuri는 이 크기에서만 또렷하다(Galmuri7 8px, Galmuri9 10px, Galmuri11 12px) */
export const KO_PX: Record<KoFont, number> = { 7: 8, 9: 10, 11: 12 };
/** Silkscreen(숫자)의 화소 격자 크기. 8px 또는 그 배수(16px)만 쓴다 */
export const FONT_NUM_PX = 8;

/** '#RRGGBB' → 0xRRGGBB (Phaser Graphics용) */
export const hex = (c: string): number => parseInt(c.slice(1), 16);
