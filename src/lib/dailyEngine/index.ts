import { 년주계산, 일주계산, 지지, 지지오행, 천간오행, 띠동물, 띠이모지 } from '@/lib/saju'
import { kstDate } from '@/lib/kst'
import { 오행관계판정, 지지관계판정, 천간관계판정 } from './relations'
import type { 오행관계, 지지관계, 천간관계 } from './relations'
import {
  영역목록, 영역문장, 영역보강, 오행근거, 지지근거, 천간근거, 한마디, 띠한마디,
} from '@/content/dailyFortuneText'
import type { 상태, 영역 } from '@/content/dailyFortuneText'

export type DailyInput = { kind: '년생'; year: number; isEarlyYear: boolean } | { kind: '띠'; 띠: string }

export interface DailyFortune {
  날짜: string
  일진: { 천간: string; 지지: string; 표기: string }
  나: { 띠: string; 띠이모지: string; 지지: string; 천간: string | null; 년주표기: string | null }
  별점: 1 | 2 | 3 | 4 | 5
  점수: number
  관계: { 천간: 천간관계 | null; 지지: 지지관계; 오행: 오행관계 | null }
  한마디: string
  근거: string
  영역: Record<영역, { 상태: 상태; 문장: string }>
  행운: { 색: string; 색오행: string; 시간: string; 방향: string }
}

export const 별점계산 = (점수: number): 1 | 2 | 3 | 4 | 5 => {
  if (점수 <= -2) return 1
  if (점수 <= -1) return 2
  if (점수 < 1) return 3
  if (점수 < 2.5) return 4
  return 5
}

const 상태순서: 상태[] = ['조심', '보통', '좋음']
const 기본상태: Record<지지관계, 상태> = { 육합: '좋음', 삼합: '좋음', 무관: '보통', 복음: '보통', 형: '조심', 충: '조심' }

const 색: Record<string, string> = { 목: '초록', 화: '빨강', 토: '노랑', 금: '하양', 수: '검정' }
const 방향: Record<string, string> = { 목: '동쪽', 화: '남쪽', 토: '중앙(가까운 곳)', 금: '서쪽', 수: '북쪽' }

const 생: Record<string, string> = { 목: '화', 화: '토', 토: '금', 금: '수', 수: '목' }
const 극: Record<string, string> = { 목: '토', 토: '수', 수: '화', 화: '금', 금: '목' }

const 육합상대: Record<string, string> = {
  자: '축', 축: '자', 인: '해', 해: '인', 묘: '술', 술: '묘', 진: '유', 유: '진', 사: '신', 신: '사', 오: '미', 미: '오',
}
const 시간대: Record<string, string> = {
  자: '밤 11시~새벽 1시(자시)', 축: '새벽 1~3시(축시)', 인: '새벽 3~5시(인시)', 묘: '아침 5~7시(묘시)',
  진: '아침 7~9시(진시)', 사: '오전 9~11시(사시)', 오: '낮 11시~1시(오시)', 미: '오후 1~3시(미시)',
  신: '오후 3~5시(신시)', 유: '저녁 5~7시(유시)', 술: '저녁 7~9시(술시)', 해: '밤 9~11시(해시)',
}

function 행운색오행(A: string, B: string, 별점: number): string {
  if (별점 >= 4) return B
  if (A === B) return Object.keys(생).find((k) => 생[k] === A)!
  if (극[A] === B || 극[B] === A) {
    const X = Object.keys(생).find((x) => (생[A] === x && 생[x] === B) || (생[B] === x && 생[x] === A))
    if (X) return X
  }
  return B
}

export function dailyFortune(input: DailyInput, now: Date = new Date()): DailyFortune {
  let 내지지: string
  let 내천간: string | null = null
  let 띠: string
  let 이모지: string
  let 년주표기: string | null = null
  if (input.kind === '년생') {
    const j = 년주계산(input.year, input.isEarlyYear ? 1 : 3, 1)
    내지지 = j.지지; 내천간 = j.천간; 띠 = j.띠; 이모지 = j.띠이모지; 년주표기 = j.천간 + j.지지
  } else {
    const i = (띠동물 as readonly string[]).indexOf(input.띠)
    if (i < 0) throw new Error('모르는 띠: ' + input.띠)
    띠 = input.띠; 내지지 = 지지[i]; 이모지 = 띠이모지[i]
  }

  const 날짜 = kstDate(now)
  const [y, m, d] = 날짜.split('-').map(Number)
  const 일 = 일주계산(y, m, d)
  const 내오행 = 지지오행[내지지]
  const 일지오행 = 지지오행[일.지지]
  const 일간오행 = 천간오행[일.천간]

  const 지지판정 = 지지관계판정(내지지, 일.지지)
  let 천간판정: ReturnType<typeof 천간관계판정> | null = null
  let 오행판정: ReturnType<typeof 오행관계판정> | null = null
  let 첫근거: string
  let 한마디문장: string
  if (내천간) {
    천간판정 = 천간관계판정(내천간, 일.천간)
    첫근거 = 천간근거[천간판정.관계]({ 내천간, 내오행: 천간오행[내천간], 일간: 일.천간, 일간오행 })
    한마디문장 = 한마디[천간판정.관계][지지판정.관계]
  } else {
    오행판정 = 오행관계판정(내오행, 일간오행)
    첫근거 = 오행근거[오행판정.관계]({ 띠, 띠오행: 내오행, 일간: 일.천간, 일간오행 })
    한마디문장 = 띠한마디[지지판정.관계]
  }
  const 점수 = (천간판정 ?? 오행판정)!.점수 + 지지판정.점수
  const 별점 = 별점계산(점수)
  const 근거 = 첫근거 + ', ' + 지지근거[지지판정.관계]({ 내지지, 띠, 일지: 일.지지 }) + '.'

  const 보강 = 영역보강[(천간판정 ?? 오행판정)!.관계]
  const 영역결과 = {} as Record<영역, { 상태: 상태; 문장: string }>
  for (const 영 of 영역목록) {
    let 상태값 = 기본상태[지지판정.관계]
    let 문장 = 영역문장[영][상태값]
    if (보강.영역 === 영) {
      const idx = Math.min(2, Math.max(0, 상태순서.indexOf(상태값) + 보강.방향))
      상태값 = 상태순서[idx]
      문장 = 문장 + ' ' + 보강.문장
    }
    영역결과[영] = { 상태: 상태값, 문장 }
  }

  const 색오행 = 행운색오행(내오행, 일지오행, 별점)
  return {
    날짜,
    일진: { 천간: 일.천간, 지지: 일.지지, 표기: 일.천간 + 일.지지 + '일' },
    나: { 띠, 띠이모지: 이모지, 지지: 내지지, 천간: 내천간, 년주표기 },
    별점,
    점수,
    관계: { 천간: 천간판정?.관계 ?? null, 지지: 지지판정.관계, 오행: 오행판정?.관계 ?? null },
    한마디: 한마디문장,
    근거,
    영역: 영역결과,
    행운: { 색: 색[색오행], 색오행, 시간: 시간대[육합상대[내지지]], 방향: 방향[색오행] },
  }
}
