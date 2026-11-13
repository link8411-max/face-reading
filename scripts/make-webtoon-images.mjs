// 웹툰 캐릭터 원본에서 public/images/cast 그림을 만든다.
// 실행: node scripts/make-webtoon-images.mjs --src <원본 폴더(webtoon 폴더)>
//   <src>/originals/v2/<이름>.(png|jpg|jpeg)를 먼저 찾고, 없으면 <src>/originals/<이름>.(png|jpg|jpeg)
// 원본(장당 7~8MB)은 저장소에 넣지 않는다. 결과물과 이 스크립트, webtoon-crops.json만 커밋한다.
import sharp from 'sharp';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const si = args.indexOf('--src');
if (si < 0 || !args[si + 1]) {
  console.error('사용법: node scripts/make-webtoon-images.mjs --src <docs/design/webtoon 폴더>');
  process.exit(1);
}
const SRC = args[si + 1];
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public/images/cast');
const OUT_ANIMAL = join(ROOT, 'public/images/animal');
const OUT_MBTI = join(ROOT, 'public/images/mbti');
const OUT_ZODIAC = join(ROOT, 'public/images/zodiac');
const crops = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'webtoon-crops.json'), 'utf8'));
const DEFAULT_CROP = { cx: 0.5, cy: 0.22, size: 0.42 };

// CastKey -> 원본 파일 이름 (백호의 CastKey는 tiger)
const FILES = {
  haetae: 'haetae', saja: 'saja', gumiho: 'gumiho', mudang: 'mudang', tiger: 'baekho', dokkaebi: 'dokkaebi',
  // 새 멤버(2026-11-14): 저승사자 막내·선배, 박수무당
  sajaF: 'saja-f', sajaElder: 'saja-elder', baksu: 'baksu',
};

function find(name) {
  for (const dir of ['originals/v2', 'originals']) {
    for (const ext of ['png', 'jpg', 'jpeg']) {
      const p = join(SRC, dir, `${name}.${ext}`);
      if (existsSync(p)) return p;
    }
  }
  throw new Error(`원본 없음: ${name}`);
}

// 동물상 13종 × 여(f)·남(m): public/images/animal/<키>-<f|m>.webp(큰 그림)·-face.webp(얼굴 240)
const ANIMALS = ['dog', 'cat', 'fox', 'bear', 'rabbit', 'deer', 'tiger', 'eagle', 'desertfox', 'dino', 'wolf', 'squirrel', 'hamster'];
// MBTI 16유형: public/images/mbti/<유형>.webp·-face.webp (원본 mbti-<유형>)
const MBTIS = ['enfj', 'enfp', 'entj', 'entp', 'esfj', 'esfp', 'estj', 'estp', 'infj', 'infp', 'intj', 'intp', 'isfj', 'isfp', 'istj', 'istp'];
// 띠 12 × 여·남: public/images/zodiac/<slug>-<f|m>.webp·-face.webp (원본 zodiac-<slug>-<f|m>)
const ZODIACS = ['rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake', 'horse', 'sheep', 'monkey', 'rooster', 'dog', 'pig'];
const JOBS = [
  ...Object.entries(FILES).map(([key, name]) => ({ out: OUT, key, name, og: true })),
  ...ANIMALS.flatMap((a) => ['f', 'm'].map((g) => ({ out: OUT_ANIMAL, key: `${a}-${g}`, name: `${a}-${g}`, og: false }))),
  ...MBTIS.map((m) => ({ out: OUT_MBTI, key: m, name: `mbti-${m}`, og: false })),
  ...ZODIACS.flatMap((z) => ['f', 'm'].map((g) => ({ out: OUT_ZODIAC, key: `${z}-${g}`, name: `zodiac-${z}-${g}`, og: false }))),
];

mkdirSync(OUT, { recursive: true });
mkdirSync(OUT_MBTI, { recursive: true });
mkdirSync(OUT_ZODIAC, { recursive: true });
mkdirSync(OUT_ANIMAL, { recursive: true });
for (const { out, key, name, og } of JOBS) {
  const file = find(name);
  const meta = await sharp(file).metadata();
  const { width: w, height: h } = meta;
  // 3:4로 맞춘다. 비율이 다르면 위쪽 기준으로 자르고 오른쪽 아래는 남긴다.
  let cw = w, ch = Math.round((w * 4) / 3), left = 0, top = 0;
  if (ch > h) { ch = h; cw = Math.round((h * 3) / 4); left = w - cw; }
  const big = sharp(file).extract({ left, top, width: cw, height: ch }).resize(720, 960);
  await big.clone().webp({ quality: 74 }).toFile(join(out, `${key}.webp`));

  const c = { ...DEFAULT_CROP, ...(crops[name] ?? {}) };
  const side = Math.round(w * c.size);
  const fl = Math.max(0, Math.min(w - side, Math.round(w * c.cx - side / 2)));
  const ft = Math.max(0, Math.min(h - side, Math.round(h * c.cy - side / 2)));
  const face = sharp(file).extract({ left: fl, top: ft, width: side, height: side });
  await face.clone().resize(240, 240).webp({ quality: 80 }).toFile(join(out, `${key}-face.webp`));
  if (og) await face.clone().resize(512, 512).png({ compressionLevel: 9, palette: true }).toFile(join(out, `${key}-og.png`));
  console.log(key, '<-', file);
}
