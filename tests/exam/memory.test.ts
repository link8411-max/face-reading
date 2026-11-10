// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { loadReport, saveReport, streak, type Report } from '@/lib/exam/memory'
import { breakStorageAccess, installStorage, restoreStorage, type MemStorage } from './storageStub'

const rep = (round: number): Report => ({ round, marks: 'OXOOX', score: 345, correct: 3, grade: 5, hint: false, ms: 30000 })

let store: MemStorage
beforeEach(() => { store = installStorage() })
afterEach(() => { vi.restoreAllMocks(); restoreStorage() })

test('저장하고 다시 읽는다', () => {
  expect(loadReport(3)).toBeNull()
  saveReport(rep(3))
  expect(loadReport(3)).toEqual(rep(3))
  expect(loadReport(4)).toBeNull()
})

test('저장소가 없어도 던지지 않는다', () => {
  vi.spyOn(store, 'getItem').mockImplementation(() => { throw new Error('denied') })
  vi.spyOn(store, 'setItem').mockImplementation(() => { throw new Error('denied') })
  expect(() => saveReport(rep(3))).not.toThrow()
  expect(loadReport(3)).toBeNull()
  expect(streak()).toBe(0)
})

test('저장소 접근 자체가 던져도 던지지 않는다', () => {
  breakStorageAccess()
  expect(() => saveReport(rep(3))).not.toThrow()
  expect(loadReport(3)).toBeNull()
  expect(streak()).toBe(0)
})

test('깨진 값은 없는 것으로 본다', () => {
  store.setItem('exam-meme-v1', '{not json')
  expect(loadReport(1)).toBeNull()
  store.setItem('exam-meme-v1', JSON.stringify({ reports: { 1: { round: 1, marks: 'ZZZ' } } }))
  expect(loadReport(1)).toBeNull()
  expect(() => saveReport(rep(2))).not.toThrow()
  expect(loadReport(2)).toEqual(rep(2))
})

test('연속 응시', () => {
  saveReport(rep(3))
  expect(streak()).toBe(1)
  saveReport(rep(4))
  expect(streak()).toBe(2)
  saveReport(rep(6))
  expect(streak()).toBe(1)
})

test('같은 회차를 다시 저장해도 연속이 늘지 않는다', () => {
  saveReport(rep(3))
  saveReport(rep(4))
  saveReport(rep(4))
  expect(streak()).toBe(2)
})
