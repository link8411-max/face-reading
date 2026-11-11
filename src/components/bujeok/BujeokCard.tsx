'use client'
// 손으로 돌려 보는 입체 부적 카드 (설계 13절, 시안 docs/bujeok/card-spike.html).
// 한 손가락으로 가로로 밀면 돌고(놓으면 관성으로 돌다 가까운 면에 멈춤), 세로로 밀면 페이지가 스크롤되고(touch-action: pan-y),
// 두 손가락으로 벌리면 커진다. 마우스 휠은 페이지 스크롤이고, 트랙패드 핀치(ctrl+휠)만 확대·축소한다.
// 움직임은 전부 requestAnimationFrame 하나가 spin.ts의 순수 함수로 계산해 CSS 변수에 쓴다(React 다시 그리기 없음).
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import BujeokSvg from './BujeokSvg'
import { CARD_BOX, themeFor } from '@/lib/bujeok/palette'
import type { BujeokSpec } from '@/lib/bujeok/keys'
import { ZOOM, clampZoom, pinchZoom, restFace, sheenPos, stepSpin } from '@/lib/bujeok/spin'
import { WATERMARK } from '@/lib/bujeok/wallpaper'
import { WISH_TEXT } from '@/content/bujeok'

type Face = 'front' | 'back'
export interface BujeokCardProps {
  spec: BujeokSpec
  /** 받는 사람(또는 도장에 새긴 이름). cleanName을 통과한 값만 */
  name: string | null
  from?: string | null
  /** 한 바퀴 반 돌며 나타나 앞면으로 멈춘다 */
  enter?: boolean
  /** 값이 바뀌면 카드를 새로 세워 등장 회전을 다시 한다 */
  playKey?: number
}

const ENTER_MS = 1500
const ENTER_FROM = -540
const SWAY_DEG = 22
const DUST_COUNT = 42

const prefersReduce = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const round2 = (z: number) => Math.round(z * 100) / 100

interface Motion {
  ry: number
  vy: number
  rx: number
  touched: boolean
  entering: boolean
  entT: number
  swayT: number
  /** 한 손가락으로 끄는 중 */
  dragging: boolean
  /** 두 손가락으로 벌리는 중: 돌리지 않는다 */
  pinching: boolean
  face: Face
  /** 기울기(안드로이드) */
  tiltX: number
  tiltY: number
}

export default function BujeokCard(props: BujeokCardProps) {
  // key가 바뀌면 안쪽이 통째로 새로 서서 회전·확대가 처음 상태로 돌아간다
  return <CardInner key={props.playKey ?? 0} {...props} />
}

function CardInner({ spec, name, from, enter = false }: BujeokCardProps) {
  const theme = themeFor(spec.style, spec.finish)
  const box = CARD_BOX[spec.style]
  const text = WISH_TEXT[spec.wish]
  const stageRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const dustRef = useRef<HTMLCanvasElement>(null)
  const reduceRef = useRef(false)
  /** 프레임 루프를 다시 깨운다(움직임 줄이기에서 쉬던 루프를 입력이 올 때 되살림) */
  const kick = useRef<() => void>(() => {})
  const mo = useRef<Motion | null>(null)
  if (mo.current === null) {
    const entering = enter && !prefersReduce()
    mo.current = { ry: entering ? ENTER_FROM : 0, vy: 0, rx: 0, touched: false, entering, entT: 0, swayT: 0, dragging: false, pinching: false, face: 'front', tiltX: 0, tiltY: 0 }
  }
  const [face, setFace] = useState<Face>('front')
  const [entering, setEntering] = useState(() => enter && !prefersReduce())
  const [zoom, setZoomState] = useState(1)
  const zoomRef = useRef(1)
  const setZoom = (z: number) => {
    const v = round2(clampZoom(z))
    zoomRef.current = v
    setZoomState(v)
  }

  // ---- 포인터: 한 손가락 = 돌리기, 두 손가락 = 확대·축소, 두 번 두드리기 = 원래 크기 ----
  const pts = useRef(new Map<number, { x: number; y: number }>())
  const drag = useRef({ lx: 0, ly: 0, ox: 0, oy: 0, moved: 0, t: 0, lastTap: 0 })
  const pinch = useRef({ dist: 0, zoom: 1, did: false })
  const dist2 = () => {
    const [a, b] = [...pts.current.values()]
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0
  }

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const m = mo.current!
    // 새로 눌린 primary 포인터가 있으면 up이 오지 않고 남은 옛 포인터는 지운다(두 손가락으로 오해하지 않게)
    if (e.isPrimary) {
      pts.current.clear()
      m.dragging = false
      m.pinching = false
    }
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    kick.current()
    try {
      stageRef.current?.setPointerCapture?.(e.pointerId)
    } catch {
      /* 포인터 캡처를 못 해도 돌리기는 된다 */
    }
    m.touched = true
    m.entering = false
    setEntering(false)
    if (pts.current.size === 1) {
      m.dragging = true
      m.vy = 0
      drag.current = { ...drag.current, lx: e.clientX, ly: e.clientY, ox: e.clientX, oy: e.clientY, moved: 0, t: performance.now() }
      pinch.current.did = false
    } else if (pts.current.size === 2) {
      m.dragging = false
      m.pinching = true
      m.vy = 0
      pinch.current = { dist: dist2(), zoom: zoomRef.current, did: true }
    }
  }
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const m = mo.current!
    if (!pts.current.has(e.pointerId)) return
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (m.pinching) {
      if (pts.current.size >= 2) setZoom(pinchZoom(pinch.current.zoom, pinch.current.dist, dist2()))
      return
    }
    if (!m.dragging) return
    const d = drag.current
    const dx = e.clientX - d.lx
    const dy = e.clientY - d.ly
    d.lx = e.clientX
    d.ly = e.clientY
    d.moved = Math.max(d.moved, Math.hypot(e.clientX - d.ox, e.clientY - d.oy))
    m.ry += dx * 0.55
    m.vy = dx * 0.55
    m.rx = Math.max(-16, Math.min(16, m.rx - dy * 0.2))
  }
  const onUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const m = mo.current!
    if (!pts.current.has(e.pointerId)) return
    pts.current.delete(e.pointerId)
    const d = drag.current
    if (pts.current.size === 0) {
      const wasPinch = pinch.current.did
      m.dragging = false
      m.pinching = false
      pinch.current.did = false
      // 두 번 두드리면 원래 크기
      const now = performance.now()
      if (!wasPinch && d.moved < 12 && now - d.t < 400) {
        if (now - d.lastTap < 350) {
          setZoom(1)
          d.lastTap = 0
        } else d.lastTap = now
      } else d.lastTap = 0
    } else if (pts.current.size === 1) {
      // 벌리던 손가락 하나를 떼면 남은 손가락으로 이어서 돌린다(튀지 않게 기준점을 다시 잡는다)
      const rest = [...pts.current.values()][0]
      m.pinching = false
      m.dragging = true
      m.vy = 0
      d.lx = rest.x
      d.ly = rest.y
      d.ox = rest.x
      d.oy = rest.y
      d.moved = 99
    }
  }

  const flip = () => {
    const m = mo.current!
    if (m.entering) {
      m.entering = false
      m.ry = 0
      setEntering(false)
    }
    m.touched = true
    kick.current()
    m.vy = 11 // 놓으면 관성으로 한 면 돌고 가까운 면에 멈춘다
    setFace((f) => (f === 'front' ? 'back' : 'front'))
    m.face = m.face === 'front' ? 'back' : 'front'
  }

  const onKey = (e: React.KeyboardEvent) => {
    const m = mo.current!
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      m.touched = true
      kick.current()
      m.entering = false
      setEntering(false)
      m.vy = e.key === 'ArrowLeft' ? -9 : 9
    }
  }

  // ---- 트랙패드 핀치(ctrl+휠)만 확대·축소. 그냥 휠은 페이지 스크롤이므로 건드리지 않는다 ----
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return
      e.preventDefault()
      setZoom(zoomRef.current * Math.exp(-e.deltaY * 0.002))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // ---- 안드로이드에서만: 폰을 기울이면 빛이 살짝 따라온다(권한 창이 필요한 기기는 건너뜀) ----
  useEffect(() => {
    if (typeof DeviceOrientationEvent === 'undefined') return
    if (typeof (DeviceOrientationEvent as unknown as { requestPermission?: unknown }).requestPermission === 'function') return
    if (prefersReduce()) return
    const m = mo.current!
    const on = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return
      m.tiltX = Math.max(-1, Math.min(1, e.gamma / 40))
      m.tiltY = Math.max(-1, Math.min(1, (e.beta - 50) / 40))
    }
    window.addEventListener('deviceorientation', on)
    return () => window.removeEventListener('deviceorientation', on)
  }, [])

  // ---- 프레임 루프 ----
  useEffect(() => {
    const m = mo.current!
    const stage = stageRef.current
    const card = cardRef.current
    const cv = dustRef.current
    if (!stage || !card) return
    const reduce = prefersReduce()
    reduceRef.current = reduce
    const canvasOk = !!cv && typeof window.CanvasRenderingContext2D !== 'undefined'
    const cx = canvasOk ? cv.getContext('2d') : null
    let P: { x: number; y: number; r: number; s: number; p: number }[] = []
    const fit = () => {
      if (!cv || !cx) return
      const r = cv.getBoundingClientRect()
      const d = Math.min(2, window.devicePixelRatio || 1)
      cv.width = Math.max(1, r.width * d)
      cv.height = Math.max(1, r.height * d)
      cx.setTransform(d, 0, 0, d, 0, 0)
      P = Array.from({ length: DUST_COUNT }, () => ({ x: Math.random() * r.width, y: Math.random() * r.height, r: 0.6 + Math.random() * 1.8, s: 0.15 + Math.random() * 0.45, p: Math.random() * 6.28 }))
    }
    const dust = (now: number) => {
      if (!cv || !cx) return
      const w = cv.clientWidth
      const h = cv.clientHeight
      cx.clearRect(0, 0, w, h)
      for (const p of P) {
        if (!reduce) {
          p.y -= p.s
          p.x += Math.sin(now / 900 + p.p) * 0.25
          if (p.y < -4) {
            p.y = h + 4
            p.x = Math.random() * w
          }
        }
        cx.globalAlpha = reduce ? 0.5 : 0.25 + 0.55 * Math.abs(Math.sin(now / 700 + p.p))
        cx.fillStyle = '#f3d27a'
        cx.beginPath()
        cx.arc(p.x, p.y, p.r, 0, 6.28)
        cx.fill()
      }
      cx.globalAlpha = 1
    }
    fit()
    const onResize = () => {
      fit()
      kick.current() // 쉬는 중이어도 새 크기로 먼지를 다시 그린다
    }
    window.addEventListener('resize', onResize)

    const apply = () => {
      const tiltOn = !reduce
      const rx = m.rx + (tiltOn ? m.tiltY * 6 : 0)
      card.style.setProperty('--ry', `${m.ry.toFixed(2)}deg`)
      card.style.setProperty('--rx', `${rx.toFixed(2)}deg`)
      const sx = Math.max(0, Math.min(100, sheenPos(m.ry) + (tiltOn ? m.tiltX * 25 : 0)))
      card.style.setProperty('--sx', `${sx.toFixed(1)}%`)
      card.style.setProperty('--sy', `${(50 + rx * 2).toFixed(1)}%`)
      stage.style.setProperty('--sh', Math.max(0.15, Math.abs(Math.cos((m.ry * Math.PI) / 180))).toFixed(2))
    }

    /** 이번 프레임에 카드가 움직였거나 움직일 예정인가(쉬는 중이면 false) */
    const update = (dt: number): boolean => {
      if (m.entering) {
        m.entT += dt
        const k = Math.min(1, m.entT / ENTER_MS)
        m.ry = ENTER_FROM * Math.pow(1 - k, 3)
        m.rx = 0
        if (k >= 1) {
          m.entering = false
          m.ry = 0
          m.swayT = 0
          setEntering(false)
        }
        return true
      }
      if (!m.touched && !reduce) {
        // 건드리기 전에는 혼자 천천히 좌우로 흔들린다
        m.swayT += dt
        m.ry = Math.sin(m.swayT / 1400) * SWAY_DEG
        m.rx = Math.sin(m.swayT / 2100) * 4
        return true
      }
      if (!m.touched) return false // 움직임 줄이기: 건드리기 전에는 가만히
      const s = stepSpin({ ry: m.ry, vy: m.vy, rx: m.rx }, m.dragging || m.pinching)
      m.ry = s.ry
      m.vy = s.vy
      m.rx = s.rx
      if (!m.dragging && !m.pinching && Math.abs(m.vy) < 0.6) {
        const f = restFace(m.ry)
        if (f !== m.face) {
          m.face = f
          setFace(f)
        }
      }
      if (m.dragging || m.pinching) return true
      // 거의 멈췄으면 면에 딱 붙이고 쉰다
      const target = Math.round(m.ry / 180) * 180
      if (m.vy === 0 && Math.abs(m.ry - target) < 0.01 && m.rx === 0) {
        m.ry = target
        return false
      }
      return true
    }

    let raf = 0
    let last = 0
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = last ? Math.min(now - last, 50) : 16
      last = now
      const active = update(dt)
      apply()
      dust(now)
      // 움직임 줄이기: 먼지는 한 번 그리고, 카드가 쉬면 루프를 멈춘다(입력이 오면 kick으로 되살림)
      if (reduce && !active) stop()
    }
    const start = () => {
      if (!raf) {
        last = 0
        raf = requestAnimationFrame(frame)
      }
    }
    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    }
    kick.current = start
    // 탭이 가려지면 멈추고 다시 보이면 이어서 돈다
    const onVis = () => (document.hidden ? stop() : start())
    document.addEventListener('visibilitychange', onVis)
    apply()
    if (!document.hidden) start()
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('resize', onResize)
      kick.current = () => {}
    }
  }, [])

  const stageStyle = { touchAction: 'pan-y', '--ar': `${box.w}/${box.h}` } as CSSProperties
  const cardStyle = { '--r': theme.radius, '--edge': theme.cardEdge, '--backbg': theme.backBg, '--backfg': theme.backFg, '--holo': spec.finish === 'holo' ? '.42' : '0' } as CSSProperties
  const zStyle = { '--zoom': zoom } as CSSProperties
  const pill = 'h-10 px-4 rounded-full bg-white text-ink border border-line text-sm font-medium disabled:opacity-40'
  const sheen = <div className="bj-sheen" />

  return (
    <div>
      <div
        ref={stageRef}
        data-testid="bujeok-stage"
        data-zoom={String(zoom)}
        className="bj-stage"
        style={stageStyle}
        tabIndex={0}
        role="group"
        aria-label="돌려 볼 수 있는 부적 카드. 좌우로 밀면 돌아가요."
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onLostPointerCapture={onUp}
        onKeyDown={onKey}
      >
        <canvas ref={dustRef} className="bj-dust" aria-hidden="true" />
        <div className="bj-zoomer" style={zStyle}>
          <div className="bj-scene">
            <div ref={cardRef} data-testid="bujeok-card" data-face={face} data-entering={String(entering)} className="bj-card" style={cardStyle}>
              {[3, 1, -1, -3].map((z) => (
                <div key={z} className="bj-slab" style={{ transform: `translateZ(${z}px)` }} />
              ))}
              <div className="bj-face bj-front">
                <div data-bujeok-art="" style={{ position: 'absolute', inset: 0 }}>
                  <BujeokSvg spec={spec} name={name} crop />
                </div>
                <div className="bj-holo" />
                {sheen}
              </div>
              <div className="bj-face bj-back" data-testid="bujeok-back">
                <div className="bj-seal" aria-hidden="true">{spec.style === 'trad' ? '福' : '복'}</div>
                {name && <div style={{ fontSize: 'clamp(18px, 5.4vw, 26px)', fontWeight: 700 }}>{name}에게</div>}
                <p style={{ margin: 0, fontSize: 'clamp(12px, 3.4vw, 15px)', lineHeight: 1.7 }}>
                  {text.hanjaMeaning}
                  <br />
                  {text.sub}
                </p>
                <div style={{ fontSize: 11, opacity: 0.75, letterSpacing: '.06em' }}>
                  {from ? <>{from} 드림<br /></> : null}
                  {WATERMARK}
                </div>
                {sheen}
              </div>
            </div>
          </div>
        </div>
        <div className="bj-shadow" aria-hidden="true" />
      </div>

      <div className="no-screenshot mt-3 flex items-center justify-center gap-2">
        <button type="button" data-testid="bujeok-flip" onClick={flip} className={pill}>뒤집기</button>
        <button type="button" data-testid="bujeok-zoom-out" onClick={() => setZoom(zoomRef.current - ZOOM.step)} disabled={zoom <= ZOOM.min} aria-label="축소" className={pill}>축소</button>
        <button type="button" data-testid="bujeok-zoom-in" onClick={() => setZoom(zoomRef.current + ZOOM.step)} disabled={zoom >= ZOOM.max} aria-label="확대" className={pill}>확대</button>
      </div>
    </div>
  )
}
