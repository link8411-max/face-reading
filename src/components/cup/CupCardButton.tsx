'use client'

import type { CupCard } from '@/lib/cup/types'

import { portraitThumb } from "@/lib/portraitThumb";
interface Props {
  card: CupCard
  fact: string | undefined
  /** null: 아직 안 골랐음 */
  state: 'picked' | 'other' | null
  onPick: (id: string) => void
}

export default function CupCardButton({ card, fact, state, onPick }: Props) {
  const ring = state === 'picked' ? 'border-accent ring-2 ring-accent' : 'border-line'
  const dim = state === 'other' ? 'opacity-60' : ''
  return (
    <button
      type="button"
      data-testid="cup-card"
      data-card-id={card.id}
      aria-pressed={state === null ? undefined : state === 'picked'}
      onClick={() => onPick(card.id)}
      className={`flex min-h-[44px] w-full min-w-0 flex-col rounded-[22px] border bg-card p-2.5 text-left transition-opacity ${ring} ${dim}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={portraitThumb(card.portrait)} alt="" width={160} height={200} decoding="async" className="aspect-[4/5] w-full rounded-2xl border border-line object-cover" />
      <span className="mt-2 block font-serif text-lg font-bold leading-tight break-keep">{card.name}</span>
      <span className="mt-1 block text-[13px] leading-snug text-muted break-keep">{card.line}</span>
      {fact && (
        <span className="mt-2 block text-[12px] leading-snug break-keep">
          <span className="font-bold text-accent-ink">알고 보면:</span> {fact}
        </span>
      )}
    </button>
  )
}
