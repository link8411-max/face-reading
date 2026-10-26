// face-api(68점) 랜드마크 → 관상 특징. 측정(measureFace)과 구간 나누기(classifyFace)를 나눠, 실측 분포로 구간을 점검할 수 있게 한다.
// 브라우저 의존이 없어 단위 테스트로 검사한다.

export interface Point { x: number; y: number }

// 얼굴 특징 타입 정의
export interface FaceFeatures {
  // 이마 (천정 - 초년운)
  forehead: {
    width: 'narrow' | 'medium' | 'wide';      // 좁음/보통/넓음
    height: 'low' | 'medium' | 'high';         // 낮음/보통/높음
    shape: 'flat' | 'rounded' | 'prominent';   // 평평/둥근/돌출
  };

  // 눈
  eyes: {
    size: 'small' | 'medium' | 'large';        // 작음/보통/큼
    shape: 'round' | 'almond' | 'narrow';      // 둥근/아몬드/가늘음
    spacing: 'close' | 'medium' | 'wide';      // 가까움/보통/넓음
    corners: 'down' | 'neutral' | 'up';        // 처짐/평평/올라감
  };

  // 눈썹
  eyebrows: {
    thickness: 'thin' | 'medium' | 'thick';    // 얇음/보통/굵음
    shape: 'straight' | 'arched' | 'angled';   // 일자/둥근/각진
    length: 'short' | 'medium' | 'long';       // 짧음/보통/긴
  };

  // 코 (중정 - 중년운, 재물운)
  nose: {
    size: 'small' | 'medium' | 'large';        // 작음/보통/큼
    bridge: 'low' | 'medium' | 'high';         // 낮음/보통/높음
    tip: 'pointed' | 'round' | 'bulbous';      // 뾰족/둥근/뭉툭
    nostril: 'small' | 'medium' | 'large';     // 작음/보통/큼
  };

  // 입 (하정 - 말년운, 애정운)
  mouth: {
    size: 'small' | 'medium' | 'large';        // 작음/보통/큼
    shape: 'thin' | 'medium' | 'full';         // 얇음/보통/도톰
    corners: 'down' | 'neutral' | 'up';        // 처짐/평평/올라감
  };

  // 턱/얼굴형 (하정 - 말년운)
  chin: {
    shape: 'pointed' | 'round' | 'square';     // 뾰족/둥근/각진
    length: 'short' | 'medium' | 'long';       // 짧음/보통/긴
    width: 'narrow' | 'medium' | 'wide';       // 좁음/보통/넓음
  };

  // 광대뼈 (사회성, 대인운)
  cheekbones: {
    prominence: 'flat' | 'medium' | 'high';    // 평평/보통/돌출
    width: 'narrow' | 'medium' | 'wide';       // 좁음/보통/넓음
  };

  // 귀 (초년운, 지혜)
  ears: {
    size: 'small' | 'medium' | 'large';        // 작음/보통/큼
    position: 'low' | 'medium' | 'high';       // 낮음/보통/높음
    lobe: 'attached' | 'medium' | 'detached';  // 붙음/보통/떨어짐
  };

  // 전체 얼굴형
  faceShape: {
    type: 'oval' | 'round' | 'square' | 'heart' | 'long' | 'diamond';
    symmetry: 'asymmetric' | 'balanced' | 'symmetric';
  };
}

// 구간 판정에 쓰는 원시 측정값 (모두 얼굴 크기에 불변인 비율·각도)
export interface FaceMetrics {
  foreheadHeightR: number
  foreheadShapeR: number
  eyeSizeR: number
  eyeAspect: number
  eyeSpacingR: number
  eyeCornerR: number
  browThicknessR: number
  browAngleR: number
  browLengthR: number
  noseSizeR: number
  noseBridgeR: number
  noseTipR: number
  nostrilR: number
  mouthSizeR: number
  lipR: number
  mouthCornerR: number
  jawAngle: number
  chinLengthR: number
  chinWidthR: number
  cheekR: number
  faceRatio: number
  symmetry: FaceFeatures['faceShape']['symmetry']
}

export function measureFace(landmarks: Point[]): FaceMetrics {
  const faceWidth = Math.abs(landmarks[16].x - landmarks[0].x);
  const faceHeight = Math.abs(landmarks[8].y - landmarks[27].y);
  const leftEye = landmarks.slice(36, 42);
  const rightEye = landmarks.slice(42, 48);
  const eyeDistance = Math.abs(rightEye[0].x - leftEye[3].x);
  const avgEyeWidth = (Math.abs(leftEye[3].x - leftEye[0].x) + Math.abs(rightEye[3].x - rightEye[0].x)) / 2;
  const avgEyeHeight = (Math.abs(leftEye[4].y - leftEye[1].y) + Math.abs(rightEye[4].y - rightEye[1].y)) / 2;
  // 눈꼬리: 눈머리 대비 눈꼬리 높이 (양수 = 올라감)
  const avgCornerDiff = ((landmarks[39].y - landmarks[36].y) + (landmarks[42].y - landmarks[45].y)) / 2;
  const leftBrow = landmarks.slice(17, 22);
  const rightBrow = landmarks.slice(22, 27);
  const browThickness = Math.abs(leftBrow[2].y - leftEye[1].y);
  const browLength = (Math.abs(leftBrow[4].x - leftBrow[0].x) + Math.abs(rightBrow[4].x - rightBrow[0].x)) / 2;
  const avgBrowAngle = ((leftBrow[4].y - leftBrow[2].y) + (rightBrow[4].y - rightBrow[2].y)) / 2;
  const noseBridge = landmarks.slice(27, 31);
  const noseTip = landmarks.slice(31, 36);
  const noseLength = Math.abs(noseTip[2].y - noseBridge[0].y);
  const noseWidth = Math.abs(noseTip[4].x - noseTip[0].x);
  const noseBridgeHeight = Math.abs(noseBridge[3].y - noseBridge[0].y);
  const nostrilWidth = Math.abs(landmarks[35].x - landmarks[31].x);
  const mouth = landmarks.slice(48, 68);
  const mouthWidth = Math.abs(mouth[6].x - mouth[0].x);
  const mouthHeight = Math.abs(mouth[9].y - mouth[3].y);
  const cornerAngle = (mouth[0].y + mouth[6].y) / 2 - mouth[3].y;
  const chinWidth = Math.abs(landmarks[14].x - landmarks[2].x);
  const chinLength = Math.abs(landmarks[8].y - landmarks[27].y);
  // 턱 각진 정도 (라디안): 0→5, 5→8 방향각 차이. 실측 얼굴은 대략 0.3~1.0
  const jawAngle = Math.abs(
    Math.atan2(landmarks[5].y - landmarks[0].y, landmarks[5].x - landmarks[0].x) -
    Math.atan2(landmarks[8].y - landmarks[5].y, landmarks[8].x - landmarks[5].x)
  );
  const foreheadHeight = Math.abs(landmarks[27].y - (leftBrow[2].y + rightBrow[2].y) / 2);
  return {
    foreheadHeightR: foreheadHeight / faceHeight,
    foreheadShapeR: foreheadHeight / faceWidth,
    eyeSizeR: avgEyeWidth / faceWidth,
    eyeAspect: avgEyeHeight / avgEyeWidth,
    eyeSpacingR: eyeDistance / faceWidth,
    eyeCornerR: avgCornerDiff / faceWidth,
    browThicknessR: browThickness / faceHeight,
    browAngleR: avgBrowAngle / faceWidth,
    browLengthR: browLength / faceWidth,
    noseSizeR: noseLength / faceHeight,
    noseBridgeR: noseBridgeHeight / faceHeight,
    noseTipR: noseWidth / noseLength,
    nostrilR: nostrilWidth / noseWidth,
    mouthSizeR: mouthWidth / faceWidth,
    lipR: mouthHeight / mouthWidth,
    mouthCornerR: cornerAngle / faceWidth,
    jawAngle,
    chinLengthR: chinLength / faceHeight,
    chinWidthR: chinWidth / faceWidth,
    cheekR: chinWidth / faceWidth,
    faceRatio: faceHeight / faceWidth,
    symmetry: calculateSymmetry(landmarks),
  };
}

// 구간 경계 [낮음 경계, 높음 경계]
export type Thresholds = Record<Exclude<keyof FaceMetrics, 'symmetry'>, [number, number]>

const tri = <A, B, C>(v: number, [lo, hi]: [number, number], low: A, mid: B, high: C) => (v < lo ? low : v > hi ? high : mid)

export function classifyFace(m: FaceMetrics, t: Thresholds): FaceFeatures {
  const chinShape = tri(m.jawAngle, t.jawAngle, 'square', 'round', 'pointed') as FaceFeatures['chin']['shape'];
  return {
    forehead: {
      width: 'medium',
      height: tri(m.foreheadHeightR, t.foreheadHeightR, 'low', 'medium', 'high'),
      shape: tri(m.foreheadShapeR, t.foreheadShapeR, 'flat', 'rounded', 'prominent'),
    },
    eyes: {
      size: tri(m.eyeSizeR, t.eyeSizeR, 'small', 'medium', 'large'),
      shape: tri(m.eyeAspect, t.eyeAspect, 'narrow', 'almond', 'round'),
      spacing: tri(m.eyeSpacingR, t.eyeSpacingR, 'close', 'medium', 'wide'),
      corners: tri(m.eyeCornerR, t.eyeCornerR, 'down', 'neutral', 'up'),
    },
    eyebrows: {
      thickness: tri(m.browThicknessR, t.browThicknessR, 'thin', 'medium', 'thick'),
      shape: tri(m.browAngleR, t.browAngleR, 'angled', 'straight', 'arched'),
      length: tri(m.browLengthR, t.browLengthR, 'short', 'medium', 'long'),
    },
    nose: {
      size: tri(m.noseSizeR, t.noseSizeR, 'small', 'medium', 'large'),
      bridge: tri(m.noseBridgeR, t.noseBridgeR, 'low', 'medium', 'high'),
      tip: tri(m.noseTipR, t.noseTipR, 'pointed', 'round', 'bulbous'),
      nostril: tri(m.nostrilR, t.nostrilR, 'small', 'medium', 'large'),
    },
    mouth: {
      size: tri(m.mouthSizeR, t.mouthSizeR, 'small', 'medium', 'large'),
      shape: tri(m.lipR, t.lipR, 'thin', 'medium', 'full'),
      corners: tri(m.mouthCornerR, t.mouthCornerR, 'down', 'neutral', 'up'),
    },
    chin: {
      shape: chinShape,
      length: tri(m.chinLengthR, t.chinLengthR, 'short', 'medium', 'long'),
      width: tri(m.chinWidthR, t.chinWidthR, 'narrow', 'medium', 'wide'),
    },
    cheekbones: {
      prominence: tri(m.cheekR, t.cheekR, 'flat', 'medium', 'high'),
      width: tri(m.cheekR, t.cheekR, 'narrow', 'medium', 'wide'),
    },
    ears: { size: 'medium', position: 'medium', lobe: 'medium' },
    faceShape: {
      type: faceShapeOf(m, t, chinShape),
      symmetry: m.symmetry,
    },
  };
}

function faceShapeOf(m: FaceMetrics, t: Thresholds, chin: FaceFeatures['chin']['shape']): FaceFeatures['faceShape']['type'] {
  if (m.faceRatio > t.faceRatio[1]) return 'long';
  if (m.faceRatio < t.faceRatio[0]) return 'round';
  if (chin === 'square') return 'square';
  if (chin === 'pointed') return m.chinWidthR < t.chinWidthR[0] ? 'heart' : 'diamond';
  return 'oval';
}

function calculateSymmetry(landmarks: Point[]): 'asymmetric' | 'balanced' | 'symmetric' {
  const centerX = landmarks[33].x;
  const eyeSymmetry = Math.abs((centerX - (landmarks[36].x + landmarks[39].x) / 2) - ((landmarks[42].x + landmarks[45].x) / 2 - centerX));
  const mouthSymmetry = Math.abs((centerX - landmarks[48].x) - (landmarks[54].x - centerX));
  const symmetryRatio = (eyeSymmetry + mouthSymmetry) / 2 / Math.abs(landmarks[16].x - landmarks[0].x);
  if (symmetryRatio < 0.03) return 'symmetric';
  if (symmetryRatio > 0.08) return 'asymmetric';
  return 'balanced';
}
