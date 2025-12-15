# 운명을 읽다 - AI 관상 & 신년운세 서비스

## 프로젝트 개요
- **서비스명**: 운명을 읽다
- **URL**: https://face-reading.vercel.app
- **GitHub**: https://github.com/link8411-max/face-reading
- **개발일**: 2025년 12월 15일

## 기술 스택
- **프레임워크**: Next.js 16 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **AI API**: Google Gemini API (gemini-2.5-flash)
- **배포**: Vercel
- **분석**: Vercel Analytics

## 주요 기능

### 1. AI 관상 분석 (`/face`)
- 얼굴 사진 업로드 → Gemini Vision API로 분석
- **분석 항목**:
  - 관상 유형 (귀인상/복덕상/재물상/학자상/예술가상/리더상)
  - 부위별 분석 (이마, 눈, 코, 입, 전체윤곽)
  - 시기별 운세 (초년운 1-30세, 중년운 31-50세, 말년운 51세+)
  - 운세 지수 (재물운, 애정운, 직장운, 건강운, 대인운)
  - 성격 특성, 어울리는 직업, 행운 요소
- 결과 화면에 업로드한 사진 썸네일 표시

### 2. 2026 신년 운세 (`/fortune`)
- 생년월일 + 태어난 시간 입력
- **음력/양력 선택** 가능 (전통 사주는 음력 기준)
- **태어난 시간**: 12지지 시간 선택 (자시~해시) + "모름" 옵션
- **사주 계산**: 년주, 월주, 일주, 시주(선택)
- **분석 항목**:
  - 2026년 총운 (병오년 - 붉은 말의 해)
  - 월별 운세 (상반기/하반기, 최고의달/주의할달)
  - 세부 운세 (재물운, 애정운, 직장운, 건강운, 학업운)
  - 오행 분석, 행운 요소, 조언

## 프로젝트 구조
```
src/
├── app/
│   ├── page.tsx              # 메인 (관상/운세 선택)
│   ├── layout.tsx            # 레이아웃 + Analytics
│   ├── face/
│   │   └── page.tsx          # 관상 분석 페이지
│   ├── fortune/
│   │   └── page.tsx          # 신년 운세 페이지
│   └── api/
│       ├── analyze/
│       │   └── route.ts      # 관상 분석 API
│       └── fortune/
│           └── route.ts      # 운세 분석 API
├── lib/
│   └── saju.ts               # 사주팔자 계산 유틸리티
└── globals.css
```

## API 상세

### POST /api/analyze (관상)
```typescript
// Request
{ image: string }  // base64 이미지

// Response
{
  type: string,           // 관상 유형
  title: string,          // 대표 관상명
  faceFeatures: {...},    // 부위별 분석
  lifeFortune: {...},     // 시기별 운세
  categories: {...},      // 운세 지수
  personality: string[],  // 성격 특성
  career: string,         // 어울리는 직업
  advice: string,         // 조언
  luckyNumber: number,
  luckyColor: string,
  summary: string
}
```

### POST /api/fortune (운세)
```typescript
// Request
{
  year: number,
  month: number,
  day: number,
  hour: string,      // "자시"~"해시" 또는 "모름"
  isLunar: boolean   // 음력 여부
}

// Response
{
  사주정보: {
    띠, 띠이모지, 사주, 일간, 일간오행,
    음양, 오행분포, 강한오행, 약한오행,
    역법, 시주
  },
  운세: {
    총운, 월별운세, 세부운세, 사주분석,
    행운요소, 조언
  }
}
```

## 사주 계산 (`/src/lib/saju.ts`)
- **천간**: 갑을병정무기경신임계 (10개)
- **지지**: 자축인묘진사오미신유술해 (12개)
- **오행**: 목화토금수
- **계산**: 년주, 월주, 일주 (시주는 AI가 처리)
- **2026년 정보**: 병오년 (丙午年) - 화(火) + 말띠

## 환경 변수
```
GEMINI_API_KEY=AIzaSy...  # Google AI Studio에서 발급
```

## Gemini API 설정
- **모델**: gemini-2.5-flash (기본), gemini-2.0-flash (백업)
- **재시도 로직**: 503/429 에러 시 자동 재시도 + 백업 모델 전환
- **유료 전환됨**: 일일 제한 해제

## 배포 정보
- **플랫폼**: Vercel
- **자동 배포**: GitHub main 브랜치 push 시
- **환경 변수**: Vercel Dashboard > Settings > Environment Variables

## 구현 예정 / 아이디어
- [ ] 공유 기능 강화 (카카오톡, 이미지 저장)
- [ ] 광고 (카카오 AdFit 또는 Google AdSense)
- [ ] 결과 이미지 생성 (공유용)
- [ ] UI 개선
- [ ] 더 많은 운세 옵션 (오늘의 운세, 궁합 등)

## 참고 사항
- 메타데이터: `layout.tsx`에서 설정 (SEO)
- Vercel Analytics 활성화됨 (월 2,500 이벤트 무료)
- Gemini API 유료 전환 완료 (사용량 과금)

## 로컬 개발
```bash
cd /Users/hongseong-il/Projects/face-reading
npm run dev
# http://localhost:3000
```

## 최근 커밋 히스토리
1. feat: 태어난 시간(시주) 입력 + 관상 결과에 사진 표시
2. feat: Vercel Analytics 추가 + gemini-2.5-flash 기본 모델
3. feat: 재시도 로직 + 백업 모델 추가
4. feat: 2026년 병오년으로 운세 업데이트
5. feat: 음력/양력 선택 기능 추가
6. feat: 사주팔자 기반 신년 운세 기능 추가

---
마지막 업데이트: 2025-12-15
