// 사이트 글꼴(Noto Sans KR·Gowun Batang·Silkscreen)을 쓰는 글자만 남긴 woff2로 만들어 src/fonts/에 둔다(한 번 돌려 결과를 커밋).
//   node scripts/font-subset.mjs <원본 글꼴 폴더>
// 원본(커밋하지 않음):
//   Noto Sans KR  https://github.com/notofonts/noto-cjk  Sans/OTF/Korean/NotoSansCJKkr-{Regular,Bold}.otf
//   Gowun Batang  https://github.com/google/fonts  ofl/gowunbatang/GowunBatang-{Regular,Bold}.ttf
//   Silkscreen    https://github.com/google/fonts  ofl/silkscreen/Silkscreen-Regular.ttf
// 남기는 글자(한글 글꼴): KS X 1001 완성형 2350자 + ASCII + Latin-1 + 일반 문장부호·화폐·화살표·도형·CJK 기호·호환 자모·전각 ASCII
//   + src/ 코드에 실제로 나오는 그 밖의 글자(2350 밖 한글 포함). Silkscreen은 ASCII + Latin-1만.
// 라이선스: src/fonts/OFL-*.txt (SIL OFL 1.1). 글꼴은 next/font/local(src/app/layout.tsx)로 읽는다.
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import subsetFont from 'subset-font';

const ROOT = join(import.meta.dirname, '..');
const SRC = process.argv[2];
if (!SRC) { console.error('사용법: node scripts/font-subset.mjs <원본 글꼴 폴더>'); process.exit(1); }
const OUT = join(ROOT, 'src/fonts');

const range = (a, b) => { let s = ''; for (let c = a; c <= b; c++) s += String.fromCodePoint(c); return s; };

/** KS X 1001 한글 2350자: EUC-KR 0xB0A1~0xC8FE */
function ksx1001Hangul() {
  const dec = new TextDecoder('euc-kr');
  let out = '';
  for (let hi = 0xb0; hi <= 0xc8; hi++) for (let lo = 0xa1; lo <= 0xfe; lo++) out += dec.decode(new Uint8Array([hi, lo]));
  return out;
}

/** src/ 코드·문구에 나오는 ASCII 밖 글자 */
function sourceChars() {
  const set = new Set();
  const walk = (d) => {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) { if (f !== 'fonts') walk(p); }
      else if (/\.(ts|tsx|json|md)$/.test(f)) for (const ch of readFileSync(p, 'utf8')) if (ch.codePointAt(0) > 0x7e) set.add(ch);
    }
  };
  walk(join(ROOT, 'src'));
  return [...set].join('');
}

const latin = range(0x20, 0x7e) + range(0xa0, 0xff);
const symbols = range(0x2000, 0x206f) + range(0x20a0, 0x20cf) + range(0x2100, 0x25ff) + range(0x2600, 0x27bf) + range(0x3000, 0x303f) + range(0x3130, 0x318f) + range(0xff01, 0xff60);
const korean = [...new Set([...ksx1001Hangul(), ...latin, ...symbols, ...sourceChars()])].join('');
console.log('한글 글꼴 글자 수', [...korean].length, '/ 라틴 글자 수', [...latin].length);

const JOBS = [
  ['NotoSansCJKkr-Regular.otf', 'NotoSansKR-Regular.woff2', korean],
  ['NotoSansCJKkr-Bold.otf', 'NotoSansKR-Bold.woff2', korean],
  ['GowunBatang-Regular.ttf', 'GowunBatang-Regular.woff2', korean],
  ['GowunBatang-Bold.ttf', 'GowunBatang-Bold.woff2', korean],
  ['Silkscreen-Regular.ttf', 'Silkscreen-Regular.woff2', latin],
];
let total = 0;
for (const [from, to, text] of JOBS) {
  const input = readFileSync(join(SRC, from));
  const buf = await subsetFont(input, text, { targetFormat: 'woff2' });
  writeFileSync(join(OUT, to), buf);
  total += buf.length;
  console.log(`${from} ${(input.length / 1024).toFixed(0)}KB → ${to} ${(buf.length / 1024).toFixed(0)}KB`);
}
console.log('합계', (total / 1024).toFixed(0), 'KB');
