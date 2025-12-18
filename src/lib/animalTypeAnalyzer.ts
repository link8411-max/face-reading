import type { FaceFeatures } from './faceDetection';
import { animalTypeDB, type AnimalType } from './animalTypeDB';

// 동물상 분석 결과 타입
export interface AnimalTypeResult {
  type: string;
  data: AnimalType;
  matchScore: number;
  secondaryType?: string;
  features: {
    눈: string;
    얼굴형: string;
    턱: string;
    코: string;
  };
}

// 동물상 점수 계산
interface AnimalScores {
  dog: number;
  cat: number;
  fox: number;
  bear: number;
  rabbit: number;
  deer: number;
  tiger: number;
  eagle: number;
  [key: string]: number;
}

/**
 * 얼굴 특징으로 동물상 분석
 * 개선된 가중치와 변별력 있는 로직 적용
 */
export function analyzeAnimalType(features: FaceFeatures): AnimalTypeResult {
  const scores: AnimalScores = {
    dog: 0,
    cat: 0,
    fox: 0,
    bear: 0,
    rabbit: 0,
    deer: 0,
    tiger: 0,
    eagle: 0,
  };

  const { eyes, faceShape, chin, nose } = features;

  // 🐶 강아지: 순한 인상, 둥글둥글한 특징
  if (eyes.shape === 'round') {
    scores.dog += 30;
    if (eyes.size === 'large') scores.dog += 15;
  }
  if (faceShape.type === 'round') scores.dog += 20;
  if (chin.shape === 'round' && chin.width === 'medium') scores.dog += 15;
  if (nose.tip === 'round') scores.dog += 10;
  if (eyes.corners === 'down') scores.dog += 15; // 눈꼬리 처짐 가중치 증가

  // 🐱 고양이: 날카롭고 도도한 인상
  if (eyes.shape === 'almond') {
    scores.cat += 30;
    if (eyes.corners === 'up') scores.cat += 20;
  }
  if (faceShape.type === 'heart' || faceShape.type === 'oval') scores.cat += 15;
  if (chin.shape === 'pointed') scores.cat += 25;
  if (nose.size === 'small' && nose.bridge === 'high') scores.cat += 15;

  // 🦊 여우: 가늘고 날카로운 눈, 갸름한 매력
  if (eyes.shape === 'narrow') {
    scores.fox += 35;
    if (eyes.corners === 'up') scores.fox += 15;
  }
  if (faceShape.type === 'diamond' || faceShape.type === 'oval') scores.fox += 15;
  if (chin.shape === 'pointed' && chin.width === 'narrow') scores.fox += 25;
  if (nose.tip === 'pointed') scores.fox += 15;

  // 🐻 곰: 듬직하고 선한 인상
  if (eyes.size === 'small' && eyes.shape === 'round') scores.bear += 35;
  if (faceShape.type === 'square' || faceShape.type === 'round') scores.bear += 25;
  if (chin.width === 'wide') scores.bear += 25;
  if (nose.size === 'large') scores.bear += 15;

  // 🐰 토끼: 깜찍하고 생기발랄한 인상
  if (eyes.size === 'large' && eyes.shape === 'round') {
    scores.rabbit += 40;
    scores.dog -= 15; // 강아지와 변별력 확보
  }
  if (faceShape.type === 'long' || faceShape.type === 'oval') scores.rabbit += 15;
  if (chin.shape === 'round' && chin.width === 'narrow') scores.rabbit += 20;
  if (nose.size === 'small' && nose.tip === 'round') scores.rabbit += 15;

  // 🦌 사슴: 맑고 우아한 인상
  if (eyes.size === 'large' && eyes.shape === 'almond') {
    scores.deer += 40;
    scores.cat -= 15; // 고양이와 변별력 확보
  }
  if (faceShape.type === 'long' || faceShape.type === 'oval') scores.deer += 20;
  if (chin.shape === 'pointed' && chin.width === 'narrow') scores.deer += 20;
  if (nose.bridge === 'high' && nose.size === 'small') scores.deer += 15;

  // 🐯 호랑이: 강렬하고 리더십 있는 인상
  if (eyes.shape === 'narrow' && eyes.size === 'medium') scores.tiger += 35;
  if (faceShape.type === 'square' || faceShape.type === 'oval') scores.tiger += 20;
  if (chin.shape === 'square' || chin.width === 'wide') scores.tiger += 30;
  if (nose.size === 'large' && nose.bridge === 'high') scores.tiger += 15;

  // 🦅 독수리: 날카로운 관찰력, 카리스마
  if (eyes.shape === 'narrow' && eyes.size === 'small') scores.eagle += 40;
  if (faceShape.type === 'diamond' || faceShape.type === 'long') scores.eagle += 20;
  if (chin.shape === 'pointed' && chin.width === 'medium') scores.eagle += 25;
  if (nose.bridge === 'high' && nose.tip === 'pointed') scores.eagle += 15;

  // 점수 정렬
  const sortedTypes = Object.entries(scores)
    .sort(([, a], [, b]) => b - a);

  const topType = sortedTypes[0][0];
  const secondType = sortedTypes[1][0];

  // 매칭률 계산 (보정치 적용)
  const maxPossibleScore = 120;
  const matchScore = Math.min(Math.round((sortedTypes[0][1] / maxPossibleScore) * 100) + 25, 99);

  return {
    type: topType,
    data: animalTypeDB[topType],
    matchScore: Math.max(matchScore, 70),
    secondaryType: secondType,
    features: {
      눈: describeEyes(features),
      얼굴형: describeFaceShape(features),
      턱: describeChin(features),
      코: describeNose(features),
    },
  };
}

// 특징 설명 함수들
function describeEyes(features: FaceFeatures): string {
  const { size, shape } = features.eyes;
  const sizeText = size === 'large' ? '큰' : size === 'small' ? '작은' : '보통 크기의';
  const shapeText = shape === 'round' ? '동그란' : shape === 'narrow' ? '가늘고 긴' : '아몬드형';
  return `${sizeText} ${shapeText} 눈`;
}

function describeFaceShape(features: FaceFeatures): string {
  const typeMap: Record<string, string> = {
    oval: '계란형',
    round: '둥근형',
    square: '각진형',
    heart: '하트형',
    long: '긴 얼굴형',
    diamond: '다이아몬드형',
  };
  return typeMap[features.faceShape.type] || '균형 잡힌 얼굴형';
}

function describeChin(features: FaceFeatures): string {
  const shapeText = features.chin.shape === 'pointed' ? '뾰족한' :
    features.chin.shape === 'round' ? '둥근' : '각진';
  const widthText = features.chin.width === 'narrow' ? '갸름한' :
    features.chin.width === 'wide' ? '넓은' : '';
  return widthText ? `${widthText} ${shapeText} 턱선` : `${shapeText} 턱선`;
}

function describeNose(features: FaceFeatures): string {
  const bridgeText = features.nose.bridge === 'high' ? '높은 콧대의' :
    features.nose.bridge === 'low' ? '낮은 콧대의' : '';
  const sizeText = features.nose.size === 'large' ? '오똑한' :
    features.nose.size === 'small' ? '작고 앙증맞은' : '균형 잡힌';
  return bridgeText ? `${bridgeText} ${sizeText} 코` : `${sizeText} 코`;
}
