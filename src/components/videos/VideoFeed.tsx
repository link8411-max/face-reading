'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import VideoPlayer, { SubscribeLink } from './VideoPlayer'
import { track } from '@/lib/analytics'
import { isNew, viewsLabel } from '@/lib/videos/format'
import type { Video } from '@/lib/videos/types'
import type { Faces } from './VideosBrowser'

const never = () => () => {}
const clock: { at: number | null } = { at: null }
function useNow(): Date | null {
  const ms = useSyncExternalStore(never, () => (clock.at ??= Date.now()), () => null)
  return ms === null ? null : new Date(ms)
}

export default function VideoFeed({
  videos, startIndex, faces, onClose,
}: { videos: Video[]; startIndex: number; faces: Faces; onClose: () => void }) {
  const [active, setActive] = useState(startIndex)
  const scroller = useRef<HTMLDivElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)
  const now = useNow()

  // 바디 스크롤 잠금(닫을 때 원래대로) + Esc + 포커스
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    closeBtn.current?.focus()
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  // 누른 영상 칸으로 바로 이동
  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollTop = startIndex * el.clientHeight
  }, [startIndex])

  // 60% 이상 보이는 칸만 활성
  useEffect(() => {
    const root = scroller.current
    if (!root) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio >= 0.6) setActive(Number((e.target as HTMLElement).dataset.index))
        }
      },
      { root, threshold: [0.6] },
    )
    root.querySelectorAll('[data-index]').forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [videos])

  return (
    <div role="dialog" aria-modal="true" aria-label="쇼츠 보기" className="fixed inset-0 z-[70] bg-[#111] text-paper">
      <div ref={scroller} className="h-full snap-y snap-mandatory overflow-y-auto overscroll-contain">
        {videos.map((v, i) => {
          const fresh = now !== null && isNew(v.publishedAt, now)
          const views = now === null || fresh ? null : viewsLabel(v, now)
          return (
            <section key={v.id} data-index={i} className="flex h-dvh snap-start snap-always flex-col px-4 pb-5 pt-[68px]">
              <div className="flex min-h-0 flex-1 items-center justify-center">
                <div className="aspect-[9/16] h-full max-w-full">
                  {i === active ? (
                    <VideoPlayer key={v.id} video={v} slot="videos" className="!h-full !rounded-xl" />
                  ) : (
                    <div className="relative h-full w-full overflow-hidden rounded-xl bg-ink">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={v.thumbnail} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-2">
                <p className="font-serif text-lg font-bold leading-snug">{v.title}</p>
                {(fresh || views) && <p className="text-xs text-paper/80">{fresh ? 'NEW' : views}</p>}
                <div className="flex flex-wrap gap-1.5">
                  {v.people.filter((p) => faces[p]).map((p) => {
                    const f = faces[p]
                    const inner = (
                      <>
                        {f.portrait ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={f.portrait} alt="" width={24} height={24} className="h-6 w-6 rounded-full object-cover [image-rendering:pixelated]" />
                        ) : (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-paper/50 text-[11px]">{f.name.charAt(0)}</span>
                        )}
                        {f.hasPage ? `${f.name} 열전` : f.name}
                      </>
                    )
                    const cls = 'flex h-8 items-center gap-1.5 rounded-full border border-paper/35 bg-paper/15 pl-1 pr-3 text-[13px]'
                    return f.hasPage ? (
                      <Link key={p} href={`/samguk/people/${p}`} className={cls}>{inner}</Link>
                    ) : (
                      <span key={p} className={cls}>{inner}</span>
                    )
                  })}
                </div>
                <div className="flex gap-2">
                  <Link
                    href="/samguk"
                    onClick={() => track('video_test_click', { slot: 'videos' })}
                    className="flex h-12 flex-[1.4] items-center justify-center rounded-full bg-paper text-[15px] font-bold text-ink"
                  >
                    나는 누구 닮았을까?
                  </Link>
                  <SubscribeLink slot="videos" className="flex h-12 flex-1 items-center justify-center rounded-full border border-paper text-sm">
                    구독
                  </SubscribeLink>
                </div>
              </div>
            </section>
          )
        })}
      </div>

      <div className="pointer-events-none absolute left-4 right-4 top-4 flex items-center justify-between">
        <button
          ref={closeBtn}
          type="button"
          aria-label="목록으로"
          onClick={onClose}
          className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#111]/50"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        <span className="rounded-full bg-[#111]/50 px-3 py-1.5 text-xs">{active + 1} / {videos.length} · 위아래로 넘겨요</span>
      </div>

      <div className="pointer-events-none absolute right-3 top-1/3 flex flex-col items-center gap-1.5" aria-hidden="true">
        {videos.map((v, i) => (
          <span key={v.id} className={`w-1.5 rounded-[3px] ${i === active ? 'h-[30px] bg-paper' : 'h-[18px] bg-paper/40'}`} />
        ))}
      </div>
    </div>
  )
}
