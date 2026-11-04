'use client'

import { track } from '@/lib/analytics'
import { gaVideoId, isVideoId, thumbUrl, viewsLabel } from '@/lib/videos/format'
import { PEOPLE_ID_LIST } from '@/content/samgukPeople/ids'
import type { SgTile } from '@/lib/videos/forPerson'
import type { Video } from '@/lib/videos/types'

const PEOPLE_WITH_PAGE = new Set<string>(PEOPLE_ID_LIST)

function Mini({ t }: { t: SgTile }) {
  const border = t.label === '원수' ? 'border-accent' : 'border-ink'
  const inner = (
    <>
      <span className={`block h-[52px] w-[52px] overflow-hidden rounded-xl border-2 bg-navy-game ${border}`}>
        {t.portrait ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={t.portrait} alt={t.name} loading="lazy" className="h-full w-full object-cover [image-rendering:pixelated]" />
        ) : null}
      </span>
      <b className="text-xs">{t.name}</b>
      <i className="text-[10px] not-italic text-muted">{t.label}</i>
    </>
  )
  const cls = 'flex w-[60px] flex-col items-center gap-[3px] text-center text-ink'
  return t.href ? <a href={t.href} className={cls}>{inner}</a> : <div className={cls}>{inner}</div>
}

/** 결과 화면·공유 착지 공용. 이미지 저장 캡처에서 빠지도록 루트에 no-screenshot. */
export default function ResultVideoBlock({
  name, personId, video, faces, who = '내',
}: { name: string; personId?: string; video: Video | null; faces: SgTile[]; who?: '내' | '친구' }) {
  const v = video && isVideoId(video.id) ? video : null
  if (!v && faces.length === 0) return null
  const views = v ? viewsLabel(v, new Date()) : null
  return (
    <div className="no-screenshot mt-3 flex flex-col gap-3">
      {v && (
        <section className="flex items-stretch gap-3 rounded-[22px] bg-card-2 p-3.5">
          <a
            href={`/samguk/videos?v=${v.id}`}
            aria-label={`${name} 영상 보기`}
            onClick={() => track('video_play', { slot: 'result', result_id: gaVideoId(v.id) })}
            className="relative block h-[199px] w-[112px] shrink-0 overflow-hidden rounded-[14px] bg-navy-game"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumbUrl(v.id)} alt={`${name} 영상 썸네일`} width={112} height={199} loading="lazy" className="h-full w-full object-cover" />
            <span className="pointer-events-none absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-ink/80">
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="#FBF6F1" /></svg>
            </span>
          </a>
          <div className="flex min-w-0 flex-col justify-between gap-2">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-accent">{who} 장수 이야기, 1분 영상</span>
              <span className="font-serif text-[17px] font-bold leading-snug">{v.title}</span>
              {views && <span className="text-xs text-muted">{views}</span>}
            </div>
            <a
              href={`/samguk/videos?v=${v.id}`}
              onClick={() => track('video_play', { slot: 'result', result_id: gaVideoId(v.id) })}
              className="flex h-11 items-center justify-center rounded-full bg-ink text-sm text-paper"
            >
              영상 보기
            </a>
          </div>
        </section>
      )}
      {faces.length > 0 && (
        <section className="flex flex-col gap-2.5 rounded-[22px] border border-line bg-white p-3.5">
          <div className="flex items-baseline justify-between">
            <span className="font-serif text-base font-bold">{who} 장수와 엮인 장수들</span>
            {personId && PEOPLE_WITH_PAGE.has(personId) && (
              <a href={`/samguk/people/${personId}`} className="text-xs text-muted">상관도 전체</a>
            )}
          </div>
          <div className="flex justify-between gap-1.5">
            {faces.map((t, i) => <Mini key={t.id ?? i} t={t} />)}
          </div>
        </section>
      )}
    </div>
  )
}
