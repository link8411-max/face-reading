'use client'

import GiftNudge from '@/components/bujeok/GiftNudge'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import CoupangBanner from '@/components/CoupangBanner'
import { Icon } from '@/components/icons'
import { useResultShare } from '@/hooks/useResultShare'
import { useScreenshot } from '@/hooks/useScreenshot'
import { examOgImageUrl, examPhrase, examShareUrl, type Shared } from '@/lib/exam/link'
import type { Report } from '@/lib/exam/memory'
import { areaOf, roundDateLabel, type Area } from '@/lib/exam/rounds'
import { GRADE_NAME } from '@/lib/exam/score'
import type { Round } from '@/lib/exam/types'
import DuelCompare from './DuelCompare'

const AREAS: Area[] = ['요즘 말', '상황 밈', '레트로']

/** 영역별 맞힌 수/문제 수. 문제는 회차에서, 정오는 성적표의 marks에서 읽는다. */
export function areaCounts(round: Round, marks: string): Record<Area, { right: number; all: number }> {
  const out: Record<Area, { right: number; all: number }> = { '요즘 말': { right: 0, all: 0 }, '상황 밈': { right: 0, all: 0 }, 레트로: { right: 0, all: 0 } }
  round.questions.forEach((q, i) => {
    const a = out[areaOf(q)]
    a.all++
    if (marks[i] === 'O') a.right++
  })
  return out
}

// 성적통지표: 캡처 한 장으로 완결된다(제목·회차·영역 칸·등급·별명·워터마크).
export function ReportPaper({ round, report, streak, captureRef, settled = false }: { round: Round; report: Report; streak: number; captureRef?: React.Ref<HTMLElement>; settled?: boolean }) {
  const areas = areaCounts(round, report.marks)
  return (
    <article ref={captureRef} className={`${settled ? 'ex-settled ' : ''}relative overflow-hidden rounded-[30px] border border-line bg-card px-[22px] pt-6 pb-5 text-ink`}>
      <p className="text-xs font-medium text-accent">운명을 읽다</p>
      <h2 className="mt-1 font-serif text-[25px] font-bold leading-[1.4] break-keep">밈 능력고사 성적통지표</h2>
      <p className="mt-1 text-sm text-muted">{round.round}회차 · {roundDateLabel(round.round)}</p>

      <table className="mt-4 w-full border-collapse border border-ink text-center">
        <thead>
          <tr>
            {AREAS.map((a) => <th key={a} scope="col" className="border border-ink bg-card-2 px-1 py-2 text-xs font-bold">{a}</th>)}
          </tr>
        </thead>
        <tbody>
          <tr>
            {AREAS.map((a, i) => <td key={a} className="border border-ink px-1 py-2.5 text-lg font-bold tabular-nums"><span className="ex-rise inline-block" style={{ '--d': `${100 + i * 100}ms` } as React.CSSProperties}>{areas[a].right} / {areas[a].all}</span></td>)}
          </tr>
        </tbody>
      </table>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted">종합 등급</p>
          <p className="flex shrink-0 items-start whitespace-nowrap font-serif text-[48px] font-bold leading-none">
            <span className="sr-only">{report.grade}등급</span>
            {/* 9에서 실제 등급까지 숫자가 내려온다. 평소 모습(연출이 끝난 뒤)은 맨 아래 칸 */}
            <span aria-hidden="true" className="inline-block h-[48px] overflow-hidden">
              <span className="ex-grade ex-grade-strip block" style={{ '--n': 9 - report.grade, '--d': '300ms' } as React.CSSProperties}>
                {Array.from({ length: 10 - report.grade }, (_, k) => <span key={k} className="block h-[48px] leading-[48px]">{9 - k}</span>)}
              </span>
            </span>
            <span aria-hidden="true" className="h-[48px] leading-[48px]">등급</span>
          </p>
        </div>
        <p className="ex-stamp rounded-[10px] border-2 border-accent px-3 py-2 text-center font-serif text-[17px] font-bold leading-snug text-accent break-keep" style={{ '--d': '1000ms' } as React.CSSProperties}>{GRADE_NAME[report.grade]}</p>
      </div>

      <div className="mt-4 flex gap-1.5" aria-label="문제별 결과">
        {[...report.marks].map((m, i) => (
          <span key={i} style={{ '--d': `${1150 + i * 70}ms` } as React.CSSProperties} className={`ex-pop flex h-9 flex-1 items-center justify-center rounded-lg border text-sm font-bold ${m === 'O' ? 'border-ink bg-ink text-paper' : 'border-line bg-card-2 text-muted'}`}>{m}</span>
        ))}
      </div>
      <p className="mt-3 text-[15px] font-medium">5문제 중 {report.correct}개</p>
      <div className="mt-1 flex flex-wrap gap-x-3 text-sm text-muted">
        {report.hint && <span>힌트 1회</span>}
        {streak >= 2 && <span>{streak}일 연속</span>}
      </div>
      <p className="mt-4 text-center text-xs text-muted">운명을 읽다 · unse-ai.com</p>
    </article>
  )
}

export default function ReportCard({ round, report, streak, challenge = null }: { round: Round; report: Report; streak: number; challenge?: Shared | null }) {
  const mine: Shared = { round: report.round, marks: report.marks, score: report.score, grade: report.grade, hint: report.hint }
  const { ref, download } = useScreenshot<HTMLElement>()
  const { busy, notice, share } = useResultShare({
    testName: 'exam',
    title: '밈 능력고사 | 운명을 읽다',
    text: examPhrase(report.grade),
    url: examShareUrl(mine),
    imageUrl: examOgImageUrl(report.grade, report.correct),
  })
  const [settled, setSettled] = useState(false)
  useEffect(() => { const t = setTimeout(() => setSettled(true), 2000); return () => clearTimeout(t) }, [])
  // 저장은 연출이 끝난 모습으로 찍는다(도장이 투명한 채 캡처되지 않게)
  const save = async () => {
    setSettled(true)
    await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))
    await download({ fileName: '밈능력고사-성적표' })
  }
  const duel = challenge && challenge.round === report.round ? challenge : null

  return (
    <div className="mt-5">
      {duel && <DuelCompare mine={mine} theirs={duel} onShare={share} busy={busy} />}
      <div className="mt-5">
        <ReportPaper round={round} report={report} streak={streak} captureRef={ref} settled={settled} />
      </div>
      <div className="no-screenshot mt-4 flex flex-col gap-2">
        {!duel && (
          <button type="button" onClick={share} disabled={busy} className="flex h-[52px] items-center justify-center gap-2 rounded-full bg-ink text-[15px] font-medium text-paper disabled:opacity-60">
            <Icon name="share" size={18} />
            친구에게 도전장 보내기
          </button>
        )}
        {notice && <p role="status" className="text-center text-xs text-muted">{notice}</p>}
        <GiftNudge from="exam" />
        <button type="button" onClick={save} className="flex h-12 items-center justify-center gap-1.5 rounded-full border border-line bg-white text-sm font-medium">
          <Icon name="download" size={16} />
          이미지 저장
        </button>
      </div>
      <CoupangBanner subId="exam-meme" />
      <p className="mt-5 text-center text-sm text-muted">내일 문제는 자정에 열려요</p>
      <Link href="/exam/meme/words" className="mt-1 flex h-11 items-center justify-center text-sm text-muted underline underline-offset-4">지난 문제에 나온 말 모아 보기</Link>
      <Link href="/" className="mt-1 flex h-11 items-center justify-center text-[13px] text-muted">다른 테스트 보기</Link>
    </div>
  )
}
