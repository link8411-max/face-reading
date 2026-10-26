'use client';

import * as faceapi from '@vladmandic/face-api';

import { measureFace, classifyFace, type FaceFeatures, type FaceMetrics } from './face/faceApiMetrics';
import thresholds from './face/faceApiThresholds.json';
import type { Thresholds } from './face/faceApiMetrics';

export type { FaceFeatures, FaceMetrics };

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
// 얼굴이 없을 때 던지는 에러 메시지 (페이지에서 이 값으로 안내 문구를 고른다)
export const FACE_NOT_DETECTED = 'Face not detected';

export async function detectFaceFeatures(
  imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<FaceFeatures> {
  await loadModels();

  const detection = await faceapi
    .detectSingleFace(imageElement)
    .withFaceLandmarks();

  if (!detection) {
    throw new Error(FACE_NOT_DETECTED);
  }

  return classifyFace(measureFace(detection.landmarks.positions), thresholds as Thresholds);
}

// 개발용(/dev/face-lab): 구간 점검을 위해 원시 측정값을 돌려준다
export async function detectFaceMetrics(imageElement: HTMLImageElement): Promise<FaceMetrics | null> {
  await loadModels();
  const detection = await faceapi.detectSingleFace(imageElement).withFaceLandmarks();
  return detection ? measureFace(detection.landmarks.positions) : null;
}

