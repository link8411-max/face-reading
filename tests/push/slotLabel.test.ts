import { describe, test, expect } from 'vitest'
import { formatSlot, nextDeliveryWord } from '@/lib/push/slotLabel'

describe('slotLabel', () => {
  test('formatSlot', () => {
    expect(formatSlot('05:00')).toBe('아침 5시'); expect(formatSlot('08:30')).toBe('아침 8시 30분'); expect(formatSlot('10:30')).toBe('아침 10시 30분')
    expect(formatSlot('11:00')).toBe('낮 11시'); expect(formatSlot('12:00')).toBe('낮 12시'); expect(formatSlot('13:30')).toBe('낮 1시 30분')
    expect(formatSlot('14:00')).toBe('오후 2시'); expect(formatSlot('17:30')).toBe('오후 5시 30분')
    expect(formatSlot('18:00')).toBe('저녁 6시'); expect(formatSlot('20:30')).toBe('저녁 8시 30분')
    expect(formatSlot('21:00')).toBe('밤 9시'); expect(formatSlot('23:30')).toBe('밤 11시 30분')
  })
  test('nextDeliveryWord는 KST', () => {
    const now = new Date('2026-11-05T00:00:00Z') // KST 09:00
    expect(nextDeliveryWord('08:30', now)).toBe('내일'); expect(nextDeliveryWord('09:00', now)).toBe('내일'); expect(nextDeliveryWord('09:30', now)).toBe('오늘')
  })
})
