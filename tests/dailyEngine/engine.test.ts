import { dailyFortune, 별점계산 } from '@/lib/dailyEngine'
import { 육십갑자 } from '@/lib/dailyEngine/relations'
import { 띠동물 } from '@/lib/saju'

const D = new Date('2026-11-05T03:00:00+09:00')   // 계미일

test('년생 모드: 1990 경오년 말띠, 오늘 계미일', () => {
  const f = dailyFortune({ kind: '년생', year: 1990, isEarlyYear: false }, D)
  expect(f.날짜).toBe('2026-11-05')
  expect(f.일진).toEqual({ 천간: '계', 지지: '미', 표기: '계미일' })
  expect(f.나).toMatchObject({ 띠: '말', 지지: '오', 천간: '경', 년주표기: '경오' })
  expect(f.관계).toEqual({ 천간: '식상', 지지: '육합', 오행: null })   // 금생수(내가 베풂), 오미합
  expect(f.점수).toBe(2.0); expect(f.별점).toBe(4)
  expect(f.한마디).toBe('말이 예쁘게 나가는 날이에요. 고백도, 제안도 오늘이에요.')
  expect(f.근거).toBe('당신의 경(금)과 오늘의 계(수)은 당신이 오늘에게 베풀어요(금생수), 오(말)와 미는 서로 끌어당겨요(오미합).')
  expect(f.영역.연애).toEqual({ 상태: '좋음', 문장: '마음이 잘 통해요. 먼저 말 거는 쪽이 이겨요.' })
  expect(f.영역.건강).toEqual({ 상태: '좋음', 문장: '몸이 가벼워요.' })
  expect(f.행운).toEqual({ 색: '노랑', 색오행: '토', 시간: '오후 1~3시(미시)', 방향: '중앙(가까운 곳)' })
})

test('입춘 전 체크는 전년 년주', () => {
  expect(dailyFortune({ kind: '년생', year: 1990, isEarlyYear: true }, D).나).toMatchObject({ 띠: '뱀', 년주표기: '기사' })
})

test('띠 모드: 천간 없이 오행 관계로 보완', () => {
  const f = dailyFortune({ kind: '띠', 띠: '말' }, D)
  expect(f.나.천간).toBeNull()
  expect(f.관계).toEqual({ 천간: null, 지지: '육합', 오행: '관살' })   // 계(수)가 화를 극함
  expect(f.점수).toBe(1.0); expect(f.별점).toBe(4)
  expect(f.근거).toContain('수극화')
  expect(() => dailyFortune({ kind: '띠', 띠: '고래' }, D)).toThrow('모르는 띠')
})

test('결정성과 KST 자정 경계', () => {
  const a = dailyFortune({ kind: '년생', year: 1985, isEarlyYear: false }, D)
  expect(dailyFortune({ kind: '년생', year: 1985, isEarlyYear: false }, D)).toEqual(a)
  const before = dailyFortune({ kind: '띠', 띠: '쥐' }, new Date('2026-11-05T14:59:00Z'))
  const after = dailyFortune({ kind: '띠', 띠: '쥐' }, new Date('2026-11-05T15:00:00Z'))
  expect(before.날짜).toBe('2026-11-05'); expect(after.날짜).toBe('2026-11-06')
  expect(after.일진.표기).toBe('갑신일')
})

test('별점 경계', () => {
  expect([-2.5, -2.0, -1.5, -1.0, -0.5, 0.9, 1.0, 2.4, 2.5].map(별점계산)).toEqual([1, 1, 2, 2, 3, 3, 4, 4, 5])
})

const pct = (n: Record<number, number>, total: number) => Object.fromEntries(Object.entries(n).map(([k, v]) => [k, Math.round((v / total) * 1000) / 10]))
const close = (a: Record<string, number>, b: Record<string, number>) => { for (const k of Object.keys(b)) expect(Math.abs((a[k] ?? 0) - b[k]), k).toBeLessThanOrEqual(0.5) }

test('년생 60×60 전수: 빈 문구 없음, 분포는 설계값', () => {
  // 일진 60개를 얻기 위해 2026-11-05부터 60일을 돈다
  const n: Record<number, number> = {}
  for (let i = 0; i < 60; i++) {
    const day = new Date(D.getTime() + i * 86400000)
    for (const g of 육십갑자) {
      // 년주가 g인 양력 연도: 1984년이 갑자. 1984 + index
      const year = 1984 + 육십갑자.indexOf(g)
      const f = dailyFortune({ kind: '년생', year, isEarlyYear: false }, day)
      expect(f.나.년주표기).toBe(g.천간 + g.지지)
      const text = JSON.stringify(f)
      expect(text).not.toContain('undefined'); expect(text).not.toContain('""')
      n[f.별점] = (n[f.별점] ?? 0) + 1
    }
  }
  close(pct(n, 3600), { 1: 6.4, 2: 18.2, 3: 38.7, 4: 28.5, 5: 8.2 })
})

test('띠 12×60 전수: 빈 문구 없음, 분포는 설계값', () => {
  const n: Record<number, number> = {}
  for (let i = 0; i < 60; i++) {
    const day = new Date(D.getTime() + i * 86400000)
    for (const 띠 of 띠동물) {
      const f = dailyFortune({ kind: '띠', 띠 }, day)
      expect(JSON.stringify(f)).not.toContain('undefined')
      n[f.별점] = (n[f.별점] ?? 0) + 1
    }
  }
  close(pct(n, 720), { 1: 5.3, 2: 22.5, 3: 41.4, 4: 23.3, 5: 7.5 })
})
