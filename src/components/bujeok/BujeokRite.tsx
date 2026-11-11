'use client'
// 점안(마지막 한 획 + 도장) 화면. 시안 docs/bujeok/serious/jeoman.html을 옮겼다.
// steps: 'draw-seal'(내 전통 부적: 긋고 도장) · 'draw'(선물 보내는 사람: 긋기만) · 'seal'(도장만: 귀여운, 선물 받는 사람).
// 그은 획은 12점으로 줄여 링크 코드에 실린다(stroke.ts). 키보드·움직임 줄이기 사용자를 위해 "그냥 완성하기"가 언제나 보인다.
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as RPointerEvent } from 'react'
import BujeokSvg from './BujeokSvg'
import { rng, type Pt } from '@/lib/bujeok/brush'
import type { BujeokSpec } from '@/lib/bujeok/keys'
import { CARD_BOX, PAL } from '@/lib/bujeok/palette'
import { DEFAULT_SPINE, decodeStroke, encodeStroke, isComplete, tame } from '@/lib/bujeok/stroke'

export type RiteSteps = 'draw-seal' | 'draw' | 'seal'
type Step = 'draw' | 'seal'

const HOLD_MS = 350
const DONE_DELAY_MS = 700
const START: Pt = [120, 254]
const START_RADIUS = 34

const T = {
  draw: '마지막 한 획을 그어 부적을 완성해요',
  drawHint: '붉은 점에서 시작해 아래로 쭉 그어 보세요',
  drawFail: '점선을 따라 아래까지 쭉 그어 주세요',
  drawStart: '붉은 점에서 시작해 주세요',
  seal: '도장을 꾹 눌러 찍어요',
  sealReceived: '보낸 사람이 그은 부적이에요. 도장을 찍어 완성해 주세요',
  short: '조금 더 길게 눌러 주세요',
  press: '꾹…',
  stamped: '완성! 도장이 찍혔어요',
}

const prefersReduce = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function BujeokRite({ spec, name, steps, onDone }: { spec: BujeokSpec; name: string | null; steps: RiteSteps; onDone: (stroke: string | null) => void }) {
  const trad = spec.style === 'trad'
  const box = CARD_BOX[spec.style]
  const ox = trad ? 30 : 0 // 종이 좌표 → SVG 좌표
  const oy = trad ? 6 : 0
  const [step, setStep] = useState<Step>(steps === 'seal' ? 'seal' : 'draw')
  const [preview, setPreview] = useState<Pt[] | null>(null)
  const [committed, setCommitted] = useState<Pt[] | null>(null)
  const [msg, setMsg] = useState<string>(steps === 'seal' ? (spec.stroke && trad ? T.sealReceived : T.seal) : T.draw)
  const [pressing, setPressing] = useState(false)
  const [stamped, setStamped] = useState(false)
  const [thump, setThump] = useState(false)
  const [sparks, setSparks] = useState(false)

  const overlay = useRef<SVGSVGElement>(null)
  const drawing = useRef(false)
  const pts = useRef<Pt[]>([])
  const raf = useRef<number | null>(null)
  const strokeRef = useRef<string | null>(steps === 'seal' ? (spec.stroke ?? null) : null)
  const t0 = useRef(0)
  const stampedRef = useRef(false)
  const doneRef = useRef(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    const ts = timers.current
    return () => {
      ts.forEach(clearTimeout)
      if (raf.current !== null && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf.current)
    }
  }, [])

  const finish = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    onDone(strokeRef.current)
  }, [onDone])

  /** 화면 좌표 → 종이 좌표(전통은 translate(30 6) 안쪽). SVG의 CTM을 쓰고, 없으면 크기 비율로 */
  const toPaper = (e: { clientX: number; clientY: number }): Pt => {
    const svg = overlay.current!
    let x: number
    let y: number
    const m = typeof svg.getScreenCTM === 'function' ? svg.getScreenCTM() : null
    if (m && typeof svg.createSVGPoint === 'function') {
      const p = svg.createSVGPoint()
      p.x = e.clientX
      p.y = e.clientY
      const q = p.matrixTransform(m.inverse())
      x = q.x
      y = q.y
    } else {
      const r = svg.getBoundingClientRect()
      x = box.x + ((e.clientX - r.left) / (r.width || 1)) * box.w
      y = box.y + ((e.clientY - r.top) / (r.height || 1)) * box.h
    }
    return [x - ox, y - oy]
  }

  const flush = () => {
    raf.current = null
    setPreview(pts.current.length >= 3 ? [...pts.current] : null)
  }
  const schedule = () => {
    if (raf.current !== null) return
    if (typeof requestAnimationFrame === 'function') raf.current = requestAnimationFrame(flush)
    else flush()
  }

  const onDown = (e: RPointerEvent<SVGSVGElement>) => {
    if (step !== 'draw' || !e.isPrimary) return
    const p = toPaper(e)
    if (Math.hypot(p[0] - START[0], p[1] - START[1]) > START_RADIUS) {
      setMsg(T.drawStart)
      return
    }
    drawing.current = true
    pts.current = [tame(p)]
    setMsg(T.draw)
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId)
    } catch {
      /* 포인터 캡처를 못 해도 긋기는 된다 */
    }
  }
  const onMove = (e: RPointerEvent<SVGSVGElement>) => {
    if (!drawing.current) return
    const p = tame(toPaper(e))
    const last = pts.current[pts.current.length - 1]
    if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 2.5) return
    pts.current.push(p)
    schedule()
  }
  const endDraw = () => {
    if (!drawing.current) return
    drawing.current = false
    if (raf.current !== null && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf.current)
    raf.current = null
    const got = pts.current
    pts.current = []
    if (!isComplete(got)) {
      // 짧게·위로·화면 밖으로 그은 획은 완성으로 치지 않고 다시 긋게 한다
      setPreview(null)
      setMsg(T.drawFail)
      return
    }
    const code = encodeStroke(got)
    strokeRef.current = code
    setCommitted(decodeStroke(code)) // 저장될 12점 그대로 보여 준다(링크로 열어도 같은 그림)
    setPreview(null)
    if (steps === 'draw') {
      finish()
      return
    }
    setStep('seal')
    setMsg(T.seal)
  }

  const stamp = () => {
    if (stampedRef.current) return
    stampedRef.current = true
    setPressing(false)
    setStamped(true)
    setMsg(T.stamped)
    if (!prefersReduce()) {
      setThump(true)
      setSparks(true)
      if (typeof navigator !== 'undefined') navigator.vibrate?.(35)
      timers.current.push(setTimeout(() => setThump(false), 400), setTimeout(() => setSparks(false), 1400))
    }
    timers.current.push(setTimeout(finish, DONE_DELAY_MS))
  }
  const onSealDown = (e: RPointerEvent<HTMLButtonElement>) => {
    if (stampedRef.current || !e.isPrimary) return
    t0.current = performance.now()
    setPressing(true)
    setMsg(T.press)
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId)
    } catch {
      /* 무시 */
    }
  }
  const onSealUp = (cancel: boolean) => {
    if (!pressing || stampedRef.current) return
    setPressing(false)
    if (cancel || performance.now() - t0.current < HOLD_MS) {
      setMsg(T.short)
      return
    }
    stamp()
  }
  const onSealKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      stamp()
    }
  }

  const skip = () => {
    if (doneRef.current) return
    doneRef.current = true
    onDone(strokeRef.current)
  }

  // 도장 자리(SVG 좌표): 전통은 吉 도장 위, 귀여운은 아래 태그 위
  const sealC: Pt = trad ? [120 + ox, 474 + oy] : [150, 447]
  const hit = trad ? { w: 80, h: 80 } : { w: 140, h: 70 }
  const pct = (v: number, o: number, s: number) => `${((v - o) / s) * 100}%`
  const sealBox = {
    left: pct(sealC[0] - hit.w / 2, box.x, box.w),
    top: pct(Math.min(sealC[1] - hit.h / 2, box.y + box.h - hit.h), box.y, box.h),
    width: `${(hit.w / box.w) * 100}%`,
    height: `${(hit.h / box.h) * 100}%`,
  }
  const rand = rng(7)
  const spark = Array.from({ length: 18 }, () => {
    const a = rand() * Math.PI * 2
    const d = 24 + rand() * 40
    return { dx: Math.cos(a) * d, dy: Math.sin(a) * d, r: 1.2 + rand() * 1.8, ms: 700 + Math.round(rand() * 500) }
  })

  const svgSpine = step === 'draw' ? preview ?? undefined : committed ?? undefined
  return (
    <div className="bj-rite" data-testid="bujeok-rite" data-step={step}>
      <div className="bj-rite-stage">
        <div className={`bj-rite-card${thump ? ' bj-rite-thump' : ''}`} style={{ aspectRatio: `${box.w} / ${box.h}` }}>
          <BujeokSvg
            spec={spec}
            name={name}
            crop
            className="bj-rite-art"
            hideSpine={trad && step === 'draw' && !preview}
            spine={trad ? svgSpine : undefined}
            hideSeal={!stamped}
          />
          <svg
            ref={overlay}
            className="bj-rite-overlay"
            data-testid="bujeok-rite-pad"
            viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
            aria-hidden="true"
            style={{ touchAction: step === 'draw' ? 'none' : 'auto', pointerEvents: step === 'draw' ? 'auto' : 'none' }}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={endDraw}
            onPointerCancel={() => {
              drawing.current = false
              pts.current = []
              setPreview(null)
            }}
          >
            {step === 'draw' && (
              <g transform={`translate(${ox} ${oy})`}>
                <path className="bj-rite-guide" d={'M' + DEFAULT_SPINE.map((p) => p.join(' ')).join(' L')} />
                <circle className="bj-rite-dot" cx={START[0]} cy={START[1]} r="5" />
              </g>
            )}
            {step === 'seal' && !stamped && !pressing && (
              trad ? (
                <rect className="bj-rite-ghost" x={sealC[0] - 23} y={sealC[1] - 23} width="46" height="46" rx="3" transform={`rotate(-4 ${sealC[0]} ${sealC[1]})`} />
              ) : (
                <rect className="bj-rite-ghost" x={sealC[0] - 44} y={sealC[1] - 23} width="88" height="46" rx="23" />
              )
            )}
            {pressing && (
              <g className="bj-rite-press" style={{ transformOrigin: `${sealC[0]}px ${sealC[1]}px` }}>
                {trad ? (
                  <>
                    <rect x={sealC[0] - 23} y={sealC[1] - 23} width="46" height="46" rx="3" fill={PAL.tradSeal} transform={`rotate(-4 ${sealC[0]} ${sealC[1]})`} />
                    <text x={sealC[0]} y={sealC[1] + 14} fontSize="34" textAnchor="middle" fill={PAL.tradSealInk} style={{ fontFamily: 'var(--font-bujeok-brush), "Kaiti TC", serif' }}>
                      吉
                    </text>
                  </>
                ) : (
                  <rect x={sealC[0] - 44} y={sealC[1] - 23} width="88" height="46" rx="23" fill={PAL.cuteTag} />
                )}
              </g>
            )}
            {sparks && (
              <g>
                {spark.map((s, i) => (
                  <circle key={i} className="bj-rite-spark" cx={sealC[0]} cy={sealC[1]} r={s.r} fill="#FFD98A" style={{ ['--dx' as string]: `${s.dx}px`, ['--dy' as string]: `${s.dy}px`, animationDuration: `${s.ms}ms` }} />
                ))}
              </g>
            )}
          </svg>
          {step === 'seal' && !stamped && (
            <button
              type="button"
              className="bj-rite-seal"
              aria-label="도장 찍기"
              style={sealBox}
              onPointerDown={onSealDown}
              onPointerUp={() => onSealUp(false)}
              onPointerCancel={() => onSealUp(true)}
              onKeyDown={onSealKey}
              onClick={(e) => {
                // 키보드·음성 제어로 눌린 클릭(detail 0)은 길게 누르지 않아도 찍힌다
                if (e.detail === 0) stamp()
              }}
            />
          )}
          {sparks && <div className="bj-rite-glow" aria-hidden="true" />}
        </div>
        <p className="bj-rite-say" role="status" aria-live="polite">
          {msg}
          {step === 'draw' && msg === T.draw && <small>{T.drawHint}</small>}
        </p>
      </div>
      <button type="button" onClick={skip} className="bj-rite-skip">
        그냥 완성하기
      </button>
    </div>
  )
}
