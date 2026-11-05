import TrackedVideoLink from './TrackedVideoLink'
import type { Video, VideoSlot } from '@/lib/videos/types'
import { durationLabel, isVideoId } from '@/lib/videos/format'

/** 최신 롱폼 한 편을 가로 카드로. 유튜브 시청 페이지로 보낸다. 서버 컴포넌트. 비면 null. */
export default function LongVideoCard({ videos, slot }: { videos: Video[]; slot: VideoSlot }) {
  const v = videos.find((x) => !x.isShort && isVideoId(x.id))
  if (!v) return null
  const dur = durationLabel(v.durationSec)
  return (
    <section aria-label="긴 영상으로 보는 삼국지" className="no-screenshot mt-6">
      <h2 className="font-serif font-bold text-lg">긴 영상으로 보는 삼국지</h2>
      <TrackedVideoLink
        id={v.id}
        slot={slot}
        href={`https://www.youtube.com/watch?v=${v.id}`}
        className="mt-2.5 flex flex-col gap-2 overflow-hidden rounded-[22px] border border-line bg-white"
      >
        <span className="relative block aspect-video w-full bg-navy-game">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`} alt="" width={480} height={270} loading="lazy" className="h-full w-full object-cover" />
          {dur && <span className="absolute bottom-2 right-2 rounded-md bg-black/75 px-1.5 py-0.5 text-xs font-bold text-white">{dur}</span>}
        </span>
        <span className="px-4 pb-3.5 text-sm font-bold leading-snug text-ink line-clamp-2">{v.title}</span>
      </TrackedVideoLink>
    </section>
  )
}
