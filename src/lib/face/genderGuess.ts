import type { Gender } from '@/lib/face/featureStats'

// 사진에서 성별을 기기 안에서만 추정해 "미리 고르기"에 쓴다. 추정값은 어디로도 보내거나 기록하지 않는다.
export const GUESS_MIN_PROB = 0.6
export const GUESS_TIMEOUT_MS = 1500

export type RawGuess = { gender: 'male' | 'female'; probability: number }

export function pickGender(p: RawGuess | null): Gender | null {
  if (!p || !(p.probability >= GUESS_MIN_PROB)) return null
  if (p.gender === 'male') return '남'
  if (p.gender === 'female') return '여'
  return null
}

let modelsPromise: Promise<typeof import('@vladmandic/face-api')> | null = null

function loadModels() {
  if (!modelsPromise) {
    modelsPromise = (async () => {
      const faceapi = await import('@vladmandic/face-api')
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.ageGenderNet.loadFromUri('/models'),
      ])
      return faceapi
    })()
    modelsPromise.catch(() => {
      modelsPromise = null // 실패하면 다음에 다시 시도
    })
  }
  return modelsPromise
}

async function defaultDetect(img: HTMLImageElement): Promise<RawGuess | null> {
  const faceapi = await loadModels()
  const r = await faceapi
    .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
    .withAgeAndGender()
  return r ? { gender: r.gender as 'male' | 'female', probability: r.genderProbability } : null
}

export async function guessGender(
  img: HTMLImageElement,
  deps?: { detect?: () => Promise<RawGuess | null>; now?: () => number },
): Promise<Gender | null> {
  const detect = deps?.detect ?? (() => defaultDetect(img))
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const timeout = new Promise<null>((resolve) => {
      timer = setTimeout(() => resolve(null), GUESS_TIMEOUT_MS)
    })
    return pickGender(await Promise.race([detect(), timeout]))
  } catch {
    return null
  } finally {
    if (timer !== undefined) clearTimeout(timer)
  }
}
