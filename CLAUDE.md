# Face Reading Project

## API Keys

- **Gemini API Key**: `AIzaSyCltI-V0cYrB71sbi7WhdB-mYQokELViGQ`

## Project Overview

관상/운세 분석 웹앱 (Next.js + TypeScript + Tailwind CSS)

### 주요 기능
- **삼국지 닮은꼴 분석** (`/samguk`): 얼굴 사진으로 삼국지 인물 닮은꼴 찾기
- **AI 관상 분석** (`/face`): Gemini AI를 활용한 관상 분석
- **신년운세** (`/fortune`): 띠별 2025년 신년운세
- **오늘의 운세** (`/fortune/daily`): 띠별 일일 운세

### 공통 컴포넌트/훅
- `useScreenshot` (`/src/hooks/useScreenshot.ts`): 결과 이미지 캡쳐 및 공유 기능

### 사용 라이브러리
- `modern-screenshot`: DOM을 이미지로 캡쳐 (html2canvas 대체 - CSS lab() 함수 호환성 이슈)
- `@google/generative-ai`: Gemini AI API

### 배포
- Vercel 배포 (`npm run deploy`)
