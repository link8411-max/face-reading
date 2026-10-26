import { kakaoFeed, KAKAO_JS_KEY, isKakaoInApp } from '@/lib/kakao'

test('JavaScript 키(공개 값)', () => {
  expect(KAKAO_JS_KEY).toMatch(/^[0-9a-f]{32}$/)
})

test('카카오톡 인앱 판별', () => {
  expect(isKakaoInApp('Mozilla/5.0 (Linux; Android 14; wv) Chrome/129.0 Mobile Safari/537.36 KAKAOTALK/10.9.0')).toBe(true)
  expect(isKakaoInApp('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) KAKAOTALK 10.9.0')).toBe(true)
  expect(isKakaoInApp('Mozilla/5.0 (Linux; Android 14) Chrome/129.0 Mobile Safari/537.36')).toBe(false)
})

test('카카오톡 공유 카드: 1인칭 문구·결과 이미지·결과 링크·나도 해보기 버튼', () => {
  const t = kakaoFeed({
    title: '운명을 읽다 · 동물상 테스트',
    text: '나는 고양이상 87% 나왔어. 너는 무슨 상이야?',
    url: 'https://unse-ai.com/animal/r/cat?s=87&utm_source=share',
    imageUrl: 'https://unse-ai.com/api/og/result?kind=animal&key=cat&s=87',
  })
  expect(t.objectType).toBe('feed')
  expect(t.content.title).toBe('나는 고양이상 87% 나왔어. 너는 무슨 상이야?')
  expect(t.content.imageUrl).toBe('https://unse-ai.com/api/og/result?kind=animal&key=cat&s=87')
  expect(t.content.imageWidth).toBe(1200)
  expect(t.content.imageHeight).toBe(630)
  expect(t.content.link).toEqual({ mobileWebUrl: 'https://unse-ai.com/animal/r/cat?s=87&utm_source=share', webUrl: 'https://unse-ai.com/animal/r/cat?s=87&utm_source=share' })
  expect(t.buttons).toEqual([{ title: '나도 해보기', link: t.content.link }])
})
