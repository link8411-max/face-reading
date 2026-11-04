import type { Video } from '@/lib/videos/types'
import { isVideoId } from '@/lib/videos/format'

/** 허브 가로 띠: 최신 쇼츠 4편. 서버 컴포넌트. 비면 null. */
export default function VideoStrip({ videos }: { videos: Video[] }) {
  const list = videos.filter((v) => v.isShort && isVideoId(v.id)).slice(0, 4)
  if (list.length === 0) return null
  return (
    <section aria-label="쇼츠로 보는 삼국지" className="no-screenshot mt-6">
      <h2 className="font-serif font-bold text-lg">쇼츠로 보는 삼국지</h2>
      <div className="-mx-[22px] mt-2.5 flex gap-2.5 overflow-x-auto px-[22px] pb-1">
        {list.map((v) => (
          <a key={v.id} href={`/samguk/videos?v=${v.id}`} className="flex w-[110px] shrink-0 flex-col gap-1.5">
            <span className="block h-[196px] w-[110px] overflow-hidden rounded-2xl bg-navy-game">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={v.thumbnail} alt={v.title} width={110} height={196} loading="lazy" className="h-full w-full object-cover" />
            </span>
            <span className="text-xs font-bold leading-snug text-ink line-clamp-2">{v.title}</span>
          </a>
        ))}
        <a href="/samguk/videos" className="flex h-[196px] w-[110px] shrink-0 items-center justify-center rounded-2xl border border-line bg-white text-sm font-bold text-accent">
          전체 보기
        </a>
      </div>
    </section>
  )
}
