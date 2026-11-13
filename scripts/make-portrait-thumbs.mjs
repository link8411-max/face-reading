// 삼국지 초상화(public/images/samguk/*.jpg)의 작은 판(256×256 webp)을 public/images/samguk/thumb/에 만든다.
// 초상화를 바꾸거나 더하면 다시 돌린다: node scripts/make-portrait-thumbs.mjs
// 이미 있고 원본보다 새로우면 건너뛴다. 목록·카드 같은 작은 자리는 src/lib/portraitThumb.ts로 이 판을 쓴다.
import { mkdirSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const DIR = join(import.meta.dirname, '..', 'public/images/samguk');
const OUT = join(DIR, 'thumb');
mkdirSync(OUT, { recursive: true });
let made = 0, skipped = 0, bytes = 0;
for (const f of readdirSync(DIR)) {
  if (!f.endsWith('.jpg') || !statSync(join(DIR, f)).isFile()) continue;
  const to = join(OUT, f.replace(/\.jpg$/, '.webp'));
  if (existsSync(to) && statSync(to).mtimeMs >= statSync(join(DIR, f)).mtimeMs) { skipped++; bytes += statSync(to).size; continue; }
  const info = await sharp(join(DIR, f)).resize(256, 256, { fit: 'cover' }).webp({ quality: 78 }).toFile(to);
  made++; bytes += info.size;
}
console.log(`만듦 ${made}, 건너뜀 ${skipped}, 합계 ${(bytes / 1024).toFixed(0)}KB`);
