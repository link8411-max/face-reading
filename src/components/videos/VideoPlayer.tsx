'use client'

import { useEffect, useId, useState, useSyncExternalStore, type ReactNode } from 'react'
import { track } from '@/lib/analytics'
import { gaVideoId, isNew, isVideoId, viewsLabel } from '@/lib/videos/format'
import type { Video, VideoSlot } from '@/lib/videos/types'

const PLAY_EVENT = 'samguk-video-play'
const SUBSCRIBE_URL = 'https://www.youtube.com/@unse_ai?sub_confirmation=1'

export function SubscribeLink({
  slot, className, children,
}: { slot: VideoSlot; className?: string; children?: ReactNode }) {
  return (
    <a
      href={SUBSCRIBE_URL}
      target="_blank"
      rel="noopener"
      className={className}
      onClick={() => track('video_subscribe_click', { slot })}
    >
      {children ?? '구독'}
    </a>
  )
}

const subscribeNever = () => () => {}

function PlayMark() {
  return (
    <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink/70 text-paper">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </span>
  )
}

export default function VideoPlayer({
  video, slot, className = '', nowMs,
}: { video: Video; slot: VideoSlot; className?: string; nowMs?: number }) {
  const [playing, setPlaying] = useState(false)
  const [clock] = useState<{ at: number | null }>(() => ({ at: null }))
  // 서버·하이드레이션 첫 렌더는 nowMs ?? null, 마운트 뒤에는 한 번만 잰 Date.now()
  const now = useSyncExternalStore(
    subscribeNever,
    () => nowMs ?? (clock.at ??= Date.now()),
    () => nowMs ?? null,
  )
  const token = useId()
  const playable = isVideoId(video.id)

  useEffect(() => {
    const onOther = (e: Event) => {
      if ((e as CustomEvent).detail !== token) setPlaying(false)
    }
    window.addEventListener(PLAY_EVENT, onOther)
    return () => window.removeEventListener(PLAY_EVENT, onOther)
  }, [token])

  const nowDate = now === null ? null : new Date(now)
  const fresh = nowDate !== null && isNew(video.publishedAt, nowDate)
  const views = nowDate === null ? null : viewsLabel(video, nowDate)
  const pill = (fresh || views) && (
    <span className="absolute left-2 top-2 rounded-full bg-ink/70 px-2.5 py-1 text-xs font-semibold text-paper">
      {fresh ? 'NEW' : views}
    </span>
  )

  const box = `relative aspect-[9/16] w-full overflow-hidden rounded-2xl bg-ink ${className}`

  if (playing && playable) {
    return (
      <div className={box}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&playsinline=1`}
          title={video.title}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    )
  }

  const thumb = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={video.thumbnail} alt={video.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
  )

  if (!playable) {
    return <div className={box}>{thumb}{pill}</div>
  }

  return (
    <button
      type="button"
      aria-label={`${video.title} 재생`}
      className={`${box} block text-left`}
      onClick={() => {
        window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: token }))
        setPlaying(true)
        track('video_play', { slot, result_id: gaVideoId(video.id) })
      }}
    >
      {thumb}
      {pill}
      <PlayMark />
    </button>
  )
}

export { VideoPlayer }
