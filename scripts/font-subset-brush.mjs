// 전통 부적 그림 속 한자 글꼴(霞鹜文楷 TC, LXGW WenKai TC Medium)을 부적에 쓰는 한자만 남긴 woff2로 만든다(한 번 돌려 결과를 커밋).
//   node scripts/font-subset-brush.mjs <LXGWWenKaiTC-Medium.ttf 경로>
// 원본(커밋하지 않음): https://github.com/lxgw/LxgwWenkaiTC/releases  LXGWWenKaiTC-Medium.ttf
// 남기는 글자: src/content/bujeok.ts의 hanja 글귀 전부 + 그림에 고정으로 쓰는 글자(BRUSH_FIXED)
// 라이선스: src/fonts/OFL-LXGWWenKaiTC.txt (SIL OFL 1.1, 예약 글꼴 이름 없음)
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import subsetFont from 'subset-font'

const ROOT = join(import.meta.dirname, '..')
const SRC = process.argv[2]
if (!SRC) {
  console.error('사용법: node scripts/font-subset-brush.mjs <LXGWWenKaiTC-Medium.ttf>')
  process.exit(1)
}

/** 그림에 고정으로 들어가는 글자: 머리글 勅令, 해·달, 글귀 急急如律令, 도장 吉, 뒷면 福 */
export const BRUSH_FIXED = '勅令日月急如律吉福'

const content = readFileSync(join(ROOT, 'src/content/bujeok.ts'), 'utf8')
const hanja = [...content.matchAll(/hanja: '([^']+)'/g)].map((m) => m[1]).join('')
const chars = [...new Set([...hanja, ...BRUSH_FIXED])].sort().join('')
console.log(`글자 ${[...chars].length}개: ${chars}`)

const out = await subsetFont(readFileSync(SRC), chars, { targetFormat: 'woff2' })
writeFileSync(join(ROOT, 'src/fonts/LXGWWenKaiTC-Bujeok.woff2'), out)
console.log(`src/fonts/LXGWWenKaiTC-Bujeok.woff2 ${out.length} bytes`)
