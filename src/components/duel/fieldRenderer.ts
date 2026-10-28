// 일기토 벌판 그리기(React 없음): 호출자가 준 context의 region 안에 그린다.
// 좌표는 296×70 설계 기준이고 region.w/h에 맞춰 늘리며, 모든 사각형은 Math.round로 화면 픽셀에 맞춘다.
// 다음 화면(320×240 전체 캔버스)은 createFieldScene().render(...)를 매 프레임 부르면 된다.
import { getDuelGeneral } from '@/lib/duel/generals';
import { SKILLS } from '@/lib/duel/skills';
import {
  passPose,
  koPose,
  cutinAlpha,
  otherSide,
  otherWho,
  timelineLength,
  PASS_MS,
  LEFT_X,
  RIGHT_X,
  type Pose,
  type Side,
  type TimelineItem,
  type Who,
} from './animations';

export interface Region {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 설계 크기 */
export const FIELD_W = 296;
export const FIELD_H = 70;
export const DEFAULT_REGION: Region = { x: 0, y: 0, w: FIELD_W, h: FIELD_H };

/** 스프라이트 키(128px 원본을 줄여 그림) */
const SPR = 34;
/** 스프라이트 윗변 y (아랫변 67) */
const SPR_TOP = 33;
/** 양 끝 스프라이트 중심: 0.02 → 22(5~39), 0.98 → 274(257~291) */
const CX_LEFT = 22;
const CX_RIGHT = FIELD_W - 22;
/** 가운데에서 맞닿을 때 비켜 서는 거리 */
const MEET_GAP = 11;
const CLASH_Y = 50;
const DUST_Y = 66;
/** 피해 숫자가 떠 있는 시간 */
export const NUMBER_MS = 600;
const FONT_PX = 9;
const SPRITE_DIR = '/images/samguk/sprites/';
const FALLBACK_COLOR: Record<Who, string> = { player: '#3b6fd8', enemy: '#c8483c' };
const GOLD = '#E8B547';
const INK = '#23263A';
const SHAKE = [2, -2, 1, -1, 2, -1, 0];
const SHAKE_MS = 200;

type Ctx = CanvasRenderingContext2D;
type Drawable = CanvasImageSource & { width: number; height: number };

const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);

// ── 설계 좌표 → 화면 픽셀 ──

interface Pen {
  sx: number;
  sy: number;
  X: (x: number) => number;
  Y: (y: number) => number;
  rect: (col: string, x: number, y: number, w?: number, h?: number) => void;
}

function pen(ctx: Ctx, r: Region): Pen {
  const sx = r.w / FIELD_W;
  const sy = r.h / FIELD_H;
  const X = (x: number) => Math.round(r.x + x * sx);
  const Y = (y: number) => Math.round(r.y + y * sy);
  return {
    sx,
    sy,
    X,
    Y,
    rect: (col, x, y, w = 1, h = 1) => {
      const x0 = X(x);
      const y0 = Y(y);
      ctx.fillStyle = col;
      ctx.fillRect(x0, y0, Math.max(1, X(x + w) - x0), Math.max(1, Y(y + h) - y0));
    },
  };
}

/** 도트 글씨: 1px 어두운 그림자 + 본색 (설계 좌표) */
function pixelText(ctx: Ctx, p: Pen, text: string, x: number, y: number, col = '#ffffff') {
  ctx.font = `bold ${Math.max(6, Math.round(FONT_PX * p.sy))}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const s = Math.max(1, Math.round(p.sy));
  ctx.fillStyle = INK;
  ctx.fillText(text, p.X(x) + s, p.Y(y) + s);
  ctx.fillStyle = col;
  ctx.fillText(text, p.X(x), p.Y(y));
}

// ── 정적 벌판 ──

// 참고 그림(320×96)의 돌·풀 자리를 296×70으로 옮긴 값
const ROCKS = [
  [20, 70], [48, 84], [75, 62], [110, 78], [140, 90], [172, 66],
  [205, 86], [238, 72], [268, 60], [296, 82], [160, 58], [90, 92],
].map(([x, y]) => [Math.round(x * 0.925), Math.round(36 + (y - 50) * 0.74)]);
const GRASS = [
  [36, 58], [128, 64], [220, 60], [300, 66], [60, 88], [250, 92],
].map(([x, y]) => [Math.round(x * 0.925), Math.round(36 + (y - 50) * 0.74)]);

/** 하늘 4단(체커 디더)·구름·산맥 둘·숲 띠·황토 벌판(가로줄+디더)·돌·풀 포기 */
function paintField(ctx: Ctx, r: Region) {
  const p = pen(ctx, r);
  const W = FIELD_W;
  const sky = ['#8fb6e0', '#a3c3e6', '#b7d0ea', '#cbdcef'];
  for (let y = 0; y < 30; y++) {
    const b = Math.min(3, (y / 7.5) | 0);
    p.rect(sky[b], 0, y, W, 1);
    if (y % 7 >= 5 && b < 3) for (let i = y % 2; i < W; i += 2) p.rect(sky[b + 1], i, y);
  }
  for (const [cx, cy, cw] of [
    [28, 6, 13],
    [48, 9, 7],
    [166, 4, 16],
    [231, 7, 9],
  ]) {
    p.rect('#e9f1f8', cx, cy, cw, 2);
    p.rect('#e9f1f8', cx + 3, cy - 2, cw - 6, 2);
  }
  const ridge = (col: string, base: number, amp: number, seed: number, step: number) => {
    for (let x = 0; x < W; x++) {
      const h = amp * (0.55 + 0.45 * Math.sin(x / step + seed) + 0.25 * Math.sin(x / (step * 0.37) + seed * 2));
      p.rect(col, x, (base - h) | 0, 1, (h | 0) + 1);
    }
  };
  ridge('#6f8c93', 34, 10, 1.3, 26);
  ridge('#55727a', 35, 7, 4.1, 16);
  for (let y = 32; y < 36; y++) for (let i = y % 2; i < W; i += 2) p.rect(y < 34 ? '#4f6b43' : '#5d7a4b', i, y);
  p.rect('#5d7a4b', 0, 34, W, 2);
  const g = ['#c7ad70', '#bfa365', '#b3985b', '#a98e52'];
  for (let y = 36; y < FIELD_H; y++) {
    const b = Math.min(3, ((y - 36) / 9) | 0);
    p.rect(g[b], 0, y, W, 1);
    if (y % 3 === 0) for (let i = y % 2; i < W; i += 2) p.rect(g[Math.min(3, b + 1)], i, y);
  }
  for (const [rx, ry] of ROCKS) {
    p.rect('#8b7445', rx, ry, 5, 2);
    p.rect('#a48a52', rx + 1, ry - 1, 3, 1);
    p.rect('#6d5a35', rx, ry + 2, 5, 1);
  }
  for (const [gx, gy] of GRASS) {
    p.rect('#6f8a45', gx, gy, 1, 2);
    p.rect('#6f8a45', gx + 2, gy - 1, 1, 3);
    p.rect('#6f8a45', gx + 4, gy, 1, 2);
  }
}

// region 크기별로 한 번만 그려 두고 매 프레임 붙인다
const fieldCache = new Map<string, HTMLCanvasElement>();

/** 정적 벌판. 브라우저에서는 region 크기별 오프스크린에 미리 그려 두고 붙인다 */
export function drawField(ctx: Ctx, region: Region = DEFAULT_REGION): void {
  const key = `${region.w}x${region.h}`;
  let off = fieldCache.get(key);
  if (!off && typeof document !== 'undefined') {
    try {
      const c = document.createElement('canvas');
      c.width = Math.round(region.w);
      c.height = Math.round(region.h);
      const cx = c.getContext('2d');
      if (cx) {
        cx.imageSmoothingEnabled = false;
        paintField(cx, { x: 0, y: 0, w: region.w, h: region.h });
        off = c;
        fieldCache.set(key, c);
      }
    } catch {
      off = undefined;
    }
  }
  if (off) ctx.drawImage(off, Math.round(region.x), Math.round(region.y));
  else paintField(ctx, region);
}

// ── 장면 계산(순수) ──

export interface FighterDraw {
  pose: Pose;
  /** 0~1 흰 번쩍임 */
  flash: number;
  /** 지금 달리는 중(먼지) */
  moving: boolean;
  visible: boolean;
}

export interface Scene {
  fighters: Record<Who, FighterDraw>;
  /** 지금 합이 시작될 때의 자리(컷인 초상 쪽을 정한다) */
  sidesBefore: { player: Side };
}

const sideX = (s: Side) => (s === 'left' ? LEFT_X : RIGHT_X);
export const sideOf = (who: Who, sides: { player: Side }): Side => (who === 'player' ? sides.player : otherSide(sides.player));

/** 대기 포즈: 자기 자리에서 상대(가운데) 쪽을 본다 */
function idlePose(who: Who, sides: { player: Side }): Pose {
  const s = sideOf(who, sides);
  return { x: sideX(s), dy: 0, alpha: 1, flash: 0, scale: 1, facing: s === 'left' ? 1 : -1 };
}

export function sceneAt(tl: TimelineItem[], e: number, initial: { player: Side }, alive: Record<Who, boolean>): Scene {
  let sides = initial;
  let active: TimelineItem | null = null;
  for (const it of tl) {
    if (it.kind !== 'pass' || e < it.at) continue;
    if (e >= it.at + it.dur) sides = it.sidesAfter;
    else active = it;
  }
  const fighters = {} as Record<Who, FighterDraw>;
  for (const who of ['player', 'enemy'] as Who[]) {
    let pose = idlePose(who, sides);
    let moving = false;
    if (active) {
      // 필살기 합은 가운데(0.5)에서 hold만큼 멈춘다
      const local = e - active.at;
      const hold = active.hold ?? 0;
      const mid = PASS_MS / 2;
      const t = local < mid ? local / PASS_MS : local < mid + hold ? 0.5 : (local - hold) / PASS_MS;
      pose = passPose(t, sideOf(who, sides));
      moving = t < 0.45 || (t > 0.55 && t < 1);
    }
    fighters[who] = { pose, flash: 0, moving, visible: alive[who] };
  }
  for (const it of tl) {
    if (e < it.at || !it.who) continue;
    const p = clamp01((e - it.at) / it.dur);
    if (it.kind === 'ko') {
      const f = fighters[it.who];
      const k = koPose(p);
      f.pose = { ...f.pose, dy: f.pose.dy + k.dy, alpha: k.alpha, scale: k.scale };
      f.visible = true;
    } else if ((it.kind === 'clash' || it.kind === 'strike') && p < 1) {
      // 맞은 쪽이 하얗게 번쩍인다
      const d = fighters[otherWho(it.who)];
      d.flash = Math.max(d.flash, 1 - p);
    }
  }
  return { fighters, sidesBefore: sides };
}

/** 이번 프레임의 흔들림(±2px, 설계 좌표 기준). 충돌·베기 직후 200ms */
export function shakeAt(tl: TimelineItem[], e: number): { dx: number; dy: number } {
  let dx = 0;
  let dy = 0;
  for (const it of tl) {
    if ((it.kind === 'clash' || it.kind === 'strike') && e >= it.at && e < it.at + SHAKE_MS) {
      const k = ((e - it.at) / 30) | 0;
      dx = SHAKE[k % SHAKE.length];
      dy = SHAKE[(k + 3) % SHAKE.length] >> 1;
    }
  }
  return { dx, dy };
}

/** 타임라인이 끝나는 시각(피해 숫자가 사라질 때까지) */
export function sceneLength(tl: TimelineItem[]): number {
  return Math.max(timelineLength(tl), ...tl.filter((it) => it.amount !== undefined).map((it) => it.at + NUMBER_MS));
}

// ── 프레임 상태(그리기 함수 입력) ──

export interface SpriteImages {
  img: Drawable | null;
  /** 흰 번쩍임용 실루엣 */
  white: Drawable | null;
}

export interface FrameState {
  scene: Scene;
  timeline: TimelineItem[];
  elapsed: number;
  /** 대기 들썩임 박자: -1 멈춤, 0/1 번갈아(재생 중에는 무시) */
  bob: number;
  idle: boolean;
  sprites: Record<Who, SpriteImages | undefined>;
  portraits: Record<Who, Drawable | null | undefined>;
}

/** 정규화 x → 설계 x(스프라이트 중심). 가운데에서는 둘이 맞닿게 살짝 비킨다 */
function drawX(pose: Pose) {
  const near = clamp01(1 - Math.abs(pose.x - 0.5) / 0.08);
  return Math.round(CX_LEFT + ((pose.x - LEFT_X) / (RIGHT_X - LEFT_X)) * (CX_RIGHT - CX_LEFT) - pose.facing * MEET_GAP * near);
}

/** 두 장수(34px, 바라보는 방향·alpha·scale·dy)와 말발굽 먼지 */
export function drawFighters(ctx: Ctx, region: Region, state: FrameState): void {
  const p = pen(ctx, region);
  const frame = (state.elapsed / 60) | 0;
  for (const who of ['player', 'enemy'] as Who[]) {
    const f = state.scene.fighters[who];
    if (!f.visible || !f.moving) continue;
    const cx = drawX(f.pose);
    for (let i = 0; i < 6; i++) {
      if ((i + frame) % 3 === 0) continue;
      const dx = cx - f.pose.facing * (11 + i * 3);
      p.rect((i + frame) % 2 ? '#e3d4a6' : '#d2c08d', dx, DUST_Y + ((i + frame) % 3) - 1, 2, 1);
    }
  }
  for (const who of ['player', 'enemy'] as Who[]) {
    const f = state.scene.fighters[who];
    if (!f.visible || f.pose.alpha <= 0) continue;
    // 대기 중에는 둘이 엇갈려 2px 들썩인다
    const up = state.idle && state.bob === (who === 'player' ? 1 : 0);
    const size = SPR * f.pose.scale;
    const top = SPR_TOP + (SPR - size) + Math.round(f.pose.dy) + (up ? -2 : 0);
    const cx = drawX(f.pose);
    // 화면 픽셀로 맞춘 사각형
    const x0 = p.X(cx - size / 2);
    const y0 = p.Y(top);
    const w = p.X(cx + size / 2) - x0;
    const h = p.Y(top + size) - y0;
    const sp = state.sprites[who];
    ctx.save();
    ctx.globalAlpha = f.pose.alpha;
    if (sp?.img) {
      ctx.translate(x0 + (f.pose.facing < 0 ? w : 0), y0);
      if (f.pose.facing < 0) ctx.scale(-1, 1);
      ctx.drawImage(sp.img, 0, 0, sp.img.width, sp.img.height, 0, 0, w, h);
      if (f.flash > 0 && sp.white) {
        ctx.globalAlpha = f.pose.alpha * f.flash * 0.8;
        ctx.drawImage(sp.white, 0, 0, sp.white.width, sp.white.height, 0, 0, w, h);
      }
    } else {
      // 그림이 없으면 색 사각형
      ctx.fillStyle = f.flash > 0.5 ? '#ffffff' : FALLBACK_COLOR[who];
      const inset = Math.round(w / 6);
      ctx.fillRect(x0 + inset, y0 + Math.round(h / 9), w - inset * 2, h - Math.round(h / 9));
    }
    ctx.restore();
  }
}

/** 충돌 불꽃·베기·흰 번쩍임·피해 숫자·컷인(어둡게 + 초상 + 기술 이름) */
export function drawEffects(ctx: Ctx, region: Region, state: FrameState): void {
  const p = pen(ctx, region);
  const { timeline: tl, elapsed: now, scene } = state;
  const fillRegion = (col: string) => {
    ctx.fillStyle = col;
    ctx.fillRect(Math.round(region.x), Math.round(region.y), Math.round(region.w), Math.round(region.h));
  };
  let flash = 0;
  for (const it of tl) {
    if (now < it.at || now >= it.at + it.dur || !it.who) continue;
    const t = (now - it.at) / it.dur;
    const k = Math.min(2, (t * 3) | 0);
    if (it.kind === 'clash') {
      const cx = FIELD_W / 2;
      ['#ffffff', '#ffe08a', '#ff9a3c'].forEach((col, j) => {
        if (j > k) return;
        const r = 1 + j + k;
        p.rect(col, cx - r, CLASH_Y, 2 * r + 1, 1);
        p.rect(col, cx, CLASH_Y - r, 1, 2 * r + 1);
        p.rect(col, cx - r - 1, CLASH_Y - r - 1);
        p.rect(col, cx + r + 1, CLASH_Y - r - 1);
        p.rect(col, cx - r - 1, CLASH_Y + r + 1);
        p.rect(col, cx + r + 1, CLASH_Y + r + 1);
      });
      if (t < 0.35) flash = Math.max(flash, 0.6 * (1 - t / 0.35));
    } else if (it.kind === 'strike') {
      // 세 프레임에 걸쳐 그려지는 흰 호 한 줄기
      const def = scene.fighters[otherWho(it.who)];
      const cx = drawX(def.pose);
      const cy = SPR_TOP + 15;
      const r = 13 + k * 2;
      const a0 = -Math.PI * 0.8;
      const span = Math.PI * 1.1 * ((k + 1) / 3);
      for (let a = a0; a <= a0 + span; a += 0.08) {
        const ax = Math.round(cx + Math.cos(a) * r);
        const ay = Math.round(cy + Math.sin(a) * r);
        p.rect('#ffffff', ax, ay, 2, 1);
        p.rect('#ffe08a', ax, ay + 1, 1, 1);
      }
      if (k === 0) flash = Math.max(flash, 0.5);
    }
  }

  // 피해 숫자: 맞은 쪽 위에서 올라가며 사라진다
  for (const it of tl) {
    if (it.amount === undefined || !it.who) continue;
    if (it.kind !== 'clash' && it.kind !== 'strike' && it.kind !== 'text') continue;
    if (now < it.at || now >= it.at + NUMBER_MS) continue;
    const t = (now - it.at) / NUMBER_MS;
    const target = it.kind === 'text' ? it.who : otherWho(it.who);
    const heal = it.kind === 'text' && (it.text ?? '').includes('회복');
    ctx.globalAlpha = t > 0.7 ? (1 - t) / 0.3 : 1;
    pixelText(ctx, p, `${heal ? '+' : '-'}${it.amount}`, drawX(scene.fighters[target].pose), SPR_TOP - 2 - Math.round(t * 10), heal ? '#8fe08a' : '#ffffff');
    ctx.globalAlpha = 1;
  }

  // 컷인
  for (const it of tl) {
    if (it.kind !== 'cutin' || !it.who || now < it.at || now >= it.at + it.dur) continue;
    const t = (now - it.at) / it.dur;
    const a = cutinAlpha(t);
    ctx.globalAlpha = 1;
    fillRegion(`rgba(0,0,0,${(0.65 * a).toFixed(3)})`);
    const side = sideOf(it.who, scene.sidesBefore);
    const portrait = state.portraits[it.who];
    const ph = 46;
    let pw = 0;
    const slide = Math.round((1 - clamp01(t / 0.15)) * 28);
    ctx.globalAlpha = a;
    if (portrait) {
      pw = Math.round((ph * portrait.width) / Math.max(1, portrait.height));
      const x0 = side === 'left' ? 9 - slide : FIELD_W - 9 - pw + slide;
      const y0 = 12;
      p.rect(GOLD, x0 - 1, y0 - 1, pw + 2, ph + 2);
      const dx = p.X(x0);
      const dy = p.Y(y0);
      ctx.drawImage(portrait, dx, dy, p.X(x0 + pw) - dx, p.Y(y0 + ph) - dy);
    }
    const label = (it.skillId && SKILLS[it.skillId]?.name) || '';
    const free = FIELD_W - 18 - pw;
    const textX = side === 'left' ? 9 + pw + free / 2 : 9 + free / 2;
    pixelText(ctx, p, label, textX, 38, GOLD);
    ctx.globalAlpha = 1;
  }

  if (flash > 0) fillRegion(`rgba(255,255,255,${flash.toFixed(3)})`);
}

// ── 이미지를 들고 있는 장면 ──

export interface SceneFighter {
  id: string;
  name: string;
}

export interface FieldSceneOptions {
  player: SceneFighter;
  enemy: SceneFighter;
  /** 그림이 새로 읽히면 불린다(대기 화면 다시 그리기용) */
  onLoad?: () => void;
}

export interface RenderExtra {
  /** 쓰러진 쪽은 대기 화면에서 숨긴다(재생 중에는 ko 연출로 사라진다) */
  alive?: { player: boolean; enemy: boolean };
  /** 대기 들썩임 박자: -1 멈춤, 0/1 번갈아 */
  bob?: number;
  /** 움직임 줄이기: 흔들림 0 */
  reducedMotion?: boolean;
}

export interface RenderResult {
  done: boolean;
  sidesAfter: { player: Side };
  /** 화면 픽셀 기준 흔들림. 전체 캔버스를 그리는 쪽이 적용한다 */
  shake: { dx: number; dy: number };
}

export interface FieldScene {
  /** 장수가 바뀌면(교체·다음 웨이브) 새 그림을 읽는다 */
  setFighters(player: SceneFighter, enemy: SceneFighter): void;
  render(ctx: Ctx, region: Region, timeline: TimelineItem[], elapsedMs: number, sides: { player: Side }, extra?: RenderExtra): RenderResult;
  /** 읽는 중인 그림을 멈춘다 */
  dispose(): void;
}

/** urls를 차례로 시도해 처음 성공한 이미지를 준다. 모두 실패하면 null. 취소 함수를 돌려준다 */
function loadFirst(urls: string[], done: (img: HTMLImageElement | null) => void): () => void {
  let cancelled = false;
  let cur: HTMLImageElement | null = null;
  const tryAt = (i: number) => {
    if (cancelled) return;
    if (i >= urls.length) return done(null);
    const img = new Image();
    cur = img;
    img.onload = () => {
      if (!cancelled) done(img);
    };
    img.onerror = () => tryAt(i + 1);
    img.src = urls[i];
  };
  tryAt(0);
  return () => {
    cancelled = true;
    if (cur) {
      cur.onload = null;
      cur.onerror = null;
    }
  };
}

function whiteSilhouette(img: HTMLImageElement): HTMLCanvasElement | null {
  try {
    const c = document.createElement('canvas');
    c.width = img.naturalWidth || 128;
    c.height = img.naturalHeight || 128;
    const x = c.getContext('2d');
    if (!x) return null;
    x.drawImage(img, 0, 0);
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = '#ffffff';
    x.fillRect(0, 0, c.width, c.height);
    return c;
  } catch {
    return null;
  }
}

export const spriteUrl = (id: string) => `${SPRITE_DIR}${getDuelGeneral(id)?.sprite ?? `${id}.png`}`;
export const portraitUrl = (f: SceneFighter) => `/images/samguk/${getDuelGeneral(f.id)?.name ?? f.name}.jpg`;

export function createFieldScene(opts: FieldSceneOptions): FieldScene {
  const canLoad = typeof Image !== 'undefined' && typeof document !== 'undefined';
  const sprites = new Map<string, SpriteImages>();
  const portraits = new Map<string, HTMLImageElement | null>();
  const pending = new Set<() => void>();
  let fighters: Record<Who, SceneFighter> = { player: opts.player, enemy: opts.enemy };

  const load = (f: SceneFighter) => {
    if (!canLoad) return;
    if (!sprites.has(f.id)) {
      const slot: SpriteImages = { img: null, white: null };
      sprites.set(f.id, slot);
      const cancel = loadFirst([spriteUrl(f.id), `${SPRITE_DIR}mob.png`], (img) => {
        pending.delete(cancel);
        slot.img = img;
        slot.white = img ? whiteSilhouette(img) : null;
        opts.onLoad?.();
      });
      pending.add(cancel);
    }
    const pu = portraitUrl(f);
    if (!portraits.has(pu)) {
      portraits.set(pu, null);
      const cancel = loadFirst([pu], (img) => {
        pending.delete(cancel);
        portraits.set(pu, img);
      });
      pending.add(cancel);
    }
  };
  load(fighters.player);
  load(fighters.enemy);

  return {
    setFighters(player, enemy) {
      fighters = { player, enemy };
      load(player);
      load(enemy);
    },
    render(ctx, region, timeline, elapsedMs, sides, extra = {}) {
      const idle = timeline.length === 0;
      const total = idle ? 0 : sceneLength(timeline);
      const e = Math.min(Math.max(0, elapsedMs), total);
      const alive = idle ? (extra.alive ?? { player: true, enemy: true }) : { player: true, enemy: true };
      const scene = sceneAt(timeline, e, sides, alive);
      const state: FrameState = {
        scene,
        timeline,
        elapsed: e,
        bob: extra.bob ?? -1,
        idle,
        sprites: { player: sprites.get(fighters.player.id), enemy: sprites.get(fighters.enemy.id) },
        portraits: { player: portraits.get(portraitUrl(fighters.player)), enemy: portraits.get(portraitUrl(fighters.enemy)) },
      };
      ctx.imageSmoothingEnabled = false;
      drawField(ctx, region);
      drawFighters(ctx, region, state);
      drawEffects(ctx, region, state);
      const s = extra.reducedMotion || idle ? { dx: 0, dy: 0 } : shakeAt(timeline, e);
      const sx = region.w / FIELD_W;
      const sy = region.h / FIELD_H;
      return {
        done: idle || e >= total,
        sidesAfter: idle ? sides : timeline[timeline.length - 1].sidesAfter,
        shake: { dx: Math.round(s.dx * sx), dy: Math.round(s.dy * sy) },
      };
    },
    dispose() {
      for (const c of pending) c();
      pending.clear();
      // 다 읽지 못한 자리는 비워 두면 다음 장면에서 다시 읽는다
      for (const [k, v] of sprites) if (!v.img) sprites.delete(k);
      for (const [k, v] of portraits) if (!v) portraits.delete(k);
    },
  };
}
