// 정적 그림을 HTMLCanvas에 한 번 그려 Phaser 텍스처로 올린다
import type * as Phaser from 'phaser';
import { paintCloth, paintField, paintFrame } from './fieldPainter';
import { FIELD, GAME_H, GAME_H_TALL, GAME_W, PALETTE, SPRITE_PX } from './config';

export type Who = 'player' | 'enemy';

/** 높이별 천 바탕·장식 틀 텍스처 키(가로형 240, 세로형 408) */
export const clothKey = (h: number) => `cloth:${h}`;
export const frameKey = (h: number) => `frame:${h}`;

/** 스프라이트 그림이 없을 때 쓰는 색 사각형 키 */
export const fallbackSpriteKey = (who: Who) => `sprite:fallback:${who}`;

function canvasTexture(scene: Phaser.Scene, key: string, w: number, h: number, paint: (ctx: CanvasRenderingContext2D) => void) {
  if (scene.textures.exists(key)) return;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  paint(ctx);
  scene.textures.addCanvas(key, c);
}

/** 색 사각형 장수: 몸통 + 머리 + 창 한 자루(오른쪽을 본다) */
function paintFallbackSprite(ctx: CanvasRenderingContext2D, body: string) {
  const s = SPRITE_PX;
  ctx.fillStyle = PALETTE.ink;
  ctx.fillRect(9, 9, 16, 24);
  ctx.fillRect(12, 2, 10, 9);
  ctx.fillStyle = body;
  ctx.fillRect(10, 10, 14, 22);
  ctx.fillStyle = PALETTE.cream;
  ctx.fillRect(13, 3, 8, 7);
  ctx.fillStyle = PALETTE.gold;
  ctx.fillRect(24, 4, 1, s - 6);
  ctx.fillRect(23, 2, 3, 3);
}

/** 벌판·천 바탕·장식 틀·폴백 스프라이트·흰 1px 텍스처를 만든다(이미 있으면 건너뜀) */
export function makeTextures(scene: Phaser.Scene): void {
  canvasTexture(scene, 'field', FIELD.w, FIELD.h, (ctx) => paintField(ctx, FIELD.w, FIELD.h));
  for (const h of [GAME_H, GAME_H_TALL]) {
    canvasTexture(scene, clothKey(h), GAME_W, h, (ctx) => paintCloth(ctx, h));
    canvasTexture(scene, frameKey(h), GAME_W, h, (ctx) => paintFrame(ctx, h));
  }
  canvasTexture(scene, fallbackSpriteKey('player'), SPRITE_PX, SPRITE_PX, (ctx) => paintFallbackSprite(ctx, PALETTE.blue));
  canvasTexture(scene, fallbackSpriteKey('enemy'), SPRITE_PX, SPRITE_PX, (ctx) => paintFallbackSprite(ctx, PALETTE.red));
}

/** 장수 id의 스프라이트 키: 제 그림 → 졸개 그림 → 색 사각형 */
export function spriteKeyFor(scene: Phaser.Scene, id: string, who: Who): string {
  if (scene.textures.exists(`sprite:${id}`)) return `sprite:${id}`;
  if (scene.textures.exists('sprite:mob')) return 'sprite:mob';
  return fallbackSpriteKey(who);
}

/** 초상 키(없으면 null: 졸개 등) */
export function portraitKeyFor(scene: Phaser.Scene, id: string): string | null {
  return scene.textures.exists(`portrait:${id}`) ? `portrait:${id}` : null;
}
