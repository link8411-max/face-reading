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
