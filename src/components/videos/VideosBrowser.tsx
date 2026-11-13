'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNow } from './useNow'
import VideoFeed from './VideoFeed'
import { isVideoId, videoBadge } from '@/lib/videos/format'
import type { Video } from '@/lib/videos/types'

import { portraitThumb } from "@/lib/portraitThumb";
export type Faces = Record<string, { name: string; portrait: string | null; hasPage: boolean }>

function Face({ face, size, className = '' }: { face: Faces[string] | undefined; size: number; className?: string }) {
  if (!face) return null
  const box = { width: size, height: size }
  return face.portrait ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={portraitThumb(face.portrait)} alt="" style={box} loading="lazy" decoding="async" className={`rounded-full object-cover [image-rendering:pixelated] ${className}`} />
  ) : (
    <span style={box} className={`flex items-center justify-center rounded-full border border-dashed border-line bg-white text-[11px] text-muted ${className}`}>
      {face.name.charAt(0)}
    </span>
  )
}

export default function VideosBrowser({ videos, faces }: { videos: Video[]; faces: Faces }) {
  const [filter, setFilter] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const now = useNow()

  const chips = useMemo(() => {
    const count = new Map<string, number>()
    for (const v of videos) for (const p of v.people) if (faces[p]) count.set(p, (count.get(p) ?? 0) + 1)
    return [...count.entries()]
      .map(([id, n], first) => ({ id, n, first }))
      .sort((a, b) => b.n - a.n || a.first - b.first)
  }, [videos, faces])

  const shown = filter ? videos.filter((v) => v.people.includes(filter)) : videos

  // 공유용 ?v=<id>: 마운트 뒤에 읽어서 정적 생성을 유지한다. 잘못된 값·없는 영상은 무시.
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get('v')
    if (isVideoId(v) && videos.some((x) => x.id === v)) setOpenId(v) // eslint-disable-line react-hooks/set-state-in-effect
  }, [videos])

  const opener = useRef<HTMLElement | null>(null)
  const pushed = useRef(false) // 이 화면이 ?v= 기록을 쌓았는지(딥링크로 들어왔으면 false)
  const open = (id: string) => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setOpenId(id)
    const u = new URL(window.location.href)
    u.searchParams.set('v', id)
    window.history.pushState(null, '', u)
    pushed.current = true
  }
  // 피드가 사라지고 inert가 풀린 뒤에 열었던 카드로 포커스를 돌려 준다.
  const restoreFocus = useCallback((id: string | null) => {
    requestAnimationFrame(() => {
      const el = opener.current?.isConnected ? opener.current : id ? document.querySelector<HTMLElement>(`button[data-video-id="${id}"]`) : null
      el?.focus()
    })
  }, [])
  const close = useCallback(() => {
    if (pushed.current) {
      pushed.current = false
      window.history.back() // popstate가 피드를 닫는다
      return
    }
    setOpenId(null)
    const u = new URL(window.location.href)
    u.searchParams.delete('v')
    window.history.replaceState(null, '', u)
    restoreFocus(openId)
  }, [restoreFocus, openId])

  // 뒤로 가기(또는 앞으로 가기)로 ?v=가 바뀌면 피드를 맞춘다.
  useEffect(() => {
    const onPop = () => {
      pushed.current = false
      const v = new URLSearchParams(window.location.search).get('v')
      if (isVideoId(v) && videos.some((x) => x.id === v)) {
        setOpenId(v)
      } else {
        setOpenId(null)
        restoreFocus(openId)
      }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [videos, restoreFocus, openId])

  const startIndex = openId ? shown.findIndex((v) => v.id === openId) : -1
  // 필터 밖 영상(?v=)이면 전체 목록으로 연다.
  const feedList = startIndex >= 0 ? shown : videos
  const feedStart = startIndex >= 0 ? startIndex : openId ? videos.findIndex((v) => v.id === openId) : 0

  return (
    <>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold text-muted">인물로 찾기</span>
        <div className="-mx-[22px] flex gap-1.5 overflow-x-auto px-[22px] pb-0.5">
          <button
            type="button"
            aria-pressed={filter === null}
            onClick={() => setFilter(null)}
            className={`flex h-9 shrink-0 items-center rounded-full border px-3 text-[13px] ${filter === null ? 'border-ink bg-ink text-paper' : 'border-line bg-white'}`}
          >
            {`전체 ${videos.length}`}
          </button>
          {chips.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={filter === c.id}
              onClick={() => setFilter(filter === c.id ? null : c.id)}
              className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full border py-0 pl-1 pr-3 text-[13px] ${filter === c.id ? 'border-ink bg-ink text-paper' : 'border-line bg-white'}`}
            >
              <Face face={faces[c.id]} size={28} />
              {c.n >= 2 ? `${faces[c.id].name} ${c.n}` : faces[c.id].name}
            </button>
          ))}
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-x-2.5 gap-y-3.5">
        {shown.map((v) => {
          const badge = now === null ? null : videoBadge(v, now.getTime())
          const fresh = badge?.kind === 'new'
          const views = badge?.kind === 'views' ? badge.text : null
          const names = v.people.map((p) => faces[p]?.name).filter(Boolean)
          const meta = [views, names.join(' · ')].filter(Boolean).join(' · ')
          return (
            <li key={v.id}>
              <button type="button" data-video-id={v.id} onClick={() => open(v.id)} className="flex w-full flex-col gap-1.5 text-left">
                <span className="relative block aspect-[9/16] w-full overflow-hidden rounded-2xl bg-navy-game">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={v.thumbnail} alt={`${v.title} 썸네일`} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                  {fresh && <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-[3px] text-[11px] font-bold text-paper">NEW</span>}
                  <span className="absolute bottom-1.5 left-1.5 flex">
                    {v.people.slice(0, 3).map((p) => (
                      <Face key={p} face={faces[p]} size={24} className="-mr-1.5 border-2 border-paper" />
                    ))}
                  </span>
                </span>
                <span className="text-[13px] font-bold leading-snug">{v.title}</span>
                {meta && <span className="text-[11px] text-muted">{meta}</span>}
              </button>
            </li>
          )
        })}
      </ul>

      {openId && feedStart >= 0 && (
        <VideoFeed videos={feedList} startIndex={feedStart} faces={faces} onClose={close} />
      )}
    </>
  )
}
