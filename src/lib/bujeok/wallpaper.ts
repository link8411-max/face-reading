// 잠금화면 이미지(1170×2532). 부적을 위쪽 시계 자리 아래에 놓고 맨 아래에 워터마크를 넣는다.
// 글꼴(사이트 글꼴 변수·한자 대체 글꼴)이 저장 이미지에서도 그대로 나오도록 SVG를 캔버스에 직접 그리지 않고,
// 화면 밖에 같은 비율의 DOM을 세워 기존 캡처 경로(modern-screenshot)로 찍는다.
import { CARD_BOX, PAL } from './palette'
import type { BujeokStyle, Finish } from './keys'

export const WALLPAPER = { w: 1170, h: 2532 } as const

/** DOM은 CSS 390×844로 세우고 3배로 찍는다 */
const SCALE = 3

/** 부적 자리(이미지 픽셀). 위 3분의 1은 시계·알림 자리라 비운다. 그림 비율 300:520 */
export function wallpaperLayout(): { x: number; y: number; w: number; h: number } {
  const w = 840
  const h = Math.round((w * 520) / 300)
  return { x: (WALLPAPER.w - w) / 2, y: 900, w, h }
}

const BG: Record<BujeokStyle, { bg: string; mark: string }> = {
  trad: { bg: 'linear-gradient(180deg,#1c1512 0%,#2b2019 100%)', mark: '#d8cbb8' },
  cute: { bg: 'linear-gradient(180deg,#FFF1E6 0%,#FFE3EA 100%)', mark: PAL.cuteInk },
}
/** 금박·홀로그램: 붉은 기운 없는 어두운 중성색 바탕 (설계 13절) */
const BG_FOIL = { bg: 'linear-gradient(180deg,#1a1613 0%,#0f0b0a 100%)', mark: '#d8cbb8' }
const bgFor = (style: BujeokStyle, finish: Finish) => (finish === 'paper' ? BG[style] : BG_FOIL)

/** 홀로그램은 무지갯빛이 고정된 한 장: 카드 모양대로 겹치는 무지개 층 (블렌드 모드 없이 알파로만 — 기기마다 같게 나오도록) */
const HOLO_FIXED = 'repeating-linear-gradient(115deg,#ff5f6d 0%,#ffc371 12%,#f9f871 24%,#7bffb1 36%,#6ad7ff 48%,#b28dff 60%,#ff5f6d 72%)'

export const WATERMARK = '운명을 읽다 · unse-ai.com'

function buildStage(svg: SVGSVGElement, style: BujeokStyle, finish: Finish): { host: HTMLElement; stage: HTMLElement } {
  const L = wallpaperLayout()
  const px = (n: number) => `${n / SCALE}px`
  const host = document.createElement('div')
  host.setAttribute('aria-hidden', 'true')
  // 캡처 대상(stage)이 위치를 직접 갖지 않도록 한 겹 감싸 화면 밖으로 보낸다
  host.style.cssText = 'position:fixed;left:-10000px;top:0;pointer-events:none;'
  const stage = document.createElement('div')
  stage.style.cssText = `position:relative;width:${px(WALLPAPER.w)};height:${px(WALLPAPER.h)};overflow:hidden;background:${bgFor(style, finish).bg};`
  const clone = svg.cloneNode(true) as SVGSVGElement
  // 화면에서 흔들리는 중이던 동작이 캡처에 섞이지 않게 한다
  clone.querySelectorAll('.bujeok-bob,.bujeok-tw').forEach((el) => el.classList.remove('bujeok-bob', 'bujeok-tw'))
  clone.removeAttribute('class')
  // 화면의 카드는 종이 영역만 잘라 보여 주므로, 저장 이미지는 언제나 전체 그림 틀(300:520)로 되돌린다
  clone.setAttribute('viewBox', '0 0 300 520')
  clone.setAttribute('width', String(L.w / SCALE))
  clone.setAttribute('height', String(L.h / SCALE))
  clone.style.cssText = `position:absolute;left:${px(L.x)};top:${px(L.y)};width:${px(L.w)};height:${px(L.h)};display:block;`
  const mark = document.createElement('div')
  mark.textContent = WATERMARK
  mark.style.cssText = `position:absolute;left:0;right:0;top:${px(WALLPAPER.h - 150)};text-align:center;font-family:var(--font-noto-sans-kr),sans-serif;font-size:${px(34)};letter-spacing:.04em;color:${bgFor(style, finish).mark};opacity:.8;`
  stage.append(clone)
  if (finish === 'holo') {
    const b = CARD_BOX[style]
    const k = L.w / 300
    const holo = document.createElement('div')
    const radius = style === 'trad' ? '0' : px(34 * k) // 그림 속 종이의 모서리(귀여운 rx 34)와 같게
    holo.style.cssText = `position:absolute;left:${px(L.x + b.x * k)};top:${px(L.y + b.y * k)};width:${px(b.w * k)};height:${px(b.h * k)};border-radius:${radius};background:${HOLO_FIXED};background-size:260% 260%;background-position:50% 50%;opacity:.3;`
    stage.append(holo)
  }
  stage.append(mark)
  host.appendChild(stage)
  return { host, stage }
}

async function ensureSize(blob: Blob): Promise<Blob> {
  const bmp = await createImageBitmap(blob)
  const ok = bmp.width === WALLPAPER.w && bmp.height === WALLPAPER.h
  if (ok) {
    bmp.close()
    return blob
  }
  const c = document.createElement('canvas')
  c.width = WALLPAPER.w
  c.height = WALLPAPER.h
  c.getContext('2d')!.drawImage(bmp, 0, 0, WALLPAPER.w, WALLPAPER.h)
  bmp.close()
  return await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('이미지를 만들지 못했어요'))), 'image/png'))
}

/** 화면에 있는 부적 SVG를 잠금화면 PNG로 만든다. 이름·생년월일은 SVG에 있는 것(도장 이름)만 담긴다 */
export async function renderWallpaper(svg: SVGSVGElement, style: BujeokStyle, finish: Finish = 'paper'): Promise<Blob> {
  const { domToBlob } = await import('modern-screenshot')
  const { host, stage } = buildStage(svg, style, finish)
  document.body.appendChild(host)
  try {
    await document.fonts?.ready
    const blob = await domToBlob(stage, { scale: SCALE, width: WALLPAPER.w / SCALE, height: WALLPAPER.h / SCALE, type: 'image/png' })
    return await ensureSize(blob)
  } finally {
    host.remove()
  }
}
