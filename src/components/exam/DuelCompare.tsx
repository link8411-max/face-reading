import { duelOutcome, type Shared } from '@/lib/exam/link'

const OUTCOME = { win: '이겼어요', lose: '졌어요', draw: '비겼어요' } as const

function Marks({ label, marks, delay }: { label: string; marks: string; delay: number }) {
  return (
    <div className="ex-rise flex items-center gap-3" style={{ '--d': `${delay}ms` } as React.CSSProperties}>
      <span className="w-8 flex-none text-sm font-bold">{label}</span>
      <ul className="flex flex-1 gap-1.5" aria-label={`${label}의 문제별 결과`}>
        {[...marks].map((m, i) => (
          <li key={i} className={`flex h-9 flex-1 items-center justify-center rounded-lg border text-sm font-bold ${m === 'O' ? 'border-ink bg-ink text-paper' : 'border-line bg-card-2 text-muted'}`}>{m}</li>
        ))}
      </ul>
    </div>
  )
}

// 친구와 비교: 문제별 O·X 두 줄과 한 줄 결과. 점수 차는 쓰지 않는다.
export default function DuelCompare({ mine, theirs, onShare, busy }: { mine: Shared; theirs: Shared; onShare: () => void; busy: boolean }) {
  return (
    <section aria-label="친구와 대결" className="mt-5 rounded-[22px] border border-line bg-card px-5 py-5">
      <div className="space-y-2.5">
        <Marks label="친구" marks={theirs.marks} delay={0} />
        <Marks label="나" marks={mine.marks} delay={250} />
      </div>
      <p className="ex-pop mt-4 text-center font-serif text-[22px] font-bold" style={{ '--d': '600ms' } as React.CSSProperties}>{OUTCOME[duelOutcome(mine, theirs)]}</p>
      {theirs.hint && <p className="mt-1 text-center text-sm text-muted">친구는 힌트를 썼어요</p>}
      <button type="button" onClick={onShare} disabled={busy} className="mt-4 flex h-[52px] w-full items-center justify-center rounded-full bg-ink text-base font-medium text-paper disabled:opacity-60">
        나도 도전장 보내기
      </button>
    </section>
  )
}
