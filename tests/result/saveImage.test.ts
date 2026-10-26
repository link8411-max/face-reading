import { saveMethod, isInAppBrowser, externalOpenUrl } from '@/lib/saveImage'

const KAKAO_ANDROID = 'Mozilla/5.0 (Linux; Android 14; SM-S918N Build/UP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0 Mobile Safari/537.36 KAKAOTALK/10.9.0'
const INSTA_ANDROID = 'Mozilla/5.0 (Linux; Android 13; wv) AppleWebKit/537.36 Chrome/129.0 Mobile Safari/537.36 Instagram 350.0.0.0 Android'
const NAVER_ANDROID = 'Mozilla/5.0 (Linux; Android 13; wv) AppleWebKit/537.36 Chrome/129.0 Mobile Safari/537.36 NAVER(inapp; search; 2000; 12.6.0)'
const CHROME_ANDROID = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36'

// 카카오톡(안드로이드) 인앱에서 blob 다운로드가 "지원하지 않는 파일 형식"으로 실패하던 문제
test('인앱 브라우저는 기기와 상관없이 길게 눌러 저장 화면을 쓴다', () => {
  for (const ua of [KAKAO_ANDROID, INSTA_ANDROID, NAVER_ANDROID]) {
    expect(isInAppBrowser(ua), ua).toBe(true)
    expect(saveMethod(ua), ua).toBe('modal')
  }
  expect(isInAppBrowser(CHROME_ANDROID)).toBe(false)
  expect(saveMethod(CHROME_ANDROID)).toBe('download')
})

test('카카오톡이면 외부 브라우저로 여는 주소를 준다, 그 밖에는 없음', () => {
  expect(externalOpenUrl(KAKAO_ANDROID, 'https://unse-ai.com/animal')).toBe('kakaotalk://web/openExternal?url=https%3A%2F%2Funse-ai.com%2Fanimal')
  expect(externalOpenUrl(INSTA_ANDROID, 'https://unse-ai.com/animal')).toBeNull()
  expect(externalOpenUrl(CHROME_ANDROID, 'https://unse-ai.com/animal')).toBeNull()
})
