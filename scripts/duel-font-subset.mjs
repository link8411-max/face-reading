// Galmuri 글꼴을 일기토에 쓰는 글자만 남겨 줄인다(한 번 돌려 결과를 커밋): node scripts/duel-font-subset.mjs
// 남기는 글자: KS X 1001 한글 완성형 2350자 + 출력 가능한 ASCII + 일기토 코드에 나오는 그 밖의 글자(▶▼▷·…★ 등, 2350 밖 한글 포함).
// 원본은 git 기록(이 스크립트 이전 커밋)에 있다. 이미 줄인 파일에 다시 돌려도 같은 결과다. 라이선스: public/fonts/galmuri/LICENSE.txt (SIL OFL 1.1)
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import subsetFont from 'subset-font';

const ROOT = join(import.meta.dirname, '..');
const DIR = join(ROOT, 'public/fonts/galmuri');
const FILES = ['Galmuri7.woff2', 'Galmuri9.woff2', 'Galmuri11.woff2', 'Galmuri11-Bold.woff2'];

/** KS X 1001 한글 2350자: EUC-KR 0xB0A1~0xC8FE */
function ksx1001Hangul() {
  const dec = new TextDecoder('euc-kr');
  let out = '';
  for (let hi = 0xb0; hi <= 0xc8; hi++) {
    for (let lo = 0xa1; lo <= 0xfe; lo++) out += dec.decode(new Uint8Array([hi, lo]));
  }
  return out;
}

/** 일기토 코드(화면 글·규칙 대사)에 나오는 ASCII 밖 글자 */
function sourceChars() {
  const dirs = ['src/game/duel', 'src/lib/duel', 'src/components/duel'];
  const set = new Set();
  const walk = (d) => {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(ts|tsx)$/.test(f)) for (const ch of readFileSync(p, 'utf8')) if (ch.codePointAt(0) > 0x7e) set.add(ch);
    }
  };
  for (const d of dirs) walk(join(ROOT, d));
  return [...set].join('');
}

let ascii = '';
for (let c = 0x20; c <= 0x7e; c++) ascii += String.fromCharCode(c);
const text = [...new Set([...ksx1001Hangul(), ...ascii, ...sourceChars(), ...'▶▼▷◀△▽·…★☆—–‘’“”％×'])].join('');
console.log('글자 수', [...text].length);

let total = 0;
for (const f of FILES) {
  const p = join(DIR, f);
  const before = statSync(p).size;
  const buf = await subsetFont(readFileSync(p), text, { targetFormat: 'woff2' });
  writeFileSync(p, buf);
  total += buf.length;
  console.log(f, before, '→', buf.length);
}
console.log('합계', total);
