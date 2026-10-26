"use client";

// 브라우저 전용: MediaPipe FaceLandmarker(478점)로 사진의 얼굴 랜드마크를 찾는다.
// 사진은 브라우저 안에서만 처리되고 서버로 보내지 않는다.
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import type { Landmark } from "./landmarkFeatures";

// package.json의 @mediapipe/tasks-vision 버전과 맞출 것
const MEDIAPIPE_VERSION = "1.1.1";
const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
const MODEL_URL = "/models/face_landmarker.task";

let landmarkerPromise: Promise<FaceLandmarker> | null = null;

function getLandmarker(): Promise<FaceLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = FilesetResolver.forVisionTasks(WASM_URL)
      .then((fileset) =>
        FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL },
          runningMode: "IMAGE",
          numFaces: 1,
        }),
      )
      .catch((e) => {
        landmarkerPromise = null; // 다음 시도에서 다시 로드
        throw e;
      });
  }
  return landmarkerPromise;
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
