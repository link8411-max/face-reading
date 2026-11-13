'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { track } from '@/lib/analytics'
import { drawFromPool, type BoardKey } from '@/lib/cup/boards'
import { championPath, currentMatch, matchNumber, pick, progressLabel, ratioMessage, startCup, type CupState, type Others } from '@/lib/cup/game'
import type { CupCard, MeetNote } from '@/lib/cup/types'
import { pairKey } from '@/lib/people/keys'
import SourceChip from '@/components/people/SourceChip'
import CupCardButton from './CupCardButton'
import CupResult, { type Top5Row } from './CupResult'

export interface CupGameProps {
  board: BoardKey
  title: string
  /** 이 판의 후보 전원(서버가 보낸다). 대진은 이 안에서 뽑는다 */
  cards: CupCard[]
  notes: Record<string, MeetNote>
  top5: Top5Row[]
}

interface View {
  cup: CupState
  /** 이 대결에서 고른 id. null이면 아직 안 골랐다 */
  picked: string | null
  /** null: 응답을 기다리는 중이거나 아직 안 골랐다 */
  ratio: Others
  /** 두 카드가 이번 대결에서 보여 줄 facts 번호(대결이 바뀔 때만 다시 고른다) */
  factIdx: [number, number]
}

const ENDPOINT = '/api/people/cup'

function post(body: Record<string, string>): Promise<Response> {
  return fetch(ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
}

function readOthers(json: unknown): Others {
  const o = (json as { others?: unknown } | null)?.others
  return o !== null && typeof o === 'object' && !Array.isArray(o) ? (o as Record<string, number>) : 'error'
}

function Loading({ title }: { title: string }) {
  return <p className="mt-6 text-center text-sm text-muted">{title} · 불러오는 중</p>
}

export default function CupGame(props: CupGameProps) {
  return (
    <Suspense fallback={<Loading title={props.title} />}>
      <CupGameInner {...props} />
    </Suspense>
  )
}

function CupGameInner({ board, title, cards, notes, top5 }: CupGameProps) {
  const withId = useSearchParams().get('with')
  const byId = useRef(new Map(cards.map((c) => [c.id, c])))
  const [view, setView] = useState<View | null>(null)
  const [empty, setEmpty] = useState(false)
  const started = useRef(false)
  // 같은 대결을 두 번 보내지 않도록 동기적으로 잠그는 값(대결 번호)
  const lockedFor = useRef<number | null>(null)

  const makeView = (cup: CupState): View => {
    const m = currentMatch(cup)
    const pickIdx = (id: string) => Math.floor(Math.random() * Math.max(1, byId.current.get(id)?.facts.length ?? 1))
    return { cup, picked: null, ratio: null, factIdx: m ? [pickIdx(m[0]), pickIdx(m[1])] : [0, 0] }
  }

  useEffect(() => {
    if (started.current) return
    started.current = true
    const entrants = drawFromPool(cards.map((c) => c.id), Math.random, withId)
    if (entrants.length === 0) {
      setEmpty(true)
      return
    }
    setView(makeView(startCup(entrants)))
    track('cup_start', { result_id: board })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (empty) return <p className="mt-6 text-center text-sm text-muted">이 판은 아직 준비 중이에요</p>
  if (!view) return <Loading title={title} />

  const { cup } = view
  if (cup.champion !== null) {
    const champion = byId.current.get(cup.champion)
    if (!champion) return <p className="mt-6 text-center text-sm text-muted">결과를 불러오지 못했어요</p>
    const path = championPath(cup).map((id) => byId.current.get(id)?.name ?? id)
    return <CupResult board={board} title={title} champion={champion} path={path} top5={top5} />
  }

  const m = currentMatch(cup)!
  const [left, right] = [byId.current.get(m[0])!, byId.current.get(m[1])!]
  const note = notes[pairKey(m[0], m[1])]
  const isLast = cup.round.length === 2
  const num = matchNumber(cup)

  function onPick(id: string) {
    if (lockedFor.current === num) return
    lockedFor.current = num
    setView((v) => (v ? { ...v, picked: id } : v))
    post({ type: 'match', board, a: m[0], b: m[1], pick: id })
      .then(async (res): Promise<Others> => (res.ok ? readOthers(await res.json()) : 'error'))
      .catch((): Others => 'error')
      // 응답이 늦어 이미 다음 대결로 넘어갔다면 반영하지 않는다
      .then((ratio) => setView((v) => (v && matchNumber(v.cup) === num ? { ...v, ratio } : v)))
  }

  function onNext() {
    if (!view?.picked) return
    const next = pick(cup, view.picked)
    if (next.champion !== null) {
      post({ type: 'win', board, id: next.champion }).catch(() => {})
      track('cup_end', { result_id: `${board}_${next.champion}` })
      setView({ cup: next, picked: null, ratio: null, factIdx: [0, 0] })
    } else {
      setView(makeView(next))
    }
  }

  const pickedCard = view.picked ? byId.current.get(view.picked) : null
  const stateOf = (id: string) => (view.picked === null ? null : view.picked === id ? 'picked' : 'other')

  return (
    <div className="mt-5">
      <p className="text-center text-sm font-bold text-accent">{progressLabel(cup, title)}</p>
      <h2 className="mt-1 text-center font-serif text-xl font-bold">둘 중 누가 더 끌리나요?</h2>
      <div key={num} className="cup-in mt-4">
        <div className="grid grid-cols-2 items-stretch gap-3">
          <CupCardButton card={left} fact={left.facts[view.factIdx[0]]} state={stateOf(left.id)} onPick={onPick} />
          <CupCardButton card={right} fact={right.facts[view.factIdx[1]]} state={stateOf(right.id)} onPick={onPick} />
        </div>
        {note && (
          <p className="mt-3 rounded-[22px] bg-card border border-line px-4 py-3 text-[13px] leading-relaxed break-keep">
            <span className="font-bold">이 둘이 만난 장면:</span> {note.note}
            <SourceChip source={note.source} />
          </p>
        )}
      </div>
      <p data-testid="ratio" aria-live="polite" className="mt-3 min-h-[24px] text-center text-sm text-muted">
        {pickedCard ? ratioMessage(view.ratio, pickedCard.id, pickedCard.name) : ''}
      </p>
      <button
        type="button"
        onClick={onNext}
        disabled={view.picked === null}
        className="mt-3 h-[52px] w-full rounded-full bg-accent px-4 font-medium text-white disabled:opacity-40"
      >
        {isLast ? '결과 보기' : '다음 대결'}
      </button>
    </div>
  )
}
