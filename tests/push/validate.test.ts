import { isAllowedEndpoint, isGanji, parseSubscribeBody } from '@/lib/push/validate'
test('허용 호스트', () => {
  for (const u of ['https://fcm.googleapis.com/fcm/send/abc', 'https://updates.push.services.mozilla.com/wpush/v2/x', 'https://web.push.apple.com/QW', 'https://db5p.notify.windows.com/w/?token=1', 'https://kr-sea.push.samsungosp.com/x']) expect(isAllowedEndpoint(u)).toBe(true)
  for (const u of ['http://fcm.googleapis.com/x', 'https://evil.example/x', 'https://fcm.googleapis.com.evil.example/x', 'https://' + 'a'.repeat(2100)]) expect(isAllowedEndpoint(u)).toBe(false)
})
test('ganji·본문', () => {
  expect(isGanji('경오')).toBe(true); expect(isGanji('갑축')).toBe(false); expect(isGanji(12)).toBe(false)
  expect(parseSubscribeBody({ endpoint: 'https://web.push.apple.com/a', keys: { p256dh: 'k', auth: 'a' }, ganji: '경오' })).toEqual({ endpoint: 'https://web.push.apple.com/a', keys: { p256dh: 'k', auth: 'a' }, ganji: '경오' })
  expect(parseSubscribeBody({ endpoint: 'https://web.push.apple.com/a', keys: { p256dh: '', auth: 'a' }, ganji: '경오' })).toBeNull()
  expect(parseSubscribeBody({ endpoint: 'https://evil.example/a', keys: { p256dh: 'k', auth: 'a' }, ganji: '경오' })).toBeNull()
})
