// 부적 예시 그림과 미리보기 이미지 만들기(한 번 돌려 결과를 커밋한다, 빌드 때는 돌지 않음): npx tsx scripts/bujeok-examples.ts
// 방식: 실제 BujeokSvg(전통·crop·기본 획·도장 있음·이름 없음·variant 0)를 renderToStaticMarkup으로 뽑아
//   붓 글꼴(LXGWWenKaiTC-Bujeok)·Gowun Batang을 @font-face로 붙인 HTML에 넣고 Playwright(chromium)로 찍는다.
//   앱을 띄우지 않으므로 새 코드 경로 없이 화면과 같은 그림이 나온다. (tsx가 '@/' 경로를 tsconfig로 푼다)
// 결과: public/bujeok/examples/<slug>-bujeok-<paper|gold>.webp (480×1016 = 카드 영역 240×508의 2배, 투명 바탕, 품질 82, sharp로 변환)
//       public/bujeok/og-bujeok.png (1200×630, 팔레트 PNG로 줄임)
// holo는 정지 그림이 금박과 거의 같아 뽑지 않는다.
import { mkdirSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { chromium } from '@playwright/test'
import sharp from 'sharp'
import BujeokSvg from '../src/components/bujeok/BujeokSvg'
import { WISHES, WISH_DEFAULT_EL, type Finish, type Wish } from '../src/lib/bujeok/keys'
import { EXAMPLE_H, EXAMPLE_W, WISH_SLUG } from '../src/content/bujeok'

const ROOT = join(__dirname, '..')
const OUT = join(ROOT, 'public', 'bujeok')
const FONTS = join(ROOT, 'src', 'fonts')
const FINISH_SET = ['paper', 'gold'] as const

const svg = (wish: Wish, finish: Finish) =>
  renderToStaticMarkup(createElement(BujeokSvg, { spec: { style: 'trad', wish, el: WISH_DEFAULT_EL[wish], variant: 0, finish }, name: null, crop: true }))

const css = `
@font-face { font-family: 'BujeokBrush'; src: url('file://${FONTS}/LXGWWenKaiTC-Bujeok.woff2'); font-weight: 500; }
@font-face { font-family: 'GowunBatang'; src: url('file://${FONTS}/GowunBatang-Regular.woff2'); font-weight: 400; }
@font-face { font-family: 'GowunBatang'; src: url('file://${FONTS}/GowunBatang-Bold.woff2'); font-weight: 700; }
:root { --font-bujeok-brush: 'BujeokBrush'; --font-gowun-batang: 'GowunBatang'; --font-noto-sans-kr: 'GowunBatang'; }
html, body { margin: 0; background: transparent; }
`

async function main() {
  const dir = mkdtempSync(join(tmpdir(), 'bujeok-ex-'))
  mkdirSync(join(OUT, 'examples'), { recursive: true })
  const browser = await chromium.launch()
  try {
    // 1) 예시 그림
    const ctx = await browser.newContext({ viewport: { width: 240, height: 508 }, deviceScaleFactor: 2 })
    const page = await ctx.newPage()
    let total = 0
    for (const wish of WISHES) {
      for (const finish of FINISH_SET) {
        const file = join(dir, `${wish}-${finish}.html`)
        writeFileSync(file, `<!doctype html><meta charset="utf-8"><style>${css} svg { display:block; width:240px; height:508px; }</style>${svg(wish, finish)}`)
        await page.goto(`file://${file}`)
        await page.evaluate(() => document.fonts.ready)
        const png = await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: 240, height: 508 } })
        const webp = await sharp(png).resize(EXAMPLE_W, EXAMPLE_H).webp({ quality: 82 }).toBuffer()
        const name = `${WISH_SLUG[wish]}-bujeok-${finish}.webp`
        writeFileSync(join(OUT, 'examples', name), webp)
        total += webp.length
        console.log(name, webp.length)
      }
    }
    console.log('예시 합계', total, 'bytes')

    // 2) 미리보기 이미지 1200×630: 먹빛 바탕, 금박 셋(가운데 합격 크게, 좌우 재물·만사형통 작게 기울여), 왼쪽에 글
    const og = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
    const ogPage = await og.newPage()
    const card = (wish: Wish, h: number, left: number, top: number, rot: number) =>
      `<div style="position:absolute;left:${left}px;top:${top}px;width:${(h * 240) / 508}px;height:${h}px;transform:rotate(${rot}deg);filter:drop-shadow(0 18px 26px rgba(0,0,0,.6))">${svg(wish, 'gold').replace('<svg ', `<svg style="width:100%;height:100%;display:block" `)}</div>`
    const html = `<!doctype html><meta charset="utf-8"><style>${css}
      body { width:1200px; height:630px; position:relative; overflow:hidden; background: radial-gradient(120% 90% at 70% 40%, #2A2219 0%, #15110D 55%, #0E0B09 100%), #0E0B09; font-family: 'GowunBatang', serif; }
      .glow { position:absolute; left:560px; top:70px; width:600px; height:500px; border-radius:50%; filter:blur(50px); background:radial-gradient(#E9C46A44, transparent 70%); }
      h1 { position:absolute; left:64px; top:214px; margin:0; font-size:88px; line-height:1.1; font-weight:700; color:#F3D88C; letter-spacing:.02em; }
      p { position:absolute; left:68px; top:350px; margin:0; font-size:32px; line-height:1.5; color:#D9C9A8; }
      .line { position:absolute; left:68px; top:332px; width:96px; height:3px; background:#E9C46A; }
    </style><div class="glow"></div>
      ${card('money', 408, 596, 150, -7)}${card('allgood', 408, 976 - 34, 150, 7)}${card('pass', 560, 760, 36, 0)}
      <h1>나만의 부적</h1><div class="line"></div><p>마지막 한 획을 직접 그어<br>완성해요</p>`
    const f = join(dir, 'og.html')
    writeFileSync(f, html)
    await ogPage.goto(`file://${f}`)
    await ogPage.evaluate(() => document.fonts.ready)
    const ogPng = await ogPage.screenshot({ clip: { x: 0, y: 0, width: 1200, height: 630 } })
    const ogOut = await sharp(ogPng).png({ palette: true, quality: 90, compressionLevel: 9 }).toBuffer()
    writeFileSync(join(OUT, 'og-bujeok.png'), ogOut)
    console.log('og-bujeok.png', ogOut.length)
  } finally {
    await browser.close()
    rmSync(dir, { recursive: true, force: true })
  }
}
main().catch((e) => { console.error(e); process.exit(1) })
