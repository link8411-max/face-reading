import { describe, it, expect } from 'vitest'
import { pushUiState, type PushEnv } from '@/lib/push/client'

const base: PushEnv = {
  ua: 'Mozilla/5.0 (Linux; Android 14) Chrome/130', hasPush: true, hasSw: true, publicKey: 'BKEY',
  permission: 'default', standalone: false, maxTouchPoints: 5, subscribed: false,
}
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/605.1'
const IPAD_DESKTOP = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1'

describe('pushUiState', () => {
  it('off / on', () => {
    expect(pushUiState(base)).toBe('off')
    expect(pushUiState({ ...base, subscribed: true })).toBe('on')
  })
  it('denied', () => expect(pushUiState({ ...base, permission: 'denied' })).toBe('denied'))
  it('unsupported: no push, no sw, no key', () => {
    expect(pushUiState({ ...base, hasPush: false })).toBe('unsupported')
    expect(pushUiState({ ...base, hasSw: false })).toBe('unsupported')
    expect(pushUiState({ ...base, publicKey: null })).toBe('unsupported')
  })
  it('ios_install: iOS safari has no PushManager and is not installed', () => {
    expect(pushUiState({ ...base, ua: IPHONE, hasPush: false })).toBe('ios_install')
  })
  it('iPad Macintosh + touch points is iOS', () => {
    expect(pushUiState({ ...base, ua: IPAD_DESKTOP, maxTouchPoints: 5, hasPush: false })).toBe('ios_install')
    expect(pushUiState({ ...base, ua: IPAD_DESKTOP, maxTouchPoints: 0, hasPush: false })).toBe('unsupported')
  })
  it('installed iOS proceeds to later checks', () => {
    expect(pushUiState({ ...base, ua: IPHONE, standalone: true })).toBe('off')
    expect(pushUiState({ ...base, ua: IPHONE, standalone: true, permission: 'denied' })).toBe('denied')
  })
  it('kakao wins over everything', () => {
    const ua = IPHONE + ' KAKAOTALK 10.0'
    expect(pushUiState({ ...base, ua, hasPush: false, permission: 'denied' })).toBe('kakao')
  })
})
