// 사진 한 장 → 성별 기준 얼굴 z 점수. 동물상·삼국지·얼굴 궁합·우리 팀 삼국지가 함께 쓴다.
// 사진은 브라우저 안에서만 분석한다(서버로 보내지 않음). 실패하면 이유를 돌려주고, 화면은 그 칸에만 안내한다.
import { checkFrontal, extractFeatures, type Landmark } from './landmarkFeatures'
import { toZ, type Gender, type ZVector } from './featureStats'

export type PhotoFail = 'tool' | 'noface' | 'frontal' | 'read'
export type PhotoResult = { ok: true; z: ZVector } | { ok: false; reason: PhotoFail }

export const REASON_TEXT: Record<PhotoFail, string> = {
  tool: '분석 도구를 불러오지 못했어요. 인터넷 연결을 확인하고 새로고침해 주세요.',
  noface: '얼굴을 찾지 못했어요. 얼굴이 잘 보이는 사진을 올려 주세요.',
  frontal: '정면 사진을 올려 주세요. 고개를 돌린 사진은 얼굴을 비교하기 어려워요.',
  read: '사진을 읽지 못했어요. JPG나 PNG 사진으로 다시 올려 주세요.',
}

export function analyzeLandmarks(lm: Landmark[] | null, gender: Gender): PhotoResult {
  if (!lm) return { ok: false, reason: 'noface' }
  if (!checkFrontal(lm).ok) return { ok: false, reason: 'frontal' }
  return { ok: true, z: toZ(extractFeatures(lm), gender) }
}

// 브라우저 전용: 사진(dataURL) → 압축 → 디코드 → MediaPipe 랜드마크 → 판정
export async function analyzePhoto(dataUrl: string, gender: Gender): Promise<PhotoResult> {
  let img: HTMLImageElement
  try {
    const { compressImage } = await import('@/lib/compressImage')
    img = new Image()
    img.src = await compressImage(dataUrl)
    await img.decode()
  } catch {
    return { ok: false, reason: 'read' }
  }
  let lm: Landmark[] | null
  try {
    const { detectLandmarks } = await import('./mediapipe')
    lm = await detectLandmarks(img)
  } catch {
    return { ok: false, reason: 'tool' }
  }
  return analyzeLandmarks(lm, gender)
}
