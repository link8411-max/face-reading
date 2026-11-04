'use client'

import Link from 'next/link'
import CoupangBanner from '@/components/CoupangBanner'
import { Icon } from '@/components/icons'
import { useResultShare } from '@/hooks/useResultShare'
import type { BoardKey } from '@/lib/cup/boards'
import { cupName, cupOgImageUrl, cupPhrase, cupShareUrl } from '@/lib/cup/share'
import type { CupCard } from '@/lib/cup/types'

export interface Top5Row {
  id: string
  name: string
  n: number
}

interface Props {
  board: BoardKey
  title: string
  champion: CupCard
  /** 결승까지 이긴 상대 이름(첫 라운드부터) */
  path: string[]
  top5: Top5Row[]
}

export default function CupResult({ board, title, champion, path, top5 }: Props) {
  const { busy, notice, share } = useResultShare({
    testName: 'cup',
    title: cupName(title),
    text: cupPhrase(champion.name),
    url: cupShareUrl(board, champion.id),
    imageUrl: cupOgImageUrl(board, champion.id),
  })

  return (
    <div className="mt-5 text-center">
      <p className="text-sm font-bold text-accent">{title} 월드컵</p>
      <h2 className="mt-1 font-serif text-xl font-bold">나의 최애 장수</h2>
      <div className="mt-4 rounded-[30px] border border-line bg-white p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={champion.portrait} alt={`${champion.name} 초상`} width={224} height={280} className="mx-auto aspect-[4/5] w-56 max-w-full rounded-[22px] border border-line object-cover" />
        <p className="mt-3 font-serif text-[27px] font-bold leading-tight break-keep">{champion.name}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted break-keep">{champion.line}</p>
      </div>
      {path.length > 0 && (
        <p className="mt-4 text-sm leading-relaxed text-muted break-keep">
          결승까지 이긴 상대 <span className="text-ink">{path.join(' · ')}</span>
        </p>
      )}
      <div className="mt-5 space-y-3">
        <button
          type="button"
          onClick={share}
          disabled={busy}
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-ink px-4 font-medium text-paper disabled:opacity-70"
        >
          <Icon name="share" size={20} />
          공유하기
        </button>
        {notice && (
          <p role="status" className="text-sm text-muted">
            {notice}
          </p>
        )}
        <Link
          href={`/samguk/people/${champion.id}`}
          className="flex h-[52px] w-full items-center justify-center rounded-full border border-line bg-white px-4 font-medium"
        >
          {champion.name} 열전 보기
        </Link>
        <Link href="/samguk/cup" className="flex h-[52px] w-full items-center justify-center rounded-full border border-line bg-white px-4 font-medium">
          다른 판 하기
        </Link>
      </div>
      <CoupangBanner subId={`cup-${board}`} />
      {top5.length > 0 && (
        <section data-testid="cup-top5" className="mt-8 text-left">
          <h3 className="font-serif text-lg font-bold">{title} 우승 순위</h3>
          <ol className="mt-3 space-y-2">
            {top5.map((r, i) => (
              <li key={r.id} className="flex items-center gap-3 rounded-full border border-line bg-white px-4 py-2.5 text-sm">
                <span className="w-6 text-center font-bold tabular-nums">{i + 1}</span>
                <span className="font-medium">{r.name}</span>
                <span className="ml-auto text-xs text-muted tabular-nums">{r.n}번 우승</span>
              </li>
            ))}
          </ol>
          <Link href="/samguk/cup/ranking" className="mt-3 flex h-[44px] items-center justify-center rounded-full text-sm font-medium underline">
            전체 순위 보기
          </Link>
        </section>
      )}
    </div>
  )
}
