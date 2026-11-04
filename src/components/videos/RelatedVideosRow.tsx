import Link from 'next/link'
import { portraitSrc } from '@/lib/people/portrait'
import { isVideoId } from '@/lib/videos/format'
import type { RelatedVideo } from '@/lib/videos/forPerson'

/** 열전 둘째 줄: 관계 인물이 나오는 영상. 비면 null. */
export default function RelatedVideosRow({ items }: { items: RelatedVideo[] }) {
  const list = items.filter((i) => isVideoId(i.video.id))
  if (list.length === 0) return null
  return (
    <section className="mt-6 flex flex-col gap-2.5">
      <h2 className="font-serif font-bold text-lg">관계 인물 영상</h2>
      <div className="-mx-[22px] flex gap-2.5 overflow-x-auto px-[22px] pb-1">
        {list.map((i) => {
          const face = portraitSrc(i.personId)
          return (
            <Link key={i.video.id} href={`/samguk/videos?v=${i.video.id}`} className="flex w-[150px] shrink-0 flex-col gap-1.5">
              <span className="relative block h-[266px] w-[150px] overflow-hidden rounded-2xl bg-navy-game">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={i.video.thumbnail} alt={i.video.title} loading="lazy" className="h-full w-full object-cover" />
                <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-paper/95 py-0.5 pl-0.5 pr-2 text-[11px] text-ink">
                  {face ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={face} alt="" width={20} height={20} className="h-5 w-5 rounded-full object-cover [image-rendering:pixelated]" />
                  ) : (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-line text-[10px]">{i.personName.charAt(0)}</span>
                  )}
                  {i.label} · {i.personName}
                </span>
              </span>
              <span className="text-[13px] font-bold leading-snug text-ink">{i.video.title}</span>
              {i.video.views !== null && <span className="text-[11px] text-muted">조회수 {i.video.views.toLocaleString('en-US')}회</span>}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
