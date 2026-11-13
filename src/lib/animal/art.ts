// 동물상 그림 경로(순수 함수). 13종 × 여(f)·남(m) 큰 그림 720×960과 얼굴 240×240.
// 그림은 scripts/make-webtoon-images.mjs가 docs/design/webtoon/originals/v2에서 만든다.
import type { AnimalKey } from '@/lib/animal/matcher'

export type ArtGender = 'f' | 'm'

export function animalArt(key: AnimalKey, gender: ArtGender): { src: string; face: string } {
  return { src: `/images/animal/${key}-${gender}.webp`, face: `/images/animal/${key}-${gender}-face.webp` }
}

// 사용자가 고른 성별(여/남 또는 female/male)과 공유 링크의 g 값을 f|m으로 맞춘다. 모르면 f.
export function artGender(g: unknown): ArtGender {
  return g === 'm' || g === 'male' || g === '남' ? 'm' : 'f'
}
