'use client'

import { useState } from 'react'
import { track } from '@/lib/analytics'
import { useResultShare } from '@/hooks/useResultShare'
import type { VoteKind } from '@/lib/people/votes'
import { LIMITED_TEXT, headCountText, ratioView, useMarker, usePersonStats, writeMarker } from './usePersonStats'

export interface PollOption {
  key: string
  label: string
  /** 정사·연의 같은 출처 표시 (명장면) */
  note?: string
}

export interface PollShare {
  url: string
  imageUrl: string
  /** 고른 option key -> 공유 문구 */
  text: Record<string, string>
}

interface Props {
  kind: Exclude<VoteKind, 'cheer' | 'cup_match' | 'cup_win'>
  id: string
  target: string
  title: string
  options: PollOption[]
  share?: PollShare
}

const UNKNOWN = '-'

export default function VotePoll({ kind, id, target, title, options, share }: Props) {
  const { stats, vote } = usePersonStats(id)
  const marker = useMarker(kind, target)
  const [localChosen, setChosen] = useState<string | null>(null)
  const [localVoted, setVoted] = useState(false)
  const [thanks, setThanks] = useState(false)
  const [already, setAlready] = useState(false)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const [limited, setLimited] = useState(false)

  const voted = localVoted || marker !== null
  const markerChoice = marker !== null && options.some((o) => o.key === marker) ? marker : null
  const chosen = localChosen ?? markerChoice

  const shareText = share && chosen ? share.text[chosen] : undefined
  const { busy: shareBusy, notice, share: doShare } = useResultShare(
    share && shareText
      ? { testName: 'people', title: '운명을 읽다 · 삼국지 인물열전', text: shareText, url: share.url, imageUrl: share.imageUrl }
      : null,
  )

  async function pick(option: string) {
    if (busy || voted) return
    setBusy(true)
    setFailed(false)
    setLimited(false)
    track('people_vote', { result_id: `${kind}_${id}` })
    const r = await vote(kind, target, option)
    setBusy(false)
    if (r === 'limited') {
      setLimited(true)
    } else if (r) {
      writeMarker(kind, target, r.counted ? option : UNKNOWN)
      setVoted(true)
      setAlready(!r.counted)
      if (r.counted) setChosen(option)
    } else if (!navigator.onLine) {
      setFailed(true)
    } else {
      // 기록이 꺼져 있거나 일시 오류: 고른 항목만 보여 주고 숫자는 숨긴다
      setVoted(true)
      setThanks(true)
      setChosen(option)
    }
  }

  const counts = stats ? Object.fromEntries(options.map((o) => [o.key, stats[kind][o.key] ?? 0])) : null
  const view = counts ? ratioView(counts) : null
  const headCount = counts ? Object.values(counts).reduce((s, n) => s + n, 0) : 0

  return (
    <div className="bg-white rounded-[22px] border border-line px-5 py-5">
      <h2 className="font-serif font-bold text-lg break-keep">{title}</h2>
      <ul className="mt-3 space-y-2">
        {options.map((o) => {
          const mine = chosen === o.key
          const pct = voted && view?.show ? view.pct[o.key] : null
          return (
            <li key={o.key}>
              <button
                type="button"
                onClick={() => pick(o.key)}
                disabled={busy || voted}
                aria-pressed={voted ? mine : undefined}
                className={`relative w-full min-h-[48px] overflow-hidden rounded-2xl border px-4 py-2.5 text-left text-sm leading-snug ${
                  mine ? 'border-ink' : 'border-line'
                } bg-white disabled:cursor-default`}
              >
                {pct !== null && (
                  <span
                    aria-hidden="true"
                    className={`absolute inset-y-0 left-0 ${mine ? 'bg-accent/25' : 'bg-card-2'}`}
                    style={{ width: `${pct}%` }}
                  />
                )}
                <span className="relative flex items-center justify-between gap-3">
                  <span className="break-keep">
                    {o.label}
                    {o.note && <span className="ml-1.5 text-[11px] text-muted">{o.note}</span>}
                  </span>
                  {pct !== null && <span className="flex-none font-medium">{pct}%</span>}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      {voted && (
        <p className="mt-3 text-sm text-muted" aria-live="polite">
          {thanks ? '고마워요' : already ? '오늘 투표가 반영됐어요' : '투표했어요'}
          {headCount > 0 && view && !view.show && ` · ${headCountText(headCount)}`}
        </p>
      )}
      {limited && <p className="mt-3 text-sm text-muted">{LIMITED_TEXT}</p>}
      {failed && <p className="mt-3 text-sm text-muted">연결을 확인하고 다시 눌러 주세요</p>}
      {voted && share && shareText && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => void doShare()}
            disabled={shareBusy}
            className="h-[52px] w-full rounded-full bg-accent text-white font-medium px-4 disabled:opacity-70"
          >
            친구에게 공유하기
          </button>
          {notice && <p className="mt-2 text-sm text-muted">{notice}</p>}
        </div>
      )}
    </div>
  )
}
