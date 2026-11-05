import { isAllowedEndpoint, isGanji, isSendAt, parseSubscribeBody, SEND_SLOTS } from '@/lib/push/validate'
test('허용 호스트', () => {
  for (const u of ['https://fcm.googleapis.com/fcm/send/abc', 'https://updates.push.services.mozilla.com/wpush/v2/x', 'https://web.push.apple.com/QW', 'https://db5p.notify.windows.com/w/?token=1', 'https://kr-sea.push.samsungosp.com/x']) expect(isAllowedEndpoint(u)).toBe(true)
  for (const u of ['http://fcm.googleapis.com/x', 'https://evil.example/x', 'https://fcm.googleapis.com.evil.example/x', 'https://evil-fcm.googleapis.com/x', 'https://push.services.mozilla.com/x', 'https://user:pw@fcm.googleapis.com/x', 'https://fcm.googleapis.com:8443/x', 'https://' + 'a'.repeat(2100)]) expect(isAllowedEndpoint(u)).toBe(false)
})
test('ganji·본문', () => {
  expect(isGanji('경오')).toBe(true); expect(isGanji('갑축')).toBe(false); expect(isGanji(12)).toBe(false)
  expect(parseSubscribeBody({ endpoint: 'https://web.push.apple.com/a', keys: { p256dh: 'k', auth: 'a' }, ganji: '경오' })).toEqual({ endpoint: 'https://web.push.apple.com/a', keys: { p256dh: 'k', auth: 'a' }, ganji: '경오', sendAt: '08:30' })
  expect(parseSubscribeBody({ endpoint: 'https://web.push.apple.com/a', keys: { p256dh: '', auth: 'a' }, ganji: '경오' })).toBeNull()
  expect(parseSubscribeBody({ endpoint: 'https://evil.example/a', keys: { p256dh: 'k', auth: 'a' }, ganji: '경오' })).toBeNull()
})
test('sendAt 30분 슬롯', () => {
  expect(SEND_SLOTS).toHaveLength(38); expect(SEND_SLOTS[0]).toBe('05:00'); expect(SEND_SLOTS[37]).toBe('23:30')
  for (const s of ['05:00', '08:30', '23:30']) expect(isSendAt(s)).toBe(true)
  for (const s of ['04:30', '08:15', '24:00', '8:30', 830, undefined]) expect(isSendAt(s)).toBe(false)
  expect(parseSubscribeBody({ endpoint: 'https://web.push.apple.com/a', keys: { p256dh: 'k', auth: 'a' }, ganji: '경오' })?.sendAt).toBe('08:30')
  expect(parseSubscribeBody({ endpoint: 'https://web.push.apple.com/a', keys: { p256dh: 'k', auth: 'a' }, ganji: '경오', sendAt: '21:00' })?.sendAt).toBe('21:00')
  expect(parseSubscribeBody({ endpoint: 'https://web.push.apple.com/a', keys: { p256dh: 'k', auth: 'a' }, ganji: '경오', sendAt: '08:15' })).toBeNull()
})
