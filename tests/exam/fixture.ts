import type { Question, Round } from '@/lib/exam/types'

// 화면 테스트용 가짜 회차: 0번 뜻 고르기, 1번 O/X, 2번 레트로, 3번 대화, 4번 뜻 고르기. 정답은 늘 첫 보기.
export function q(n: number, i: number): Question {
  const base = {
    term: `말${n}${i}`, kind: 'word' as const, when: '2026' as const, badge: '2026년', level: 1 as const,
    explain: { meaning: `뜻 ${n}-${i}`, usage: `쓰임 ${n}-${i}`, origin: `유래 ${n}-${i}` },
  }
  if (i === 1) return { ...base, kind: 'story', type: 'ox', ask: '맞으면 O, 틀리면 X', show: `'말${n}${i}' — 어떤 뜻`, options: ['O', 'X'], answer: 0 }
  if (i === 3)
    return {
      ...base, kind: 'story', type: 'skit', ask: '', options: ['정답A', '오답B', '오답C', '오답D'], answer: 0,
      skit: {
        form: 'blank',
        lines: [{ who: '지수', text: '뭐 해?' }, { who: '나', text: `나 완전 ____ 됐어` }],
        options: ['정답A', '오답B', '오답C', '오답D'], answer: 0, right: '맞는 반응', wrong: '틀린 반응', timeout: '재촉 반응',
      },
    }
  return { ...base, when: i === 2 ? '1990s' : '2026', badge: i === 2 ? '90년대 레트로' : '2026년', type: 'meaning', ask: `질문 ${n}-${i}`, options: ['정답A', '오답B', '오답C', '오답D'], answer: 0 }
}
export const rounds: Round[] = [1, 2, 3, 4, 5].map((n) => ({ round: n, questions: [0, 1, 2, 3, 4].map((i) => q(n, i)) }))
