'use client'
// "이 부적 받기"를 누르면 점안 전에 무당이 부적을 그려 주는 5초 장면(11/14 사용자: "부적도 무당이 그려 주는 걸", 건너뛰기 버튼 없음).
// 처음엔 첫 장면 그림(포스터)이 바로 보이고, 영상(무당이 쓰다가 카메라가 손 쪽으로 다가가 위에서 내려다보는 각도로)은 소리 없이 한 번 재생된다.
// 영상은 다 그린 부적을 보여 주지 않는다(부적마다 그림이 달라서, 11/14 사용자). 끝나면 화면 전체가 금빛으로 번쩍(FLASH_MS)한 뒤 onDone, 다음 화면이 그 빛이 걷히며 나타난다(RiteFlashOut).
// 영상을 못 받거나(오류·코덱 없음) 3초 안에 재생이 시작되지 않으면 바로 onDone. 움직임 줄이기·데이터 절약이면 이 장면을 아예 건너뛴다(shouldPlayScene).
import { useEffect, useRef, useState } from 'react'
import CastSay from '@/components/cast/CastSay'

export const SCENE_VIDEO = '/videos/bujeok/mudang-rite.mp4'
export const SCENE_POSTER = '/videos/bujeok/mudang-rite-poster.webp'
export const START_TIMEOUT_MS = 3000
export const FLASH_MS = 450
export const MAX_MS = 9000

export function shouldPlayScene(): boolean {
  if (typeof window === 'undefined') return false
  if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  const c = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  return !c?.saveData
}

export default function MudangScene({ onDone }: { onDone: (flashed: boolean) => void }) {
  const done = useRef(false)
  const [flash, setFlash] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const finish = useRef((_flashed = false) => {})
  finish.current = (flashed = false) => {
    if (done.current) return
    done.current = true
    onDone(flashed)
  }
  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms))

  useEffect(() => {
    const ts = timers.current
    later(() => finish.current(), START_TIMEOUT_MS) // 재생이 시작되면 이 타이머를 지운다
    later(() => finish.current(), MAX_MS) // 어떤 경우에도 이 시간 안에는 넘어간다
    return () => ts.forEach(clearTimeout)
  }, [])

  const onPlaying = () => {
    clearTimeout(timers.current[0])
  }
  const onEnded = () => {
    setFlash(true)
    later(() => finish.current(true), FLASH_MS)
  }

  return (
    <div data-testid="mudang-scene" className="mx-auto max-w-[300px]">
      <div className="relative overflow-hidden rounded-[22px] border border-line bg-card" style={{ aspectRatio: '9 / 16' }}>
        <video
          src={SCENE_VIDEO}
          poster={SCENE_POSTER}
          muted
          playsInline
          autoPlay
          preload="auto"
          disablePictureInPicture
          aria-label="무당이 부적을 그려 주는 장면"
          className="absolute inset-0 w-full h-full object-cover"
          onPlaying={onPlaying}
          onEnded={onEnded}
          onError={() => finish.current()}
        />
      </div>
      {flash && <div data-testid="rite-flash" aria-hidden className="rite-flash rite-flash-in fixed inset-0 z-[60] pointer-events-none" />}
      <div className="-mt-10 relative px-3">
        <CastSay lineKey="say.bujeok.rite" size="sm" />
      </div>
    </div>
  )
}

// 번쩍임이 걷히며 다음 화면(점안·완성 카드)이 나타난다. 다 걷히면 onGone.
export function RiteFlashOut({ onGone }: { onGone: () => void }) {
  const gone = useRef(onGone)
  gone.current = onGone
  useEffect(() => {
    const t = setTimeout(() => gone.current(), 800)
    return () => clearTimeout(t)
  }, [])
  return <div data-testid="rite-flash-out" aria-hidden className="rite-flash rite-flash-out fixed inset-0 z-[60] pointer-events-none" />
}
