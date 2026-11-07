import { renderToStaticMarkup } from 'react-dom/server'
import SajuResultView from '@/components/saju/SajuResultView'
import { computeSaju, type SajuResult } from '@/lib/saju/engine'
import { SOURCE_LINE, BASIS_COPY, TEN_GOD_COPY } from '@/content/saju'

const run = (o: Partial<Parameters<typeof computeSaju>[0]> = {}): SajuResult => {
  const r = computeSaju({ year: 1990, month: 5, day: 15, hourSlot: 'mi', isLunar: false, isLeapMonth: false, gender: '남', asOfYear: 2027, ...o })
  if (!r.ok) throw new Error(r.reason)
  return r
}
const html = (r: SajuResult, birthLine?: string) => renderToStaticMarkup(<SajuResultView result={r} birthLine={birthLine} />)

test('1990-05-15 미시 남: 네 기둥·일간·십신·대운·세운·근거가 나온다', () => {
  const r = run()
  const h = html(r, '1990년 5월 15일생 · 양력')
  for (const t of ['>庚<', '>午<', '계미', '나는', '만 7세부터', '2027 정미년과 나', '어떻게 계산했나요', SOURCE_LINE]) expect(h).toContain(t)
  for (const g of r.tenGods.top) expect(h).toContain(TEN_GOD_COPY[g].easy)
  // 십신은 둘만, 시주 열은 "모름"이 아님
  expect(h).not.toContain('모름')
  // 생년월일 줄과 조심할 점은 캡처에서 빠진다
  expect(h).toMatch(/class="no-screenshot[^"]*"[^>]*>1990년 5월 15일생/)
  expect(h).toMatch(/no-screenshot[^>]*>\s*<h3[^>]*>조심할 점/)
})

test('시간 모름: 모름 열과 안내 문구', () => {
  const h = html(run({ hourSlot: null }))
  expect(h).toContain('모름')
  expect(h).toContain(BASIS_COPY.hourUnknown.replace(/·/g, '·'))
})

test('절입 당일 시간 모름: 경고 문구', () => {
  const r = run({ year: 2027, month: 2, day: 4, hourSlot: null })
  const w = r.basis.boundaryWarning!
  expect(w.kind).toBe('jeolip')
  expect(html(r)).toContain(BASIS_COPY.boundaryJeolip(w.at, w.alt))
})

test('서머타임 해만 서머타임 줄', () => {
  expect(html(run({ year: 1988, month: 7, day: 1 }))).toContain('서머타임')
  expect(html(run())).not.toContain('서머타임을 반영했어요')
})
