'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { track } from '@/lib/analytics'
import { kstDate, onDayMaybeChanged } from '@/lib/kst'
import type { Shared } from '@/lib/exam/link'
import { loadReport, saveReport, streak as loadStreak, type Report } from '@/lib/exam/memory'
import { pickRound, roundDateLabel, roundNumberFor } from '@/lib/exam/rounds'
import { grade as gradeOf, timeLimitMs, total, type Answer } from '@/lib/exam/score'
import type { Round } from '@/lib/exam/types'
import Explain from './Explain'
import { enterMs, useReducedMotion } from './motion'
import QuestionCard, { type OptionState } from './QuestionCard'
import ReportCard from './ReportCard'
import SkitCard from './SkitCard'
import TimerBar from './TimerBar'

type Phase = 'boot' | 'start' | 'question' | 'explain' | 'grading' | 'report'

interface Play {
  round: Round
  /** 시작하는 순간의 오늘 회차(자정을 넘겨도 그대로). 저장 여부를 정할 때만 쓴다 */
  todayAtStart: number | null
}

export default function ExamGame({ rounds, challenge = null }: { rounds: Round[]; challenge?: Shared | null }) {
  const reduced = useReducedMotion()
  const [phase, setPhase] = useState<Phase>(challenge ? 'start' : 'boot')
  const [today, setToday] = useState<number | null>(null) // 오늘 회차 번호(마운트 뒤에 계산: 정적 HTML의 어제 방지)
  const [play, setPlay] = useState<Play | null>(null)
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [picks, setPicks] = useState<(number | null)[]>([])
  const [hintUsed, setHintUsed] = useState(false)
  const [hintNow, setHintNow] = useState(false)
  const [revealed, setRevealed] = useState(0)
  const [result, setResult] = useState<{ report: Report; round: Round; streak: number } | null>(null)

  const answeredRef = useRef(false)
  const startRef = useRef(0)
  const idleRef = useRef(true)
  // 시작 전이거나 저장된 성적표를 보는 중이면 날짜가 바뀔 때 맞춘다(진행 중인 판은 건드리지 않는다)
  useEffect(() => { idleRef.current = phase === 'boot' || phase === 'start' || (phase === 'report' && !play) }, [phase, play])

  // 보여 줄 회차: 도전장이면 그 회차, 아니면 오늘 회차(범위를 넘으면 마지막 회차)
  const viewRound: Round | null = challenge
    ? (rounds[challenge.round - 1] ?? null)
    : today !== null ? pickRound(rounds, today) : null

  // 마운트 뒤 날짜 계산. 탭이 자정을 넘겨 다시 보이면 시작 전 화면만 오늘로 맞춘다
  useEffect(() => {
    const sync = () => {
      if (!idleRef.current) return // 진행 중인 판은 시작한 회차로 끝까지 간다
      const n = roundNumberFor(kstDate(new Date()))
      setToday(n)
      const r = pickRound(rounds, n)
      const rep = loadReport(r.round)
      setPhase(rep && !challenge ? 'report' : 'start')
      if (rep && !challenge) setResult({ report: rep, round: r, streak: loadStreak() })
    }
    sync()
    return onDayMaybeChanged(sync)
  }, [rounds, challenge])

  // 시간: 문제 화면이 그려진 뒤부터 센다. 시간이 다 되면 오답으로 한 번만 기록한다
  const record = useCallback((choice: number | null) => {
    if (answeredRef.current || !play) return
    answeredRef.current = true
    const q = play.round.questions[idx]
    // 등장 연출 중에 누르면 아직 시간이 안 흐른 것으로 친다
    const limitMs = timeLimitMs(q)
    const msLeft = choice === null ? 0 : Math.min(limitMs, limitMs - (performance.now() - startRef.current))
    setAnswers((a) => [...a, { correct: choice === q.answer, msLeft, hint: hintNow, limitMs }])
    setPicks((p) => [...p, choice])
    setPhase('explain')
  }, [play, idx, hintNow])
  const reducedRef = useRef(reduced)
  const playRef = useRef(play)
  useEffect(() => { reducedRef.current = reduced; playRef.current = play }, [reduced, play])
  const recordRef = useRef(record)
  useEffect(() => { recordRef.current = record }, [record])

  useEffect(() => {
    if (phase !== 'question') return
    answeredRef.current = false
    // 시간은 문제 등장 연출이 끝난 뒤부터 센다
    const delay = reducedRef.current || !playRef.current ? 0 : enterMs(playRef.current.round.questions[idx])
    startRef.current = performance.now() + delay
    const t = setTimeout(() => recordRef.current(null), delay + (playRef.current ? timeLimitMs(playRef.current.round.questions[idx]) : 10_000))
    return () => clearTimeout(t)
  }, [phase, idx])

  const begin = () => {
    const round = viewRound
    if (!round) return
    track('exam_start', { test_name: 'exam', result_id: 'meme' })
    setPlay({ round, todayAtStart: roundNumberFor(kstDate(new Date())) })
    setIdx(0)
    setAnswers([])
    setPicks([])
    setHintUsed(false)
    setHintNow(false)
    setPhase('question')
  }

  const finish = () => {
    if (!play) return
    const t = total(answers)
    const g = gradeOf(t.correct, t.bonus)
    const report: Report = {
      round: play.round.round,
      marks: answers.map((a) => (a.correct ? 'O' : 'X')).join(''),
      score: t.score,
      correct: t.correct,
      grade: g,
      hint: answers.some((a) => a.hint),
      ms: Math.round(answers.reduce((s, a) => s + (a.limitMs - Math.max(0, a.msLeft)), 0)),
    }
    // 도전장으로 푼 판은 오늘 회차와 같고 아직 안 풀었을 때만 오늘 성적표로 남긴다
    const saveIt = !challenge || (challenge.round === play.todayAtStart && !loadReport(report.round))
    if (saveIt) saveReport(report)
    setResult({ report, round: play.round, streak: loadStreak() })
    setRevealed(0)
    setPhase(reduced ? 'report' : 'grading')
  }

  const next = () => {
    if (!play) return
    if (idx + 1 >= play.round.questions.length) { finish(); return }
    setIdx(idx + 1)
    setHintNow(false)
    setPhase('question')
  }

  // 채점 연출 2초(건너뛰기 가능)
  useEffect(() => {
    if (phase !== 'grading') return
    const show = setInterval(() => setRevealed((n) => Math.min(5, n + 1)), 350)
    const done = setTimeout(() => setPhase('report'), 2000)
    return () => { clearInterval(show); clearTimeout(done) }
  }, [phase])

  // 해설을 보느라 내려간 화면을, 다음 문제·채점·성적표로 넘어갈 때 맨 위로 올린다.
  // 안 올리면 '성적표 보기'를 누른 사람이 푸터를 보게 되고 도장이 찍히는 장면을 놓친다.
  const firstScroll = useRef(true)
  useEffect(() => {
    if (firstScroll.current) { firstScroll.current = false; return }
    if (phase === 'question' || phase === 'grading' || phase === 'report') window.scrollTo?.({ top: 0 })
  }, [phase, idx])

  const endTracked = useRef(false)
  useEffect(() => {
    if (phase !== 'report' || !result || endTracked.current) return
    if (!play) return // 저장된 성적표를 다시 보는 것은 끝난 것이 아니다
    endTracked.current = true
    track('exam_end', { test_name: 'exam', result_id: `meme_g${result.report.grade}` })
  }, [phase, result, play])

  if (phase === 'boot' || !viewRound) {
    return <div className="mt-6 min-h-[240px]" aria-busy="true" />
  }

  if (phase === 'start') {
    return (
      <section className="ex-rise-lg mt-6 rounded-[30px] bg-card px-6 pt-7 pb-6 text-center">
        <p className="text-sm font-medium text-accent">{viewRound.round}회차 · {roundDateLabel(viewRound.round)}</p>
        {challenge && <p className="ex-emph mt-3 font-serif text-[19px] font-bold break-keep">친구는 {challenge.grade}등급. 이길 수 있어요?</p>}
        <h2 className="mt-3 font-serif text-[26px] font-bold leading-[1.35]">5문제, 2분이면 끝나요</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted break-keep">문제마다 시간이 정해져 있어요. 힌트는 한 판에 한 번 쓸 수 있어요.</p>
        <button type="button" onClick={begin} className="mt-6 flex h-[52px] w-full items-center justify-center rounded-full bg-ink text-base font-medium text-paper">
          시험 시작
        </button>
      </section>
    )
  }

  if (phase === 'report' && result) {
    return <ReportCard round={result.round} report={result.report} streak={result.streak} challenge={challenge} />
  }

  if (phase === 'grading') {
    const marks = result?.report.marks ?? ''
    return (
      <section className="mt-6 rounded-[30px] bg-card px-6 pt-8 pb-6 text-center" aria-live="polite">
        <h2 className="font-serif text-[22px] font-bold">채점 중이에요</h2>
        <div className="mt-5 flex justify-center gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={`${i}-${i < revealed}`} className={`${i < revealed ? 'ex-flip ' : ''}flex h-12 w-12 items-center justify-center rounded-xl border text-lg font-bold ${i < revealed ? (marks[i] === 'O' ? 'border-ink bg-ink text-paper' : 'border-line bg-card-2 text-muted') : 'border-line bg-card-2 text-card-2'}`}>
              {i < revealed ? marks[i] : '-'}
            </span>
          ))}
        </div>
        <button type="button" onClick={() => setPhase('report')} className="mt-6 flex h-11 w-full items-center justify-center rounded-full border border-line bg-card-2 text-sm font-medium">
          건너뛰기
        </button>
      </section>
    )
  }

  // 문제·해설
  if (!play) return null
  const q = play.round.questions[idx]
  const answered = phase === 'explain'
  const selected = answered ? picks[idx] ?? null : null
  const timedOut = answered && picks[idx] === null
  const correct = answered && answers[idx]?.correct === true
  const wrongs = q.options.map((_, i) => i).filter((i) => i !== q.answer)
  // 힌트: 오답 3개 중 2개를 흐리게(남길 하나는 회차·문제 번호로 정해 같은 판은 같게)
  const keep = wrongs[(play.round.round + idx) % wrongs.length]
  const dim = new Set(hintNow && q.options.length === 4 ? wrongs.filter((i) => i !== keep) : [])
  const state: OptionState = { selected, answered, answer: q.answer, dim, onPick: (i) => record(i) }
  const canHint = !answered && !hintUsed && q.options.length === 4
  const useHint = () => { if (!canHint) return; setHintUsed(true); setHintNow(true) }

  return (
    <section className="mt-5" aria-label="문제">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-bold tabular-nums">{idx + 1} / {play.round.questions.length}</p>
        <span key={idx} className="ex-rise rounded-full bg-card px-3 py-1 text-xs text-muted">{q.badge}</span>
      </div>
      {(!answered || timedOut) && <TimerBar key={`${play.round.round}-${idx}`} limitMs={timeLimitMs(q)} delayMs={reduced ? 0 : enterMs(q)} reduced={reduced} timedOut={timedOut} />}
      <div key={idx} className="mt-4">
        {q.type === 'skit' ? <SkitCard q={q} state={state} timedOut={timedOut} /> : <QuestionCard q={q} state={state} />}
      </div>
      {!answered && (
        <button type="button" onClick={useHint} disabled={!canHint} className="mt-4 flex h-11 w-full items-center justify-center rounded-full border border-line bg-card-2 text-sm font-medium disabled:opacity-40">
          힌트 쓰기
        </button>
      )}
      {answered && <Explain q={q} correct={correct} timedOut={timedOut} isLast={idx + 1 >= play.round.questions.length} onNext={next} />}
    </section>
  )
}
