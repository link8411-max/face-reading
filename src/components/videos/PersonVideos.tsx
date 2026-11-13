import Link from 'next/link'
import VideoPlayer, { SubscribeLink } from './VideoPlayer'
import { PEOPLE_ID_LIST } from '@/content/samgukPeople/ids'
import { characterById } from '@/lib/people/characters'
import { portraitSrc } from '@/lib/people/portrait'
import { isVideoId } from '@/lib/videos/format'
import type { Video } from '@/lib/videos/types'

import { portraitThumb } from "@/lib/portraitThumb";
const PEOPLE_WITH_PAGE = new Set<string>(PEOPLE_ID_LIST)

/** 열전 첫 줄: 이 인물이 나오는 영상 중 첫 편을 큰 카드로. 비면 null. */
export default function PersonVideos({ id, name, videos }: { id: string; name: string; videos: Video[] }) {
  const list = videos.filter((v) => isVideoId(v.id))
  const video = list[0]
  if (!video) return null

  const others = [...new Set(list.flatMap((v) => v.people))]
    .filter((p) => p !== id && PEOPLE_WITH_PAGE.has(p))
    .map((p) => ({ id: p, name: characterById(p)?.name ?? p, portrait: portraitSrc(p) }))

  return (
    <section className="mt-6 flex flex-col gap-2.5">
      <h2 className="font-serif font-bold text-lg">{name} 이야기, 1분 영상</h2>
      {list.length === 1 ? (
        <>
          <VideoPlayer video={video} slot="people" className="mx-auto max-h-[560px] max-w-[315px] !rounded-[22px]" />
          <p className="text-[15px] font-bold leading-snug">{video.title}</p>
        </>
      ) : (
        <div data-person-videos-row className="-mx-[22px] flex snap-x snap-mandatory scroll-px-[22px] gap-2.5 overflow-x-auto px-[22px] pb-1">
          {list.map((v) => (
            <div key={v.id} className="flex w-[240px] shrink-0 snap-start flex-col gap-2">
              <VideoPlayer video={v} slot="people" className="!rounded-[22px]" />
              <p className="text-[15px] font-bold leading-snug">{v.title}</p>
            </div>
          ))}
        </div>
      )}
      {others.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted">함께 나오는 인물</span>
          {others.map((o) => (
            <Link
              key={o.id}
              href={`/samguk/people/${o.id}`}
              className="flex items-center gap-1.5 rounded-full border border-line bg-white py-[3px] pl-[3px] pr-2.5 text-[13px]"
            >
              {o.portrait ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={portraitThumb(o.portrait)} alt="" width={24} height={24} loading="lazy" decoding="async" className="h-6 w-6 rounded-full object-cover [image-rendering:pixelated]" />
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-line text-[11px] text-muted">{o.name.charAt(0)}</span>
              )}
              {o.name} 열전
            </Link>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <SubscribeLink slot="people" className="flex h-11 flex-1 items-center justify-center rounded-full bg-accent text-sm text-white">
          유튜브에서 구독
        </SubscribeLink>
        <Link href="/samguk/videos" className="flex h-11 flex-1 items-center justify-center rounded-full border border-ink text-sm">
          영상 더 보기
        </Link>
      </div>
    </section>
  )
}
