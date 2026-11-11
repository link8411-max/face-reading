'use client'
// 부적을 붓으로 그리듯 보여 준다. BujeokSvg를 그대로 그린 뒤 [data-a] 요소를 DOM 순서대로 Web Animations API로 연출한다.
// 다시 그릴 때(playKey)와 사라질 때는 이전 Animation을 전부 cancel()해서 선이 겹치거나 반쯤 그려진 채 멈추지 않는다.
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import BujeokSvg from './BujeokSvg'
import type { BujeokSpec } from '@/lib/bujeok/keys'
import type { StrokeKind } from './parts/types'
import { revealPlan, type StrokeIn } from '@/lib/bujeok/timeline'

const EASE = 'cubic-bezier(.4,.1,.3,1)'

function pathLength(el: Element): number {
  const g = el as unknown as { getTotalLength?: () => number }
  try {
    const n = g.getTotalLength?.()
    if (n && Number.isFinite(n) && n > 0) return n
  } catch {
    // 일부 브라우저는 숨은 요소에서 던진다
  }
  const d = Number(el.getAttribute('data-d'))
  return d > 0 ? Math.max(40, (d - 80) / 3) : 120
}

function effectiveKind(el: Element): StrokeKind {
  const k = el.getAttribute('data-a') as StrokeKind
  // 점선이 이미 있는 선은 대시 애니메이션이 점선을 깨므로 페이드로 대신한다
  if (k === 'draw' && el.hasAttribute('stroke-dasharray')) return 'fade'
  return k
}

export default function BujeokReveal({ spec, name, onDone, playKey }: { spec: BujeokSpec; name: string | null; onDone?: () => void; playKey: number }) {
  const wrap = useRef<HTMLDivElement>(null)
  const anims = useRef<Animation[]>([])
  const onDoneRef = useRef(onDone)
  useLayoutEffect(() => { onDoneRef.current = onDone })
  const [doneKey, setDoneKey] = useState<number | null>(null)
  const done = doneKey === playKey
  const finishedKey = useRef<number | null>(null)

  const cancelAll = useCallback(() => {
    for (const a of anims.current) {
      try { a.cancel() } catch { /* 이미 끝남 */ }
    }
    anims.current = []
  }, [])

  const finish = useCallback((key: number) => {
    if (finishedKey.current === key) return
    finishedKey.current = key
    setDoneKey(key)
    onDoneRef.current?.()
  }, [])

  useLayoutEffect(() => {
    const root = wrap.current
    if (!root) return
    finishedKey.current = null
    let alive = true
    const els = Array.from(root.querySelectorAll('[data-a]'))
    const reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || typeof els[0]?.animate !== 'function') {
      // 효과 본문에서 바로 setState하지 않고 한 틱 뒤에 완성 처리
      void Promise.resolve().then(() => { if (alive) finish(playKey) })
      return () => { alive = false }
    }
    const kinds = els.map(effectiveKind)
    const lens = els.map((el, i) => (kinds[i] === 'draw' ? pathLength(el) : undefined))
    const input: StrokeIn[] = els.map((el, i) => {
      const d = Number(el.getAttribute('data-d'))
      return { kind: kinds[i], length: lens[i], preferred: kinds[i] === 'draw' && d > 0 ? d : undefined }
    })
    const { steps } = revealPlan(input, false)
    const made: Animation[] = []
    els.forEach((el, i) => {
      const { delay, duration } = steps[i]
      const opt: KeyframeAnimationOptions = { delay, duration, easing: EASE, fill: 'both' }
      const k = kinds[i]
      let a: Animation
      if (k === 'draw') {
        const len = lens[i] ?? 120
        a = el.animate(
          [
            { strokeDasharray: `${len} ${len}`, strokeDashoffset: len },
            { strokeDasharray: `${len} ${len}`, strokeDashoffset: 0 },
          ],
          opt,
        )
      } else if (k === 'fade') {
        a = el.animate([{ opacity: 0 }, { opacity: 1 }], opt)
      } else {
        const style = (el as SVGElement).style
        style.transformBox = 'fill-box'
        style.transformOrigin = 'center'
        a = k === 'stamp'
          ? el.animate([{ opacity: 0, transform: 'scale(1.7) rotate(-8deg)' }, { opacity: 1, transform: 'scale(.94) rotate(-4deg)', offset: 0.7 }, { opacity: 1, transform: 'scale(1) rotate(-4deg)' }], opt)
          : el.animate([{ opacity: 0, transform: 'scale(.2)' }, { opacity: 1, transform: 'scale(1.15)', offset: 0.7 }, { opacity: 1, transform: 'scale(1)' }], opt)
      }
      made.push(a)
    })
    anims.current = made
    const last = made[made.length - 1]
    last?.finished.then(
      () => { if (alive) finish(playKey) },
      () => { /* cancel */ },
    )
    return () => {
      alive = false
      cancelAll()
    }
  }, [playKey, spec, name, finish, cancelAll])

  const skip = () => {
    cancelAll()
    finish(playKey)
  }

  return (
    <div className="relative">
      <div ref={wrap} className={done && spec.style === 'trad' ? 'bujeok-sway' : undefined}>
        <BujeokSvg spec={spec} name={name} className="block w-full h-auto" />
      </div>
      {!done && (
        <button
          type="button"
          data-testid="bujeok-skip"
          onClick={skip}
          className="absolute right-2 bottom-2 h-9 px-4 rounded-full bg-paper/90 text-ink text-[13px] font-medium border border-line"
        >
          건너뛰기
        </button>
      )}
    </div>
  )
}
