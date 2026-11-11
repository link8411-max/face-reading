
const NS = 'http://www.w3.org/2000/svg'
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }

// 붓 획: 점들을 부드럽게 잇고, 눌렀다 떼는 굵기와 방향에 따른 굵기를 준 채운 도형
function brush(pts, w, o = {}) {
  const r = rng(o.seed ?? 1)
  const start = o.start ?? 0.45, end = o.end ?? 0.1
  const s = []
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2
    const n = Math.max(6, Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 1.5 | 0)
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t
      s.push([0, 1].map(d => 0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3)))
    }
  }
  s.push(pts[pts.length - 1])
  const L = [], R = [], N = s.length
  let jit = 1
  for (let i = 0; i < N; i++) {
    const a = s[Math.max(0, i - 1)], b = s[Math.min(N - 1, i + 1)]
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1
    const t = i / (N - 1)
    let f = t < 0.07 ? start + (1.15 - start) * (t / 0.07) : t > 0.82 ? 1 - (1 - end) * ((t - 0.82) / 0.18) : 1.15 - 0.2 * Math.sin(Math.PI * (t - 0.07) / 0.75)
    f *= 0.62 + 0.42 * Math.abs(dy / len)          // 가로획은 얇게, 세로획은 굵게
    jit += (r() - 0.5) * 0.08; jit = Math.min(1.08, Math.max(0.92, jit))
    const hw = w * f * jit / 2, nx = -dy / len, ny = dx / len
    L.push([s[i][0] + nx * hw, s[i][1] + ny * hw]); R.push([s[i][0] - nx * hw, s[i][1] - ny * hw])
  }
  const f2 = p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)
  const hwEnd = Math.hypot(L[N - 1][0] - R[N - 1][0], L[N - 1][1] - R[N - 1][1]) / 2
  const hwStart = Math.hypot(L[0][0] - R[0][0], L[0][1] - R[0][1]) / 2
  return 'M' + L.map(f2).join(' L') + ` A${hwEnd.toFixed(1)} ${hwEnd.toFixed(1)} 0 0 1 ` + R.slice().reverse().map(f2).join(' L') + ` A${hwStart.toFixed(1)} ${hwStart.toFixed(1)} 0 0 1 ${f2(L[0])} Z`
}
const circlePts = (cx, cy, rx, ry, a0, a1, n = 24) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)] })
const box = (x, y, s) => [[x, y], [x + s, y + 1], [x + s - 1, y + s], [x + 1, y + s - 1], [x + 1, y + 3]]

// 부문(합격): 획 목록 [점들, 굵기, 시작 눌림, 끝]
const STROKES = [
  // 비 우(雨) 갓: 넓은 가로획과 네 점
  [[[46, 104], [90, 98], [150, 97], [194, 103]], 5.5, 0.5, 0.25],
  [[[78, 110], [74, 121]], 4.5, 0.9, 0.2], [[[102, 110], [99, 121]], 4.5, 0.9, 0.2],
  [[[138, 110], [141, 121]], 4.5, 0.9, 0.2], [[[162, 110], [166, 121]], 4.5, 0.9, 0.2],
  // 별 셋(三台)
  [box(76, 130, 16), 3.2, 0.8, 0.5], [box(112, 128, 16), 3.2, 0.8, 0.5], [box(148, 130, 16), 3.2, 0.8, 0.5],
  // 우레 굽이(雷): 지그재그로 내려오는 한 획
  [[[118, 154], [152, 164], [90, 182], [152, 200], [90, 218], [150, 236], [121, 250]], 6.5, 0.55, 0.35],
  // 고리: 문창성 동그라미, 한 바퀴 돌고 겹쳐 빠짐
  [circlePts(120, 284, 26, 24, -Math.PI / 2, Math.PI * 1.62, 30), 6, 0.7, 0.15],
  // 가로 빗장 둘
  [[[80, 322], [120, 319], [162, 322]], 6, 0.6, 0.2],
  [[[88, 344], [120, 342], [154, 345]], 5.5, 0.6, 0.2],
  // 몸통: 길게 내려와 왼쪽으로 꺾어 올림
  [[[120, 254], [121, 300], [119, 360], [121, 410], [118, 438], [104, 450], [92, 440]], 8, 0.6, 0.12],
  // 귀(鬼) 갈고리 둘
  [[[96, 372], [108, 384], [112, 398]], 5, 0.8, 0.15], [[[146, 372], [134, 384], [130, 398]], 5, 0.8, 0.15],
  // 마지막 삐침 셋
  [[[132, 404], [150, 414]], 4.5, 0.8, 0.1], [[[132, 418], [152, 428]], 4.5, 0.8, 0.1], [[[132, 432], [148, 440]], 4.5, 0.8, 0.1],
]

function el(tag, attrs, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent && parent.appendChild(e); return e }

function draw(svg, kind, opt = {}) {
  const gold = kind === 'gold', id = kind
  const defs = el('defs', {}, svg)
  defs.innerHTML = `
    <filter id="ink-${id}" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="3" seed="7" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="${gold ? 2 : 3.2}" result="d"/>
      <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="3" result="g"/>
      <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -3.2 0 0 0 2.75" result="ga"/>
      <feComposite in="d" in2="ga" operator="in"/>
    </filter>
    <filter id="edge-${id}" x="-3%" y="-3%" width="106%" height="106%">
      <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="11" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="5"/>
    </filter>
    <filter id="mottle-${id}">
      <feTurbulence type="fractalNoise" baseFrequency="0.02 0.05" numOctaves="3" seed="5"/>
      <feColorMatrix type="matrix" values="0 0 0 0 ${gold ? 0.6 : 0.55}  0 0 0 0 ${gold ? 0.5 : 0.33}  0 0 0 0 ${gold ? 0.3 : 0.08}  ${gold ? '0 0 0 -1.4 0.95' : '0 0 0 -1.1 0.62'}"/>
    </filter>
    <radialGradient id="burn-${id}" cx="50%" cy="48%" r="70%">
      <stop offset="62%" stop-color="${gold ? '#000' : '#7A4A10'}" stop-opacity="0"/>
      <stop offset="100%" stop-color="${gold ? '#000' : '#7A4A10'}" stop-opacity="${gold ? 0.55 : 0.42}"/>
    </radialGradient>
    <linearGradient id="paper-${id}" x1="0" y1="0" x2="0.3" y2="1">
      ${gold ? '<stop offset="0" stop-color="#1D1913"/><stop offset="1" stop-color="#12100C"/>' : '<stop offset="0" stop-color="#EDCB6C"/><stop offset=".55" stop-color="#E5BC55"/><stop offset="1" stop-color="#D9AA42"/>'}
    </linearGradient>
    <linearGradient id="foil-${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#F7E4A2"/><stop offset=".3" stop-color="#C9963A"/><stop offset=".5" stop-color="#F3D88C"/><stop offset=".72" stop-color="#A9792B"/><stop offset="1" stop-color="#EBCB79"/>
    </linearGradient>
    <clipPath id="clip-${id}"><rect x="4" y="4" width="232" height="500" rx="5"/></clipPath>`
  const ink = gold ? `url(#foil-${id})` : '#B92B1B'

  // 종이
  const paper = el('g', { 'clip-path': `url(#clip-${id})` }, svg)
  el('rect', { x: 4, y: 4, width: 232, height: 500, rx: 5, fill: `url(#paper-${id})`, filter: `url(#edge-${id})` }, paper)
  el('rect', { x: 0, y: 0, width: 240, height: 508, filter: `url(#mottle-${id})`, style: 'mix-blend-mode:multiply' }, paper)
  const r = rng(42)
  for (let i = 0; i < (gold ? 60 : 160); i++) {
    const x = r() * 240, y = r() * 508, a = r() * Math.PI, l = 6 + r() * 22
    const cx = x + Math.cos(a) * l / 2 + (r() - 0.5) * 6, cy = y + Math.sin(a) * l / 2 + (r() - 0.5) * 6
    const light = r() < 0.35
    el('path', { d: `M${x.toFixed(1)} ${y.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${(x + Math.cos(a) * l).toFixed(1)} ${(y + Math.sin(a) * l).toFixed(1)}`, fill: 'none', stroke: gold ? (light ? '#4A3E2A' : '#000') : (light ? '#FFF2C2' : '#A87A26'), 'stroke-width': (0.3 + r() * 0.5).toFixed(2), opacity: (0.12 + r() * 0.22).toFixed(2) }, paper)
  }
  el('rect', { x: 0, y: 0, width: 240, height: 508, fill: `url(#burn-${id})` }, paper)

  // 먹(주사) 층
  const g = el('g', { filter: `url(#ink-${id})`, fill: ink, style: gold ? '' : 'mix-blend-mode:multiply', opacity: gold ? 1 : 0.93 }, svg)
  // 테두리: 손으로 그은 두 줄
  const frame = (m, w, seed) => [[[m, m + 2], [240 - m, m]], [[240 - m, m], [240 - m + 1, 508 - m]], [[240 - m + 1, 508 - m], [m, 508 - m - 1]], [[m, 508 - m - 1], [m, m + 2]]].forEach((p, i) => el('path', { d: brush(p, w, { seed: seed + i, start: 0.9, end: 0.6 }) }, g))
  frame(13, 3.2, 100); frame(19, 1.4, 200)
  STROKES.forEach(([p, w, s, e], i) => (opt.skip || []).includes(i) || el('path', { d: brush(p, w * 1.75, { seed: i + 1, start: s, end: e }) }, g))

  const BRUSH = '"Xingkai TC","Xingkai SC","STXingkai","Kaiti TC",serif'
  const txt = (s, x, y, size, extra = {}) => { const t = el('text', { x, y, 'font-size': size, 'text-anchor': 'middle', 'font-family': BRUSH, ...extra }, g); t.textContent = s; return t }
  txt('勅令', 120, 84, 54, { 'letter-spacing': '-4', 'font-weight': 700 })
  txt('日', 40, 62, 17); txt('月', 200, 62, 17)
  ;['金', '榜', '題', '名'].forEach((c, i) => txt(c, 42, 190 + i * 38, 28))
  ;['急', '急', '如', '律', '令'].forEach((c, i) => txt(c, 199, 180 + i * 31, 21))

  if (opt.noSeal) return { g, ink }
  // 도장: 吉을 하얗게 새긴 붉은 네모(백문)
  const seal = el('g', { transform: 'rotate(-4 120 474)' }, svg)
  el('rect', { x: 97, y: 451, width: 46, height: 46, rx: 3, fill: gold ? `url(#foil-${id})` : '#B3231A', filter: `url(#ink-${id})`, opacity: gold ? 1 : 0.88 }, seal)
  el('rect', { x: 101, y: 455, width: 38, height: 38, fill: 'none', stroke: gold ? '#17140F' : '#E8C463', 'stroke-width': 1.2, opacity: 0.8, filter: `url(#edge-${id})` }, seal)
  const s = el('text', { x: 120, y: 488, 'font-size': 34, 'text-anchor': 'middle', 'font-family': '"Weibei TC","Weibei SC","Kaiti TC",serif', 'font-weight': 700, fill: gold ? '#17140F' : '#EBC867', filter: `url(#edge-${id})` }, seal)
  s.textContent = '吉'
  return { g, ink }
}
