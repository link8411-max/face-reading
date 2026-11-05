import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const svg = readFileSync('public/icons/icon-512x512.svg');
const out = (n) => `public/icons/${n}`;
const render = (size) => sharp(svg, { density: 384 }).resize(size, size);

await render(512).png().toFile(out('icon-512.png'));
await render(192).png().toFile(out('icon-192.png'));
await render(180).png().toFile(out('apple-touch-icon-180.png'));

// 배지: 배경 없이 원만 흰색 불투명, 태극 글리프는 구멍(투명)으로 뚫은 실루엣
const badgeSvg = Buffer.from(
  svg.toString()
    .replace(/<rect[^>]*\/>/, '')
    .replace('fill="#C41E3A"', 'fill="black"')
    .replace('fill="white"', 'fill="white"')
);
const { data, info } = await sharp(badgeSvg, { density: 384 })
  .resize(96, 96)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
for (let i = 0; i < data.length; i += 4) {
  const lum = data[i] / 255; // 검정(원)=0, 흰색(글리프)=1
  const a = data[i + 3] / 255;
  data[i] = data[i + 1] = data[i + 2] = 255;
  data[i + 3] = Math.round(255 * a * (1 - lum));
}
await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
  .png()
  .toFile(out('badge-96.png'));
