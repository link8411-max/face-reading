import { withPhoto, withGender } from '@/lib/faceMatch/slot'

const analyzed = { gender: '여' as const, image: 'data:a', animal: 'cat' as const, character: { id: 'liubei' }, error: '얼굴을 찾지 못했어요' }

// 리뷰 Important: 사진이나 성별을 바꾸면 이전 분석 결과(동물상·장수)와 오류를 지워 다시 분석하게 한다
test('사진을 바꾸면 이전 결과와 오류가 지워진다', () => {
  const s = withPhoto(analyzed, 'data:b')
  expect(s).toMatchObject({ image: 'data:b', animal: null, character: null, error: null, gender: '여' })
})

test('성별을 바꾸면 이전 결과와 오류가 지워진다 (장수 후보가 성별로 갈리므로)', () => {
  expect(withGender(analyzed, '남')).toMatchObject({ gender: '남', animal: null, character: null, error: null, image: 'data:a' })
})

test('같은 성별을 다시 눌러도 결과는 그대로', () => {
  expect(withGender(analyzed, '여')).toBe(analyzed)
})
