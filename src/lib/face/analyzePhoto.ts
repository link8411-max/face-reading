// 사진 한 장 → 성별 기준 얼굴 z 점수. 동물상·삼국지·얼굴 궁합·우리 팀 삼국지가 함께 쓴다.
// 사진은 브라우저 안에서만 분석한다(서버로 보내지 않음). 실패하면 이유를 돌려주고, 화면은 그 칸에만 안내한다.
import { checkFrontal, extractFeatures, FRONTAL_YAW_LIMIT, type Landmark } from './landmarkFeatures'
import { toZ, type Gender, type ZVector } from './featureStats'

export type PhotoFail = 'tool' | 'noface' | 'frontal' | 'read'
/** 실패: reason은 GA photo_fail로도 나간다. frontal은 yaw(고개 돌린 정도, 0=정면)와 방향을 함께 준다 */
export type PhotoFailure = { ok: false; reason: PhotoFail; yaw?: number; turnedTo?: '왼쪽' | '오른쪽' }
export type PhotoResult = { ok: true; z: ZVector } | PhotoFailure

export const REASON_TEXT: Record<PhotoFail, string> = {
  tool: '분석 도구를 불러오지 못했어요. 인터넷 연결을 확인하고 새로고침해 주세요. 카카오톡·인스타 안 브라우저라면 크롬이나 사파리로 열어 보세요.',
  noface: '얼굴을 찾지 못했어요. 얼굴이 사진의 3분의 1 이상 차지하게 가까이에서, 밝은 곳에서 찍은 사진이 좋아요. 마스크·선글라스·그림체가 강한 일러스트는 인식이 어려워요.',
  frontal: '정면 사진을 올려 주세요. 고개를 돌린 사진은 얼굴을 비교하기 어려워요.',
  read: '사진을 읽지 못했어요. JPG나 PNG 사진으로 다시 올려 주세요.',
}

/** 왜 실패했는지 그 사진 기준으로 구체적으로. 고개 돌림은 방향과 정도(기준 대비)를 숫자로 보여 준다 */
export function failText(f: PhotoFailure): string {
  if (f.reason === 'frontal' && f.yaw !== undefined) {
    const got = Math.round(f.yaw * 100), limit = Math.round(FRONTAL_YAW_LIMIT * 100)
    const dir = f.turnedTo ? `${f.turnedTo}으로 ` : ''
    return `고개가 ${dir}돌아가 있어요(돌아간 정도 ${got}, ${limit} 이하여야 해요). 카메라를 똑바로 보고 찍은 사진으로 다시 해 주세요.`
  }
  return REASON_TEXT[f.reason]
}

/**
 * 실패 안내가 "눌렀는데 아무 일도 없다"로 보이지 않게, 분석 시작(t0)부터 최소 ms는 "분석 중…"을 보여 준 뒤 돌아온다.
 * 모델이 이미 올라와 있으면 분석이 0.1초 만에 끝나 같은 문구가 그대로 남아 있는 것처럼 보였다.
 */
export const holdAtLeast = (t0: number, ms = 600) => new Promise<void>((r) => setTimeout(r, Math.max(0, ms - (Date.now() - t0))))

export function analyzeLandmarks(lm: Landmark[] | null, gender: Gender): PhotoResult {
  if (!lm) return { ok: false, reason: 'noface' }
  const fr = checkFrontal(lm)
  if (!fr.ok) return { ok: false, reason: 'frontal', yaw: fr.yawRatio, turnedTo: fr.turnedTo }
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
