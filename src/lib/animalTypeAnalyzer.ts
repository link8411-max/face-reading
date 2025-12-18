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
}

/**
 * 얼굴 특징으로 동물상 분석
 * Gemini 기준 기반
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

  // 🐶 강아지: 크고 둥근 눈 + 둥근/타원형 얼굴 + 둥근 턱(중간 너비)
  if (eyes.size === 'large' && eyes.shape === 'round') scores.dog += 35;
  else if (eyes.size === 'large') scores.dog += 20;
  else if (eyes.shape === 'round') scores.dog += 15;

  if (faceShape.type === 'round' || faceShape.type === 'oval') scores.dog += 20;
  if (chin.shape === 'round' && chin.width === 'medium') scores.dog += 15;
  else if (chin.shape === 'round') scores.dog += 8;
  if (nose.size === 'medium' && nose.bridge === 'low') scores.dog += 10;

  // 🐱 고양이: 중간 아몬드 눈 + 타원/하트형 얼굴 + 뾰족한 턱(좁음)
  if (eyes.size === 'medium' && eyes.shape === 'almond') scores.cat += 35;
  else if (eyes.shape === 'almond') scores.cat += 25;

  if (faceShape.type === 'oval' || faceShape.type === 'heart') scores.cat += 25;
  if (chin.shape === 'pointed' && chin.width === 'narrow') scores.cat += 20;
  else if (chin.shape === 'pointed') scores.cat += 12;
  if (nose.size === 'small' && nose.bridge === 'high') scores.cat += 10;

  // 🦊 여우: 중간 가는 눈 + 타원/다이아몬드 얼굴 + 뾰족한 턱(좁음)
  if (eyes.size === 'medium' && eyes.shape === 'narrow') scores.fox += 35;
  else if (eyes.shape === 'narrow') scores.fox += 25;
  else if (eyes.size === 'small') scores.fox += 15;

  if (faceShape.type === 'oval' || faceShape.type === 'diamond') scores.fox += 25;
  if (chin.shape === 'pointed' && chin.width === 'narrow') scores.fox += 20;
  else if (chin.shape === 'pointed') scores.fox += 12;
  if (nose.size === 'medium' && nose.bridge === 'high') scores.fox += 10;

  // 🐻 곰: 작고 둥근 눈 + 둥근/사각형 얼굴 + 둥근 턱(넓음)
  if (eyes.size === 'small' && eyes.shape === 'round') scores.bear += 35;
  else if (eyes.size === 'small' && eyes.shape !== 'narrow') scores.bear += 25;

  if (faceShape.type === 'round' || faceShape.type === 'square') scores.bear += 25;
  if (chin.shape === 'round' && chin.width === 'wide') scores.bear += 20;
  else if (chin.width === 'wide') scores.bear += 12;
  if (nose.size === 'large' && nose.bridge === 'low') scores.bear += 10;

  // 🐰 토끼: 크고 둥근 눈 + 긴/타원형 얼굴 + 둥근 턱(좁음)
  if (eyes.size === 'large' && eyes.shape === 'round') scores.rabbit += 35;
  else if (eyes.size === 'large') scores.rabbit += 20;

  if (faceShape.type === 'long' || faceShape.type === 'oval') scores.rabbit += 25;
  else if (faceShape.type === 'heart') scores.rabbit += 15;
  if (chin.shape === 'round' && chin.width === 'narrow') scores.rabbit += 20;
  else if (chin.width === 'narrow') scores.rabbit += 10;
  if (nose.size === 'small' && nose.bridge === 'low') scores.rabbit += 10;

  // 🦌 사슴: 크고 아몬드 눈 + 긴/타원형 얼굴 + 뾰족한 턱(좁음)
  if (eyes.size === 'large' && eyes.shape === 'almond') scores.deer += 35;
  else if (eyes.shape === 'almond' && eyes.size !== 'small') scores.deer += 25;

  if (faceShape.type === 'long' || faceShape.type === 'oval') scores.deer += 25;
  if (chin.shape === 'pointed' && chin.width === 'narrow') scores.deer += 20;
  else if (chin.shape === 'pointed') scores.deer += 10;
  if (nose.size === 'small' && nose.bridge === 'medium') scores.deer += 10;

  // 🐯 호랑이: 중간 가는 눈 + 사각/타원형 얼굴 + 각진 턱(넓음)
  if (eyes.size === 'medium' && eyes.shape === 'narrow') scores.tiger += 35;
  else if (eyes.shape === 'narrow') scores.tiger += 20;

  if (faceShape.type === 'square' || faceShape.type === 'oval') scores.tiger += 25;
  else if (faceShape.type === 'diamond') scores.tiger += 15;
  if (chin.shape === 'square' && chin.width === 'wide') scores.tiger += 20;
  else if (chin.shape === 'square') scores.tiger += 12;
  if (nose.size === 'medium' && nose.bridge === 'high') scores.tiger += 10;

  // 🦅 독수리: 작고 가는 눈 + 다이아몬드/사각형 얼굴 + 뾰족한 턱(중간)
  if (eyes.size === 'small' && eyes.shape === 'narrow') scores.eagle += 35;
  else if (eyes.shape === 'narrow' && eyes.size !== 'large') scores.eagle += 25;

  if (faceShape.type === 'diamond' || faceShape.type === 'square') scores.eagle += 25;
  else if (faceShape.type === 'long') scores.eagle += 15;
  if (chin.shape === 'pointed' && chin.width === 'medium') scores.eagle += 20;
  else if (chin.shape === 'square') scores.eagle += 10;
  if (nose.size === 'large' && nose.bridge === 'high') scores.eagle += 10;

  // 점수 정렬
  const sortedTypes = Object.entries(scores)
    .sort(([, a], [, b]) => b - a);

  const topType = sortedTypes[0][0];
  const topScore = sortedTypes[0][1];
  const secondType = sortedTypes[1][0];

  // 매칭 점수 (최대 90점 기준)
  const matchScore = Math.min(Math.round((topScore / 90) * 100), 95);

  return {
    type: topType,
    data: animalTypeDB[topType],
    matchScore: Math.max(matchScore, 65),
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
