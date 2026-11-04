import Link from 'next/link'
import { eulReul } from '@/lib/people/portrait'
import type { SgGroup, SgTile } from '@/lib/videos/forPerson'

const BORDER: Record<string, string> = { 라이벌: 'border-blush', 원수: 'border-accent' }

function Tile({ t }: { t: SgTile }) {
  const face = (
    <span className="relative block h-16 w-16 overflow-hidden rounded-[14px] border-2 border-ink bg-navy-game">
      {t.portrait ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={t.portrait} alt="" loading="lazy" className="h-full w-full object-cover [image-rendering:pixelated]" />
      ) : null}
    </span>
  )
  const dashed = (
    <span className="flex h-16 w-16 items-center justify-center rounded-[14px] border-2 border-dashed border-line bg-card">
      <span className="font-serif text-[22px] text-muted">{t.name.charAt(0)}</span>
    </span>
  )
  const inner = (
    <>
      <span className="relative block">
        {t.portrait ? face : dashed}
        {t.hasVideo && (
          <span className="absolute bottom-[3px] right-[3px] flex h-5 w-5 items-center justify-center rounded-full bg-accent" aria-label="영상 있음">
            <svg width="10" height="10" viewBox="0 0 24 24" aria-hidden="true" className="text-paper"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
          </span>
        )}
      </span>
      <span className="text-[13px] font-bold leading-tight">{t.name}</span>
      <span className="text-[11px] leading-tight text-muted">{t.label}</span>
    </>
  )
  const cls = 'flex w-[72px] flex-col items-center gap-1 text-center text-ink'
  const attrs = t.hasVideo ? { 'data-has-video': 'true' } : {}
  return t.href ? (
    <Link href={t.href} className={cls} {...attrs}>{inner}</Link>
  ) : (
    <div className={cls} {...attrs}>{inner}</div>
  )
}

/** 삼국지8 리메이크식 상관도. 관계가 없으면 null. */
export default function Sanggwando({ id, name, groups, portrait }: { id: string; name: string; groups: SgGroup[]; portrait: string | null }) {
  const total = groups.reduce((n, g) => n + g.tiles.length, 0)
  if (total === 0) return null
  const anyVideo = groups.some((g) => g.tiles.some((t) => t.hasVideo))
  return (
    <section className="mt-6 flex flex-col gap-2.5" data-person={id}>
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif font-bold text-lg">상관도</h2>
        <span className="text-xs text-muted">얼굴을 누르면 그 인물 열전</span>
      </div>
      <div className="flex items-center gap-3 rounded-[18px] bg-navy-game p-3">
        <span className="block h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 border-gold-game bg-navy-game">
          {portrait && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={portrait} alt="" className="h-full w-full object-cover [image-rendering:pixelated]" />
          )}
        </span>
        <span className="flex flex-col gap-0.5 text-paper">
          <span className="font-serif text-base font-bold">{name}{eulReul(name)} 둘러싼 {total}명</span>
          {anyVideo && <span className="text-xs text-gold-game">영상 표시가 있는 인물은 영상도 있어요</span>}
        </span>
      </div>
      {groups.map((g) => (
        <div key={g.key} className={`rounded-[18px] border bg-white px-3 pb-3.5 pt-3 ${BORDER[g.key] ?? 'border-line'}`}>
          <p className="mb-2.5 text-xs font-bold">{g.key} {g.tiles.length}명</p>
          <div className="flex flex-wrap gap-2">
            {g.tiles.map((t, i) => <Tile key={`${t.id ?? t.name}-${i}`} t={t} />)}
          </div>
        </div>
      ))}
    </section>
  )
}
