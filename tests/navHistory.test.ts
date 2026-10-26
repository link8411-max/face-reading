import { recordPathVisit, canGoBackInApp } from '@/lib/navHistory'

test('첫 페이지만 본 상태에서는 뒤로 갈 수 없고, 사이트 안에서 한 번 이동하면 갈 수 있다', () => {
  expect(canGoBackInApp()).toBe(false)
  recordPathVisit()
  expect(canGoBackInApp()).toBe(false)
  recordPathVisit()
  expect(canGoBackInApp()).toBe(true)
})
