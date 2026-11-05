// 삼국지 지도 밑그림: Natural Earth(50m) 땅·강·호수를 중국 영역으로 잘라 SVG 경로 JSON으로 만든다.
// 지도 모양은 AI에게 맡기지 않는다(DIRECTION.md 지도 규칙). Remotion MapScene이 이 JSON을 그린다.
//   node scripts/shorts/map/build-map.mjs <natural-earth geojson 폴더> scripts/shorts/remotion/public/maps/china.json
import fs from 'node:fs';
import path from 'node:path';

const [src, out] = process.argv.slice(2);
const BBOX = {w: 88, e: 132, s: 12, n: 50};
const LAT0 = 31, K = 100; // 경도 1도 = K*cos(LAT0) 단위
const cx = Math.cos((LAT0 * Math.PI) / 180);
export const project = ([lon, lat]) => [+((lon - BBOX.w) * K * cx).toFixed(1), +((BBOX.n - lat) * K).toFixed(1)];

// 다각형을 사각형으로 자르기(Sutherland–Hodgman)
function clip(ring) {
  const edges = [
    (p) => p[0] >= BBOX.w, (p) => p[0] <= BBOX.e, (p) => p[1] >= BBOX.s, (p) => p[1] <= BBOX.n,
  ];
  const cut = [
    (a, b) => [BBOX.w, a[1] + ((b[1] - a[1]) * (BBOX.w - a[0])) / (b[0] - a[0])],
    (a, b) => [BBOX.e, a[1] + ((b[1] - a[1]) * (BBOX.e - a[0])) / (b[0] - a[0])],
    (a, b) => [a[0] + ((b[0] - a[0]) * (BBOX.s - a[1])) / (b[1] - a[1]), BBOX.s],
    (a, b) => [a[0] + ((b[0] - a[0]) * (BBOX.n - a[1])) / (b[1] - a[1]), BBOX.n],
  ];
  let pts = ring;
  edges.forEach((inside, k) => {
    const res = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      if (inside(b)) { if (!inside(a)) res.push(cut[k](a, b)); res.push(b); }
      else if (inside(a)) res.push(cut[k](a, b));
    }
    pts = res;
  });
  return pts;
}
const inBox = ([lon, lat]) => lon >= BBOX.w - 1 && lon <= BBOX.e + 1 && lat >= BBOX.s - 1 && lat <= BBOX.n + 1;
const d = (pts, close) => pts.length < 2 ? '' : 'M' + pts.map(project).map((p) => p.join(',')).join('L') + (close ? 'Z' : '');
const read = (f) => JSON.parse(fs.readFileSync(path.join(src, f), 'utf8')).features;
const polys = (g) => (g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []);
const lines = (g) => (g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : []);

const land = read('ne_50m_land.geojson').flatMap((f) => polys(f.geometry)).map((p) => d(clip(p[0]), true)).filter((x) => x.length > 20);
const lakes = read('ne_50m_lakes.geojson').flatMap((f) => polys(f.geometry)).filter((p) => p[0].some(inBox)).map((p) => d(clip(p[0]), true)).filter((x) => x.length > 20);
const rivers = read('ne_50m_rivers_lake_centerlines.geojson')
  .map((f) => ({name: f.properties.name_en || f.properties.name || '', rank: f.properties.scalerank ?? 9, ls: lines(f.geometry)}))
  .flatMap((r) => r.ls.filter((l) => l.some(inBox)).map((l) => ({name: r.name, rank: r.rank, d: d(l.filter(inBox), false)})))
  .filter((r) => r.d.length > 10);
const [W, H] = project([BBOX.e, BBOX.s]);
fs.mkdirSync(path.dirname(out), {recursive: true});
fs.writeFileSync(out, JSON.stringify({bbox: BBOX, lat0: LAT0, k: K, width: W, height: H, land, lakes, rivers}));
console.log('땅', land.length, '호수', lakes.length, '강', rivers.length, '크기', W, H, '→', out);
console.log('강 이름:', [...new Set(rivers.map((r) => r.name))].join(', '));
