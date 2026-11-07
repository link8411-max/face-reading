import type { Gender } from '@/lib/face/featureStats'

// 사진에서 성별을 기기 안에서만 추정해 "미리 고르기"에 쓴다. 추정값은 어디로도 보내거나 기록하지 않는다.
export const GUESS_MIN_PROB = 0.6
export const GUESS_TIMEOUT_MS = 4000 // 추론만(모델 로드 제외). 늦게 와도 사용자가 고른 값은 덮지 않으므로 넉넉히

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

/** 페이지에 들어오면 미리 받아 둔다(첫 추정이 모델 다운로드 때문에 제한 시간을 넘기지 않게). 실패는 조용히 무시 */
export function preloadGenderModels(): void {
  if (typeof window === 'undefined') return
  loadModels().catch(() => {})
}

async function defaultDetect(img: HTMLImageElement, faceapi: Awaited<ReturnType<typeof loadModels>>): Promise<RawGuess | null> {
  const r = await faceapi
    .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
    .withAgeAndGender()
  return r ? { gender: r.gender as 'male' | 'female', probability: r.genderProbability } : null
}

export async function guessGender(
  img: HTMLImageElement,
  deps?: { detect?: () => Promise<RawGuess | null>; now?: () => number },
): Promise<Gender | null> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    // 모델 로드는 제한 시간에 넣지 않는다(한 번만 받고 캐시됨). 추론만 1.5초 안에 끝나야 한다
    const detect: () => Promise<RawGuess | null> = deps?.detect ?? (await loadModels().then((f) => () => defaultDetect(img, f)))
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
