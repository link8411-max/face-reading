// MediaPipe FaceLandmarker(478점) 랜드마크 → 연속 얼굴 특징
// 모든 특징은 비율/각도라서 얼굴 크기·위치에 불변이고, 두 눈을 수평으로 맞춰 기울기(roll)에도 불변이다.
// 랜드마크로 실제 측정되는 부위만 쓴다 (귀, 눈썹 굵기 등 추정값 없음).

export interface Landmark { x: number; y: number; z?: number }

export const FEATURE_KEYS = [
  'eyeAspect', 'eyeTilt', 'eyeWidth', 'eyeSpacing', 'browGap', 'browTilt',
  'noseLength', 'noseWidth', 'mouthWidth', 'lipFullness', 'mouthCornerLift',
  'faceAspect', 'jawWidth', 'chinLength', 'midfaceRatio',
] as const
export type FeatureKey = typeof FEATURE_KEYS[number]
export type FeatureVector = Record<FeatureKey, number>

// MediaPipe 메시 인덱스 (이미지 기준 왼쪽 눈 = L, 오른쪽 눈 = R)
const IDX = {
  eyeOuterL: 33, eyeInnerL: 133, eyeInnerR: 362, eyeOuterR: 263,
  eyeTopL: 159, eyeBottomL: 145, eyeTopR: 386, eyeBottomR: 374,
  browOuterL: 70, browMidL: 105, browInnerL: 107,
  browOuterR: 300, browMidR: 334, browInnerR: 336,
  nasion: 168, noseTip: 1, alarL: 129, alarR: 358,
  mouthL: 61, mouthR: 291, upperLipTop: 0, upperLipInner: 13, lowerLipInner: 14, lowerLipBottom: 17,
  foreheadTop: 10, chin: 152, faceEdgeL: 234, faceEdgeR: 454, jawL: 172, jawR: 397,
} as const

type P = [number, number]

const dist = (a: P, b: P) => Math.hypot(a[0] - b[0], a[1] - b[1])
const mid = (a: P, b: P): P => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]

// 두 눈 중심이 수평이 되도록 회전한 좌표를 돌려준다
function aligned(lm: Landmark[]): (i: number) => P {
  const eyeL = mid([lm[IDX.eyeOuterL].x, lm[IDX.eyeOuterL].y], [lm[IDX.eyeInnerL].x, lm[IDX.eyeInnerL].y])
  const eyeR = mid([lm[IDX.eyeOuterR].x, lm[IDX.eyeOuterR].y], [lm[IDX.eyeInnerR].x, lm[IDX.eyeInnerR].y])
  const angle = Math.atan2(eyeR[1] - eyeL[1], eyeR[0] - eyeL[0])
  const c = Math.cos(-angle), s = Math.sin(-angle)
  return (i) => {
    const x = lm[i].x - eyeL[0], y = lm[i].y - eyeL[1]
    return [x * c - y * s, x * s + y * c]
  }
}

// 바깥쪽이 위로 올라가면 양수 (y는 아래로 증가)
const outwardTiltDeg = (inner: P, outer: P) =>
  (Math.atan2(inner[1] - outer[1], Math.abs(outer[0] - inner[0])) * 180) / Math.PI

export function extractFeatures(lm: Landmark[]): FeatureVector {
  const p = aligned(lm)
  const eyeCL = mid(p(IDX.eyeOuterL), p(IDX.eyeInnerL))
  const eyeCR = mid(p(IDX.eyeOuterR), p(IDX.eyeInnerR))
  const iod = dist(eyeCL, eyeCR)
  const faceH = dist(p(IDX.foreheadTop), p(IDX.chin))
  const faceW = dist(p(IDX.faceEdgeL), p(IDX.faceEdgeR))

  const eyeWL = dist(p(IDX.eyeOuterL), p(IDX.eyeInnerL))
  const eyeWR = dist(p(IDX.eyeOuterR), p(IDX.eyeInnerR))
  const eyeHL = dist(p(IDX.eyeTopL), p(IDX.eyeBottomL))
  const eyeHR = dist(p(IDX.eyeTopR), p(IDX.eyeBottomR))

  const mouthW = dist(p(IDX.mouthL), p(IDX.mouthR))
  const lipCenterY = (p(IDX.upperLipInner)[1] + p(IDX.lowerLipInner)[1]) / 2
  const cornerY = (p(IDX.mouthL)[1] + p(IDX.mouthR)[1]) / 2

  return {
    eyeAspect: (eyeHL / eyeWL + eyeHR / eyeWR) / 2,
    eyeTilt: (outwardTiltDeg(p(IDX.eyeInnerL), p(IDX.eyeOuterL)) + outwardTiltDeg(p(IDX.eyeInnerR), p(IDX.eyeOuterR))) / 2,
    eyeWidth: (eyeWL + eyeWR) / 2 / iod,
    eyeSpacing: dist(p(IDX.eyeInnerL), p(IDX.eyeInnerR)) / faceW,
    browGap: (dist(p(IDX.browMidL), p(IDX.eyeTopL)) + dist(p(IDX.browMidR), p(IDX.eyeTopR))) / 2 / iod,
    browTilt: (outwardTiltDeg(p(IDX.browInnerL), p(IDX.browOuterL)) + outwardTiltDeg(p(IDX.browInnerR), p(IDX.browOuterR))) / 2,
    noseLength: dist(p(IDX.nasion), p(IDX.noseTip)) / faceH,
    noseWidth: dist(p(IDX.alarL), p(IDX.alarR)) / iod,
    mouthWidth: mouthW / iod,
    lipFullness: (dist(p(IDX.upperLipTop), p(IDX.upperLipInner)) + dist(p(IDX.lowerLipInner), p(IDX.lowerLipBottom))) / mouthW,
    mouthCornerLift: (lipCenterY - cornerY) / mouthW,
    faceAspect: faceH / faceW,
    jawWidth: dist(p(IDX.jawL), p(IDX.jawR)) / faceW,
    chinLength: dist(p(IDX.lowerLipBottom), p(IDX.chin)) / faceH,
    midfaceRatio: dist(mid(p(IDX.browMidL), p(IDX.browMidR)), p(IDX.noseTip)) / faceH,
  }
}

export const FRONTAL_YAW_LIMIT = 0.15

// 코끝이 좌우 얼굴 가장자리 사이 어디에 있는지로 고개 돌림(yaw)을 근사
export function checkFrontal(lm: Landmark[]): { ok: boolean; yawRatio: number } {
  const p = aligned(lm)
  const l = p(IDX.faceEdgeL)[0], r = p(IDX.faceEdgeR)[0]
  const ratio = (p(IDX.noseTip)[0] - l) / (r - l)
  const yawRatio = Math.abs(ratio - 0.5)
  // 0.15: 실측 30장에서 고개를 확실히 돌린 사진(0.2 이상)만 거르고, 돌린 각도가 클수록 커지는 비율 왜곡은 줄인다. 0.12는 평범한 셀카도 1/3을 거부했다.
  return { ok: yawRatio <= FRONTAL_YAW_LIMIT, yawRatio }
}
