// 일기토 게임용 에셋 만들기(한 번 돌려 결과 PNG를 커밋한다): npx tsx scripts/duel-portraits.ts
// 1) 초상: 원본 jpg(1024², 장당 ~330KB) → 46×54(화면 크기 그대로, 가운데 위쪽 맞춤) → 공용 팔레트 + 4×4 오더드 디더 PNG
//    public/images/samguk/duel-portraits/<id>.png
// 2) 스프라이트: 128px PNG → 38px(팔레트 가까운 색) → 40×40 안에 1px 먹색 외곽선
//    public/images/samguk/sprites-outlined/<id>.png
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { DUEL_GENERALS } from '../src/lib/duel/generals';
import { PALETTE_RGB, hexRgb, outline, quantize } from '../src/game/duel/palette';
import { PALETTE, SPRITE_PX } from '../src/game/duel/config';

const ROOT = join(__dirname, '..', 'public', 'images', 'samguk');
const PORTRAIT = { w: 46, h: 54 } as const;
/** 디더 세기(0~255 진폭). 너무 세면 얼굴이 지저분하다 */
const DITHER = 28;

async function portraits(): Promise<void> {
  const dir = join(ROOT, 'duel-portraits');
  mkdirSync(dir, { recursive: true });
  for (const g of DUEL_GENERALS) {
    if (g.role === 'mob') continue;
    const { data, info } = await sharp(join(ROOT, `${g.name}.jpg`))
      .resize(PORTRAIT.w, PORTRAIT.h, { fit: 'cover', position: 'north', kernel: 'lanczos3' })
      // 줄이면 흐려지니 대비를 조금 올린다
      .modulate({ saturation: 1.1 })
      .linear(1.08, -8)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const q = quantize(data, info.width, info.height, PALETTE_RGB, { dither: DITHER });
    const out = join(dir, `${g.id}.png`);
    await sharp(Buffer.from(q), { raw: { width: info.width, height: info.height, channels: 4 } })
      .png({ palette: true, colours: 64, compressionLevel: 9, effort: 10 })
      .toFile(out);
    console.log('초상', g.id, out);
  }
}

async function sprites(): Promise<void> {
  const dir = join(ROOT, 'sprites-outlined');
  mkdirSync(dir, { recursive: true });
  const inner = SPRITE_PX - 2;
  for (const g of DUEL_GENERALS) {
    const { data, info } = await sharp(join(ROOT, 'sprites', g.sprite))
      .resize(inner, inner, { kernel: 'lanczos3', fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const q = quantize(data, info.width, info.height, PALETTE_RGB, { alphaCut: 110 });
    // 40×40 가운데에 놓고(사방 1px), 먹색 외곽선
    const W = SPRITE_PX;
    const padded = new Uint8ClampedArray(W * W * 4);
    for (let y = 0; y < inner; y++) padded.set(q.subarray(y * inner * 4, (y + 1) * inner * 4), ((y + 1) * W + 1) * 4);
    const o = outline(padded, W, W, hexRgb(PALETTE.ink));
    const out = join(dir, `${g.id}.png`);
    await sharp(Buffer.from(o), { raw: { width: W, height: W, channels: 4 } })
      .png({ palette: true, colours: 64, compressionLevel: 9, effort: 10 })
      .toFile(out);
    console.log('스프라이트', g.id, out);
  }
}

void (async () => {
  await portraits();
  await sprites();
})();
