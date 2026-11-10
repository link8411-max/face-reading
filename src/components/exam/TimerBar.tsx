'use client'

import { useEffect, useState } from 'react'

// 문제당 시간 막대. 시작은 등장 연출(delayMs)이 끝난 뒤. 3초 이하면 accent 색, 숫자는 초마다 한 번 뛴다.
// 움직임을 줄이는 설정이면 막대는 줄지 않고 남은 초 숫자만 보인다.
export default function TimerBar({ limitMs, delayMs = 0, reduced, timedOut = false }: { limitMs: number; delayMs?: number; reduced: boolean; timedOut?: boolean }) {
  const [left, setLeft] = useState(limitMs)
  const [shrink, setShrink] = useState(false)

  useEffect(() => {
    if (timedOut) return
    const start = performance.now() + delayMs
    const id = setInterval(() => setLeft(Math.min(limitMs, Math.max(0, limitMs - (performance.now() - start)))), 250)
    const raf = setTimeout(() => setShrink(true), delayMs + 30) // 처음 그려진 뒤에 줄이기 시작한다
    return () => { clearInterval(id); clearTimeout(raf) }
  }, [limitMs, delayMs, timedOut])

  const secs = timedOut ? 0 : Math.ceil(left / 1000)
  const urgent = secs <= 3
  return (
    <div className={`flex items-center gap-3 ${timedOut ? 'ex-shake' : ''}`} data-testid="timer">
      {reduced ? (
        <div className="h-2 flex-1" aria-hidden="true" />
      ) : (
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-card-2" aria-hidden="true">
          <div className={`h-2 rounded-full ${urgent ? 'bg-accent' : 'bg-ink'}`} style={{ width: shrink || timedOut ? '0%' : '100%', transition: timedOut ? 'none' : `width ${limitMs}ms linear ${shrink ? '0ms' : '0ms'}` }} />
        </div>
      )}
      <span key={urgent && !timedOut ? secs : 'n'} className={`w-10 text-right text-sm font-bold tabular-nums ${urgent ? 'text-accent' : ''} ${urgent && !timedOut ? 'ex-tick' : ''}`} role="timer" aria-label={`남은 시간 ${secs}초`}>{secs}초</span>
    </div>
  )
}
