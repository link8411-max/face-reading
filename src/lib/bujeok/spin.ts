// 카드 돌리기와 확대·축소 계산: 순수 함수. 화면(BujeokCard)이 프레임마다 불러 쓴다.

export interface SpinState {
  /** 좌우 회전(도). 0이 앞면, 180이 뒷면 */
  ry: number
  /** 좌우 회전 속도(도/프레임) */
  vy: number
  /** 위아래 기울기(도) */
  rx: number
}

/** 한 프레임. 끄는 중이면 그대로 두고, 아니면 관성으로 돌다가 가까운 면(180° 배수)에 멈춘다 */
export function stepSpin(s: SpinState, dragging: boolean): SpinState {
  if (dragging) return s
  let { ry, vy, rx } = s
  ry += vy
  vy *= 0.94
  if (Math.abs(vy) < 0.6) ry += (Math.round(ry / 180) * 180 - ry) * 0.06
  if (Math.abs(vy) < 0.001) vy = 0
  rx *= 0.92
  if (Math.abs(rx) < 0.001) rx = 0
  return { ry, vy, rx }
}

const mod360 = (ry: number) => (((Number.isFinite(ry) ? ry : 0) % 360) + 360) % 360

/** 멈췄을 때 어느 면이 보이는가 */
export function restFace(ry: number): 'front' | 'back' {
  const a = mod360(ry)
  return a < 90 || a >= 270 ? 'front' : 'back'
}

/** 빛줄기 위치(0..100, %). 한 면을 지나는 동안 100 → 0 */
export function sheenPos(ry: number): number {
  const k = ((mod360(ry) + 90) % 180) / 180
  return 100 - k * 100
}

export const ZOOM = { min: 0.7, max: 2, step: 0.25 } as const

export function clampZoom(z: number): number {
  if (!Number.isFinite(z)) return 1
  return Math.min(ZOOM.max, Math.max(ZOOM.min, z))
}

/** 두 손가락 벌림: 시작 배율 × (지금 거리 / 시작 거리) */
export function pinchZoom(startZoom: number, startDist: number, dist: number): number {
  if (!(startDist > 0)) return clampZoom(startZoom)
  return clampZoom((startZoom * dist) / startDist)
}

/** 처음 건드리기 전 한 번 알려 주는 좌우 흔들기. 세 번 흔들고(약 ±35°) 0으로 돌아온다. 6초쯤 뒤 한 번 더 */
export const HINT = { amp: 35, swings: 3, ms: 2400, repeatAt: 6000 } as const

const smooth = (x: number) => {
  const k = Math.min(1, Math.max(0, x))
  return k * k * (3 - 2 * k)
}

/** 흔들기 한 번의 각도(도). 0에서 시작해 0으로 끝나고, 끝(ms) 이후는 null */
export function hintAngle(tMs: number): number | null {
  if (!Number.isFinite(tMs) || tMs < 0) return 0
  if (tMs >= HINT.ms) return null
  const k = tMs / HINT.ms
  const env = Math.min(smooth(k / 0.08), smooth((1 - k) / 0.25)) // 시작은 부드럽게 올라가고, 끝은 천천히 가라앉는다
  return HINT.amp * Math.sin(2 * Math.PI * HINT.swings * k) * env
}

/** 카드가 앞면에 멈춘 뒤 흐른 시간(ms)에 따른 각도: 첫 흔들기 → 가만히 → 한 번 더 → 끝(null, 한가한 흔들림이 이어받는다) */
export function hintRy(clockMs: number): number | null {
  if (clockMs < HINT.ms) return hintAngle(clockMs)
  if (clockMs < HINT.repeatAt) return 0
  return hintAngle(clockMs - HINT.repeatAt)
}
