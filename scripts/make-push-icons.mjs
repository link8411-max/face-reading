// PWA·푸시 아이콘과 favicon.ico를 해태 얼굴(public/images/cast/haetae-og.png)에서 만든다.
// 실행: node scripts/make-push-icons.mjs
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

const SRC = 'public/images/cast/haetae-og.png'; // 512px 정사각 해태 얼굴
const BLUE = '#2D55FF';
const out = (n) => `public/icons/${n}`;

// 파란 둥근 사각 바탕 위에 해태 얼굴을 둥글게 얹는다. radius 0이면 꽉 찬 정사각(애플 아이콘, iOS가 직접 둥글린다)
async function icon(size, { radius = 0.22, inner = 0.78 } = {}) {
  const art = Math.round(size * inner);
  const r = Math.round(art * 0.24);
  const mask = Buffer.from(`<svg width="${art}" height="${art}"><rect width="${art}" height="${art}" rx="${r}" fill="#fff"/></svg>`);
  const face = await sharp(SRC).resize(art, art).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  const bgRadius = Math.round(size * radius);
  const bg = Buffer.from(`<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${bgRadius}" fill="${BLUE}"/></svg>`);
  const off = Math.round((size - art) / 2);
  return sharp(bg).composite([{ input: face, left: off, top: off }]).png().toBuffer();
}

await sharp(await icon(512)).toFile(out('icon-512.png'));
await sharp(await icon(192)).toFile(out('icon-192.png'));
await sharp(await icon(180, { radius: 0, inner: 0.82 })).toFile(out('apple-touch-icon-180.png'));

// 배지(알림용 96px): 해태 모양만 흰색 불투명, 나머지는 투명한 실루엣. 바탕색(모서리 픽셀)과 다른 곳을 몸으로 본다.
const { data, info } = await sharp(SRC).resize(96, 96).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const bgPix = [data[0], data[1], data[2]];
for (let i = 0; i < data.length; i += 4) {
  const d = Math.hypot(data[i] - bgPix[0], data[i + 1] - bgPix[1], data[i + 2] - bgPix[2]);
  const a = Math.max(0, Math.min(1, (d - 40) / 40));
  data[i] = data[i + 1] = data[i + 2] = 255;
  data[i + 3] = Math.round(255 * a);
}
await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toFile(out('badge-96.png'));

// favicon.ico: 16·32·48 PNG를 담은 ICO
const sizes = [16, 32, 48];
const pngs = await Promise.all(sizes.map(async (s) => sharp(await icon(s, { radius: 0.2, inner: 0.84 })).png().toBuffer()));
const head = Buffer.alloc(6); head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(sizes.length, 4);
let offset = 6 + 16 * sizes.length;
const dir = pngs.map((p, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(sizes[i] === 256 ? 0 : sizes[i], 0); e.writeUInt8(sizes[i], 1);
  e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6); e.writeUInt32LE(p.length, 8); e.writeUInt32LE(offset, 12);
  offset += p.length;
  return e;
});
writeFileSync('src/app/favicon.ico', Buffer.concat([head, ...dir, ...pngs]));
console.log('아이콘 생성 완료');
