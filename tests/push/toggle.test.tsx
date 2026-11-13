import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'

const read = (p: string) => readFileSync(p, 'utf8')
const toggle = read('src/components/fortune/PushToggle.tsx')
const page = read('src/app/(ko)/fortune/daily/page.tsx')

describe('PushToggle 소스', () => {
  it('page: no-screenshot 영역 안·SeasonPicks 위', () => {
    const iToggle = page.indexOf('<PushToggle')
    expect(iToggle).toBeGreaterThan(0)
    expect(page.indexOf('<div className="no-screenshot flex flex-col">')).toBeLessThan(iToggle)
    expect(iToggle).toBeLessThan(page.indexOf('<SeasonPicks'))
    expect(toggle).toContain('no-screenshot')
  })
  it('스펙 문구', () => {
    for (const s of [
      '카카오톡 안에서는 알림을 켤 수 없어요.',
      '다른 브라우저로 열기',
      '아이폰은 홈 화면에 추가한 앱에서만 알림을 받을 수 있어요.',
      '알림이 차단돼 있어요. 브라우저 설정에서 unse-ai.com 알림을 허용하면 받을 수 있어요.',
      '아침 운세 알림 끄기',
      '이 년주로 바꿔 받기',
      '알림을 켰어요. ',
      '에 처음 와요',
      ' 받고 있어요',
      'euro(formatSlot(sendAt))',
      '알림 시각을 바꿨어요. 매일 ',
      '받는 년주를 바꿨어요. 매일 ',
      '먼저 이 년주로 바꿔 받기를 눌러 주세요',
      'aria-label="알림 시각"',
      'formatSlot(',
      'subscribe(ganji, ',
      '지금은 등록이 안 돼요. 잠시 뒤 다시 눌러 주세요',
    ]) expect(toggle).toContain(s)
  })
  it('sw.js·privacy에 알림 시각', () => {
    expect(read('public/sw.js')).toContain('sendAt')
    expect(read('src/app/(ko)/privacy/page.tsx')).toContain('알림 시각')
  })
  it('시각 변경: 구독된 년주 사용·실패 시 복구', () => {
    expect(toggle).toContain('subscribe(stored ?? ganji, value)')
    expect(toggle).toContain('setSendAt(prev)')
    expect(toggle).toContain('slotLocked')
    expect(toggle).toContain('먼저 이 년주로 바꿔 받기를 눌러 주세요')
  })
  it('requestPermission은 마운트 효과에서 호출하지 않는다', () => {
    expect(toggle).not.toMatch(/useEffect\(\s*\(\)\s*=>\s*\{[^]*?requestPermission[^]*?\}\s*,\s*\[/)
    expect(toggle).not.toContain('requestPermission')
    expect(read('src/lib/push/client.ts')).toContain('requestPermission')
  })
  it('마운트 효과: 안내 상태를 먼저 정하고 구독 조회는 3초 제한', () => {
    expect(toggle.indexOf('pushUiState(')).toBeGreaterThan(0)
    expect(toggle.indexOf('pushUiState(')).toBeLessThan(toggle.indexOf('getSubscription('))
    expect(toggle).toContain('3000')
    expect(toggle).toContain('Promise.race')
  })
  it('privacy·analytics', () => {
    expect(read('src/app/(ko)/privacy/page.tsx')).toContain('아침 운세 알림을 켜면 브라우저가 발급한 푸시 주소와 키, 선택한 년주(태어난 해의 60갑자)와 알림 시각만 저장합니다. 생년·이름·기기 정보는 저장하지 않으며, 알림 끄기를 누르거나 브라우저에서 알림을 차단하면 자동으로 삭제됩니다.')
    const a = read('src/lib/analytics.ts')
    for (const e of ['push_subscribe:', 'push_unsubscribe:', 'push_blocked:']) expect(a).toContain(e)
  })
})
