# Face Reading Project

## 배포 방법
**git commit & push = 자동 배포 (Vercel 연동)**
```bash
git add .
git commit -m "커밋 메시지"
git push
```

## API Keys
- **Gemini API Key**: `AIzaSyCltI-V0cYrB71sbi7WhdB-mYQokELViGQ`

## Project Overview
관상/운세 분석 웹앱 (Next.js + TypeScript + Tailwind CSS)

## 페이지 구조

| 경로 | 설명 | 비고 |
|------|------|------|
| `/` | 메인 페이지 | |
| `/face2` | 무료 관상 분석 | face-api.js 기반, 무제한 |
| `/face` | AI 관상 분석 | Gemini AI, 하루 1회 제한 |
| `/samguk` | 삼국지 닮은꼴 | |
| `/fortune` | 신년운세 | 띠별 |
| `/fortune/daily` | 오늘의 운세 | 띠별 |

## 핵심 파일

### 관상 분석 관련
- `/src/lib/faceDetection.ts` - face-api.js 얼굴 감지
- `/src/lib/faceReadingDB.ts` - 관상 해석 데이터베이스
- `/src/lib/faceAnalyzer.ts` - 특징 → 해석 매핑
- `/src/app/api/analyze/route.ts` - AI 관상 API (Gemini)

### 공통
- `/src/hooks/useScreenshot.ts` - 결과 이미지 캡쳐/공유

## 사용 라이브러리
- `face-api.js` - 얼굴 랜드마크 감지 (68포인트)
- `modern-screenshot` - DOM 캡쳐 (html2canvas 대체)
- `@google/generative-ai` - Gemini AI API

## 모델 파일
`/public/models/` - face-api.js 모델 (ssd_mobilenetv1, face_landmark_68)

## 주의사항
- face-api.js 사용 시 `'use client'` 필수
- AI 분석 하루 1회 제한은 localStorage 기반 (`face_ai_last_used`)
- 제한 초과 시 `/face` → `/face2` 자동 리다이렉트
