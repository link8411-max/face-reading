import { cupName, cupOgImageUrl, cupPhrase, cupSharePath, cupShareUrl } from '@/lib/cup/share'

test('공유 경로·링크·미리보기 이미지·문구', () => {
  expect(cupSharePath('warrior', 'guanyu')).toBe('/samguk/cup/r/warrior/guanyu')
  expect(cupShareUrl('warrior', 'guanyu')).toBe('https://unse-ai.com/samguk/cup/r/warrior/guanyu?utm_source=share&utm_medium=friend_link&utm_campaign=cup')
  expect(cupOgImageUrl('women', 'diaochan')).toBe('https://unse-ai.com/api/og/result?kind=cup&board=women&key=diaochan')
  expect(cupPhrase('관우')).toBe('나의 최애 장수는 관우. 너는?')
})

test('월드컵 이름은 삼국지를 한 번만 붙인다', () => {
  expect(cupName('최강 무장')).toBe('삼국지 최강 무장 월드컵')
  expect(cupName('삼국지 여인')).toBe('삼국지 여인 월드컵')
})

test('parseCupShare: 판 후보에 든 인물만, 나머지는 null', async () => {
  const { parseCupShare } = await import('@/lib/cup/shareLanding')
  const { boardPool } = await import('@/lib/cup/boards')
  const ok = parseCupShare('warrior', 'lvbu')
  expect(ok).toEqual({ board: 'warrior', id: 'lvbu', name: '여포', image: '/images/samguk/여포.jpg', phrase: '나의 최애 장수는 여포. 너는?' })
  expect(parseCupShare('warrior', 'zhugeliang')).toBeNull()
  expect(parseCupShare('x', 'lvbu')).toBeNull()
  expect(parseCupShare('random', '__proto__')).toBeNull()
  expect(parseCupShare('__proto__', 'lvbu')).toBeNull()
  for (const id of boardPool('women')) expect(parseCupShare('women', id)?.id).toBe(id)
  // 초상화 대기 인물은 어느 판에서도 받지 않는다
  const { PENDING_PORTRAIT_IDS } = await import('@/lib/samgukDB')
  for (const id of PENDING_PORTRAIT_IDS) expect(parseCupShare('random', id)).toBeNull()
})
