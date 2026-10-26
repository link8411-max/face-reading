"use client";

// 브라우저 전용: MediaPipe FaceLandmarker(478점)로 사진의 얼굴 랜드마크를 찾는다.
// 사진은 브라우저 안에서만 처리되고 서버로 보내지 않는다.
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import type { Landmark } from "./landmarkFeatures";

// package.json의 @mediapipe/tasks-vision 버전과 맞출 것
const MEDIAPIPE_VERSION = "1.1.1";
const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
const MODEL_URL = "/models/face_landmarker.task";
const LOAD_TIMEOUT_MS = 40000; // 느린 모바일 망에서도 모델(수 MB)을 받을 시간

let landmarkerPromise: Promise<FaceLandmarker> | null = null;

function getLandmarker(): Promise<FaceLandmarker> {
  if (!landmarkerPromise) {
    // CDN이 막히면 WASM 로더가 실패도 성공도 하지 않고 멈출 수 있어, 시간 제한을 둔다
    const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("landmarker load timeout")), LOAD_TIMEOUT_MS));
    landmarkerPromise = Promise.race([timeout, FilesetResolver.forVisionTasks(WASM_URL)
      .then((fileset) =>
        FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL },
          runningMode: "IMAGE",
          numFaces: 1,
        }),
      )
      ])
      .catch((e) => {
        landmarkerPromise = null; // 다음 시도에서 다시 로드
        throw e;
      });
  }
  return landmarkerPromise;
}

// 사진을 고를 때 미리 불러 두면 분석 버튼을 누른 뒤 기다림이 줄어든다 (실패해도 분석 때 다시 시도)
export function prepareLandmarker(): Promise<unknown> {
  return getLandmarker();
}

// 얼굴이 없으면 null. 좌표는 픽셀 단위(정규화 좌표 × 이미지 크기)로 돌려준다.
// 정규화 좌표를 그대로 쓰면 정사각형이 아닌 사진에서 가로세로 비율이 왜곡된다.
export async function detectLandmarks(img: HTMLImageElement): Promise<Landmark[] | null> {
  const landmarker = await getLandmarker();
  const result = landmarker.detect(img);
  const face = result.faceLandmarks[0];
  if (!face) return null;
  const w = img.naturalWidth, h = img.naturalHeight;
  return face.map((p) => ({ x: p.x * w, y: p.y * h, z: p.z * w }));
}
