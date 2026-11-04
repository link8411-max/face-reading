// 반짝이 추적: node track.mjs in.mp4 x y [size] → 프레임별 중심 좌표 JSON
import {spawnSync} from 'node:child_process'; import os from 'node:os';
const FF = os.homedir() + '/.cache/shorts-tools/node_modules/ffmpeg-static/ffmpeg';
const [f, x0, y0, sz = 36] = process.argv.slice(2); const W = 720, H = 1280, S = +sz, h = S >> 1;
const raw = spawnSync(FF, ['-loglevel', 'error', '-i', f, '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], {maxBuffer: 1 << 30}).stdout;
const N = raw.length / (W * H); const px = (k, x, y) => raw[k * W * H + y * W + x];
// 별 모양 가중: 중심에서 가까운 + 자 모양 위주(배경 영향 줄이기)
const tpl = (k, cx, cy) => { const a = []; for (let dy = -h; dy < h; dy++) for (let dx = -h; dx < h; dx++) a.push(px(k, cx + dx, cy + dy)); return a; };
let T = tpl(0, +x0, +y0); let cx = +x0, cy = +y0; const out = [];
for (let k = 0; k < N; k++) {
  let best = 1e18, bx = cx, by = cy;
  for (let sy = -10; sy <= 10; sy++) for (let sx = -10; sx <= 10; sx++) {
    const X = cx + sx, Y = cy + sy; let s = 0, i = 0, m1 = 0, m2 = 0;
    // 밝기 평균 차를 빼고 비교(배경 밝기 변화 무시)
    for (let dy = -h; dy < h; dy++) for (let dx = -h; dx < h; dx++) { m1 += px(k, X + dx, Y + dy); m2 += T[i++]; }
    const d = (m1 - m2) / (S * S); i = 0;
    for (let dy = -h; dy < h; dy++) for (let dx = -h; dx < h; dx++) s += Math.abs(px(k, X + dx, Y + dy) - T[i++] - d);
    if (s < best) { best = s; bx = X; by = Y; }
  }
  cx = bx; cy = by; out.push([k, cx, cy, Math.round(best / (S * S))]);
}
console.log(JSON.stringify(out));
