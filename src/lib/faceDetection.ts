'use client';

import * as faceapi from '@vladmandic/face-api';

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

// 모델 로딩 상태
let modelsLoaded = false;

/**
 * face-api.js 모델 로드
 * SSD MobileNetV1 (얼굴 감지) + 68 포인트 랜드마크 모델
 */
export async function loadModels(): Promise<void> {
  if (modelsLoaded) return;

  try {
    const MODEL_URL = '/models';

    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    ]);

    modelsLoaded = true;
    console.log('Face detection models loaded successfully');
  } catch (error) {
    console.error('Error loading face detection models:', error);
    throw error;
  }
}

/**
 * 이미지에서 얼굴 특징 감지
 * @param imageElement - HTMLImageElement, HTMLVideoElement, 또는 HTMLCanvasElement
 * @returns 감지된 얼굴 특징
 */
export async function detectFaceFeatures(
  imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<FaceFeatures> {
  // 모델이 로드되지 않았다면 먼저 로드
  if (!modelsLoaded) {
    await loadModels();
  }

  try {
    // 얼굴 감지 + 68개 랜드마크 추출
    const detection = await faceapi
      .detectSingleFace(imageElement)
      .withFaceLandmarks();

    if (!detection) {
      throw new Error('No face detected in the image');
    }

    const landmarks = detection.landmarks;
    const positions = landmarks.positions;

    // 68 랜드마크 인덱스
    // 0-16: 얼굴 윤곽 (턱선)
    // 17-21: 왼쪽 눈썹
    // 22-26: 오른쪽 눈썹
    // 27-35: 코
    // 36-41: 왼쪽 눈
    // 42-47: 오른쪽 눈
    // 48-67: 입

    return calculateFaceFeatures(positions);
  } catch (error) {
    console.error('Error detecting face features:', error);
    throw error;
  }
}

/**
 * 68 랜드마크 포인트로부터 얼굴 특징 계산
 */
function calculateFaceFeatures(landmarks: faceapi.Point[]): FaceFeatures {
  // 얼굴 기준 치수 계산
  const faceWidth = Math.abs(landmarks[16].x - landmarks[0].x);
  const faceHeight = Math.abs(landmarks[8].y - landmarks[27].y);

  // 눈 특징 계산
  const leftEye = landmarks.slice(36, 42);
  const rightEye = landmarks.slice(42, 48);
  const eyeDistance = Math.abs(rightEye[0].x - leftEye[3].x);

  const leftEyeWidth = Math.abs(leftEye[3].x - leftEye[0].x);
  const leftEyeHeight = Math.abs(leftEye[4].y - leftEye[1].y);
  const rightEyeWidth = Math.abs(rightEye[3].x - rightEye[0].x);
  const rightEyeHeight = Math.abs(rightEye[4].y - rightEye[1].y);

  const avgEyeWidth = (leftEyeWidth + rightEyeWidth) / 2;
  const avgEyeHeight = (leftEyeHeight + rightEyeHeight) / 2;
  const eyeAspectRatio = avgEyeHeight / avgEyeWidth;

  // 눈썹 특징 계산
  const leftBrow = landmarks.slice(17, 22);
  const rightBrow = landmarks.slice(22, 27);
  const browThickness = Math.abs(leftBrow[2].y - leftEye[1].y);
  const browLength = (Math.abs(leftBrow[4].x - leftBrow[0].x) + Math.abs(rightBrow[4].x - rightBrow[0].x)) / 2;

  // 눈썹 각도 계산 (중앙과 끝 높이 차이)
  const leftBrowAngle = leftBrow[4].y - leftBrow[2].y;
  const rightBrowAngle = rightBrow[4].y - rightBrow[2].y;
  const avgBrowAngle = (leftBrowAngle + rightBrowAngle) / 2;

  // 코 특징 계산
  const noseBridge = landmarks.slice(27, 31);
  const noseTip = landmarks.slice(31, 36);
  const noseLength = Math.abs(noseTip[2].y - noseBridge[0].y);
  const noseWidth = Math.abs(noseTip[4].x - noseTip[0].x);
  const noseBridgeHeight = Math.abs(noseBridge[3].y - noseBridge[0].y);

  // 콧구멍 크기
  const nostrilWidth = Math.abs(landmarks[35].x - landmarks[31].x);

  // 입 특징 계산
  const mouth = landmarks.slice(48, 68);
  const mouthWidth = Math.abs(mouth[6].x - mouth[0].x);
  const mouthHeight = Math.abs(mouth[9].y - mouth[3].y);

  // 입꼬리 각도 (올라감/처짐)
  const mouthCenter = mouth[3].y;
  const leftCorner = mouth[0].y;
  const rightCorner = mouth[6].y;
  const cornerAngle = ((leftCorner + rightCorner) / 2) - mouthCenter;

  // 턱 특징 계산
  const jawLine = landmarks.slice(0, 17);
  const chinPoint = landmarks[8];
  const chinWidth = Math.abs(landmarks[16].x - landmarks[0].x);
  const chinLength = Math.abs(chinPoint.y - landmarks[27].y);

  // 턱 형태 (각진 정도)
  const jawAngle = Math.abs(
    Math.atan2(landmarks[5].y - landmarks[0].y, landmarks[5].x - landmarks[0].x) -
    Math.atan2(landmarks[8].y - landmarks[5].y, landmarks[8].x - landmarks[5].x)
  );

  // 이마 특징 추정 (눈썹 위치 기준)
  const foreheadHeight = Math.abs(landmarks[27].y - ((leftBrow[2].y + rightBrow[2].y) / 2));
  const foreheadWidth = Math.abs(landmarks[16].x - landmarks[0].x);

  // 광대뼈 폭 추정 (눈 바깥쪽과 코 위치 기준)
  const cheekboneWidth = Math.abs(landmarks[16].x - landmarks[0].x) * 0.9;

  return {
    forehead: {
      width: classifyWidth(foreheadWidth / faceWidth, 0.85, 0.95),
      height: classifyHeight(foreheadHeight / faceHeight, 0.2, 0.3),
      shape: classifyShape(foreheadHeight / foreheadWidth, 0.3, 0.4),
    },
    eyes: {
      size: classifySize(avgEyeWidth / faceWidth, 0.1, 0.13),
      shape: eyeAspectRatio < 0.35 ? 'narrow' : eyeAspectRatio > 0.45 ? 'round' : 'almond',
      spacing: classifySpacing(eyeDistance / faceWidth, 0.15, 0.2),
    },
    eyebrows: {
      thickness: classifyThickness(browThickness / faceHeight, 0.01, 0.02),
      shape: avgBrowAngle < -3 ? 'angled' : avgBrowAngle > 2 ? 'arched' : 'straight',
      length: classifyLength(browLength / faceWidth, 0.15, 0.2),
    },
    nose: {
      size: classifySize(noseLength / faceHeight, 0.2, 0.28),
      bridge: classifyHeight(noseBridgeHeight / faceHeight, 0.08, 0.12),
      tip: noseWidth / noseLength < 0.6 ? 'pointed' : noseWidth / noseLength > 0.8 ? 'bulbous' : 'round',
      nostril: classifySize(nostrilWidth / noseWidth, 0.6, 0.75),
    },
    mouth: {
      size: classifySize(mouthWidth / faceWidth, 0.35, 0.45),
      shape: classifyLipShape(mouthHeight / mouthWidth, 0.15, 0.25),
      corners: cornerAngle < -2 ? 'down' : cornerAngle > 2 ? 'up' : 'neutral',
    },
    chin: {
      shape: jawAngle > 2.5 ? 'pointed' : jawAngle < 2.0 ? 'square' : 'round',
      length: classifyLength(chinLength / faceHeight, 0.3, 0.4),
      width: classifyWidth(chinWidth / faceWidth, 0.85, 0.95),
    },
    cheekbones: {
      prominence: classifyProminence(cheekboneWidth / faceWidth, 0.85, 0.92),
      width: classifyWidth(cheekboneWidth / faceWidth, 0.8, 0.9),
    },
    ears: {
      size: 'medium', // 귀는 정면 사진에서 감지가 어려움
      position: 'medium',
      lobe: 'medium',
    },
    faceShape: {
      type: determineFaceShape(faceWidth, faceHeight, chinWidth, jawAngle),
      symmetry: calculateSymmetry(landmarks),
    },
  };
}

/**
 * 크기 분류 헬퍼 (작음/보통/큼)
 */
function classifySize(
  value: number,
  smallThreshold: number,
  largeThreshold: number
): 'small' | 'medium' | 'large' {
  if (value < smallThreshold) return 'small';
  if (value > largeThreshold) return 'large';
  return 'medium';
}

/**
 * 폭 분류 헬퍼 (좁음/보통/넓음)
 */
function classifyWidth(
  value: number,
  narrowThreshold: number,
  wideThreshold: number
): 'narrow' | 'medium' | 'wide' {
  if (value < narrowThreshold) return 'narrow';
  if (value > wideThreshold) return 'wide';
  return 'medium';
}

/**
 * 높이 분류 헬퍼 (낮음/보통/높음)
 */
function classifyHeight(
  value: number,
  lowThreshold: number,
  highThreshold: number
): 'low' | 'medium' | 'high' {
  if (value < lowThreshold) return 'low';
  if (value > highThreshold) return 'high';
  return 'medium';
}

/**
 * 눈 간격 분류 헬퍼
 */
function classifySpacing(
  value: number,
  closeThreshold: number,
  wideThreshold: number
): 'close' | 'medium' | 'wide' {
  if (value < closeThreshold) return 'close';
  if (value > wideThreshold) return 'wide';
  return 'medium';
}

/**
 * 두께 분류 헬퍼
 */
function classifyThickness(
  value: number,
  thinThreshold: number,
  thickThreshold: number
): 'thin' | 'medium' | 'thick' {
  if (value < thinThreshold) return 'thin';
  if (value > thickThreshold) return 'thick';
  return 'medium';
}

/**
 * 길이 분류 헬퍼
 */
function classifyLength(
  value: number,
  shortThreshold: number,
  longThreshold: number
): 'short' | 'medium' | 'long' {
  if (value < shortThreshold) return 'short';
  if (value > longThreshold) return 'long';
  return 'medium';
}

/**
 * 돌출 분류 헬퍼
 */
function classifyProminence(
  value: number,
  flatThreshold: number,
  highThreshold: number
): 'flat' | 'medium' | 'high' {
  if (value < flatThreshold) return 'flat';
  if (value > highThreshold) return 'high';
  return 'medium';
}

/**
 * 입술 두께 분류 헬퍼
 */
function classifyLipShape(
  value: number,
  thinThreshold: number,
  fullThreshold: number
): 'thin' | 'medium' | 'full' {
  if (value < thinThreshold) return 'thin';
  if (value > fullThreshold) return 'full';
  return 'medium';
}

/**
 * 형태 분류 헬퍼
 */
function classifyShape(
  ratio: number,
  flatThreshold: number,
  prominentThreshold: number
): 'flat' | 'rounded' | 'prominent' {
  if (ratio < flatThreshold) return 'flat';
  if (ratio > prominentThreshold) return 'prominent';
  return 'rounded';
}

/**
 * 얼굴형 결정
 */
function determineFaceShape(
  width: number,
  height: number,
  chinWidth: number,
  jawAngle: number
): 'oval' | 'round' | 'square' | 'heart' | 'long' | 'diamond' {
  const ratio = height / width;

  if (ratio > 1.35) return 'long';
  if (ratio < 1.1) return 'round';

  if (jawAngle < 2.0) return 'square';
  if (jawAngle > 2.5 && chinWidth / width < 0.85) return 'heart';
  if (chinWidth / width < 0.8) return 'diamond';

  return 'oval';
}

/**
 * 좌우 대칭성 계산
 */
function calculateSymmetry(landmarks: faceapi.Point[]): 'asymmetric' | 'balanced' | 'symmetric' {
  // 중심선 (코끝) 기준 좌우 대칭성 계산
  const centerX = landmarks[33].x; // 코끝

  // 주요 포인트들의 좌우 대칭 차이 계산
  const leftEyeCenter = (landmarks[36].x + landmarks[39].x) / 2;
  const rightEyeCenter = (landmarks[42].x + landmarks[45].x) / 2;
  const eyeSymmetry = Math.abs((centerX - leftEyeCenter) - (rightEyeCenter - centerX));

  const leftMouth = landmarks[48].x;
  const rightMouth = landmarks[54].x;
  const mouthSymmetry = Math.abs((centerX - leftMouth) - (rightMouth - centerX));

  const avgSymmetry = (eyeSymmetry + mouthSymmetry) / 2;
  const faceWidth = Math.abs(landmarks[16].x - landmarks[0].x);
  const symmetryRatio = avgSymmetry / faceWidth;

  if (symmetryRatio < 0.03) return 'symmetric';
  if (symmetryRatio > 0.08) return 'asymmetric';
  return 'balanced';
}
