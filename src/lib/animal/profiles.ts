import type { CharacterProfile } from '@/lib/samguk/profiles'

// 동물상 8종의 얼굴 프로필 (z 단위, 삼국지 프로필과 같은 의미: 0 = 같은 성별 평균, ±1 = 흔한 차이)
// 근거: 널리 쓰이는 동물상 통념(강아지상 = 둥글고 순한 눈, 고양이상 = 올라간 눈꼬리 등)을 MediaPipe로 재는 비율 특징으로 옮겼다.
export const animalProfiles: Record<string, CharacterProfile> = {
  // 강아지: 둥글고 큰 눈, 순하게 내려간 눈꼬리, 동그란 얼굴, 웃는 입꼬리
  dog: { z: { eyeAspect: 1.0, eyeTilt: -1.0, faceAspect: -0.6, mouthCornerLift: 0.6 }, weight: { eyeTilt: 1.5 } },
  // 고양이: 올라간 눈꼬리, 갸름한 턱, 또렷한 턱 끝
  cat: { z: { eyeTilt: 1.3, eyeAspect: -0.2, jawWidth: -0.8, chinLength: 0.4 }, weight: { eyeTilt: 1.5 } },
  // 여우: 가늘고 긴 눈, 올라간 눈꼬리, 긴 얼굴, 좁은 턱
  fox: { z: { eyeAspect: -1.2, eyeTilt: 1.0, faceAspect: 0.8, jawWidth: -1.0 }, weight: { eyeAspect: 1.5 } },
  // 곰: 넓고 각진 턱, 넓적한 얼굴, 작은 눈매, 넉넉한 코
  bear: { z: { jawWidth: 1.2, faceAspect: -1.0, eyeAspect: -0.5, noseWidth: 0.8 }, weight: { jawWidth: 1.5 } },
  // 토끼: 동그랗고 큰 눈, 긴 눈매, 작은 입, 짧은 중안부
  rabbit: { z: { eyeAspect: 1.3, eyeWidth: 0.6, mouthWidth: -0.8, midfaceRatio: -0.6 }, weight: { eyeAspect: 1.5 } },
  // 사슴: 길고 맑은 눈, 갸름하고 긴 얼굴, 시원한 미간
  deer: { z: { eyeWidth: 1.1, eyeAspect: 0.7, faceAspect: 0.9, eyeSpacing: 0.6 } , weight: {} },
  // 호랑이: 눈에 붙은 강한 눈썹, 치켜올라간 눈썹, 다부진 턱, 매서운 눈
  tiger: { z: { browGap: -1.1, browTilt: 1.0, jawWidth: 0.7, eyeAspect: -0.6 }, weight: {} },
  // 독수리: 길게 뻗은 콧대, 좁고 오똑한 코, 강렬한 눈썹, 좁은 미간
  eagle: { z: { noseLength: 1.2, noseWidth: -0.8, browGap: -0.6, eyeSpacing: -0.6 }, weight: {} },
}
