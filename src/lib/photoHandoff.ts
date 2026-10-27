// 결과 화면의 "같은 사진으로 바로 보기": 다음 사진 테스트로 사진을 넘긴다.
// 화면 이동(클라이언트 내비게이션) 동안 메모리에만 잠깐 들고 있고, 받는 쪽이 꺼내면 바로 지운다.
// 브라우저 저장소에는 넣지 않는다(사진은 저장하지 않는다는 약속). 새로고침하면 사라진다.
let held: string | null = null

export function handOffPhoto(image: string) {
  held = image
}

export function takeHandedPhoto(): string | null {
  const image = held
  held = null
  return image
}
