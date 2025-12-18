# Face Reading Project

## 배포
```bash
git add . && git commit -m "메시지" && git push
```
**Vercel 자동 배포** - push하면 끝

---

## 기술 스택
- **프레임워크**: Next.js 16 (App Router) + TypeScript
- **스타일**: Tailwind CSS 4
- **AI**: Google Gemini API
- **얼굴인식**: @vladmandic/face-api (face-api.js 포크)
- **OG 이미지**: @vercel/og (동적 생성)

---

## 디자인 시스템 (민화 스타일)

전체 UI가 한국 전통 민화 스타일로 통일됨

### 색상 팔레트 (오방색 기반)
```
배경 (한지):     #F5E6D3, #E8D4C4
빨강 (오방색):   #C41E3A
파랑:           #1E3A5F
금색:           #FFD700, #D4AF37
갈색 (텍스트):   #5C4033
```

### 공통 스타일
```css
/* 배경 */
bg-gradient-to-b from-[#F5E6D3] via-[#E8D4C4] to-[#F5E6D3]

/* 카드 */
bg-white/60 backdrop-blur-sm rounded-3xl border-2 border-[#C41E3A]/30 shadow-lg

/* 버튼 (주) */
bg-gradient-to-r from-[#C41E3A] to-[#D4AF37] text-white

/* 태그 */
bg-[#C41E3A]/15 text-[#C41E3A] rounded-full border border-[#C41E3A]/30
```

### OG 이미지 API
- 경로: `/api/og`
- 파라미터: `?title=제목&subtitle=부제&icon=이모지`
- 각 페이지 layout.tsx에 OG 이미지 URL 설정됨

---

## 프로젝트 구조

```
src/
├── app/
│   ├── page.tsx              # 메인 페이지 (/)
│   ├── layout.tsx            # 루트 레이아웃 + SEO (FAQ JSON-LD)
│   ├── face/page.tsx         # AI 관상 분석 (/face) - 하루 1회
│   ├── face2/page.tsx        # 무료 관상 분석 (/face2) - 무제한
│   ├── samguk/page.tsx       # 삼국지 닮은꼴 (/samguk)
│   ├── fortune/
│   │   ├── page.tsx          # 신년운세 (/fortune)
│   │   └── daily/page.tsx    # 오늘의 운세 (/fortune/daily)
│   └── api/
│       ├── analyze/route.ts  # AI 관상 API (Gemini)
│       ├── samguk/route.ts   # 삼국지 API (Gemini)
│       ├── fortune/route.ts  # 운세 API
│       └── og/route.tsx      # OG 이미지 동적 생성
├── lib/
│   ├── faceDetection.ts      # face-api.js 얼굴 감지 (68 랜드마크)
│   ├── faceReadingDB.ts      # 관상 해석 데이터베이스
│   ├── faceAnalyzer.ts       # 특징 → 해석 변환
│   ├── samgukDB.ts           # 삼국지 인물 데이터
│   ├── fortuneDB.ts          # 운세 데이터
│   └── saju.ts               # 사주 계산
└── hooks/
    └── useScreenshot.ts      # 결과 캡쳐/공유 훅

public/
├── models/                   # face-api.js 모델 파일
│   ├── ssd_mobilenetv1_*     # 얼굴 감지 모델
│   └── face_landmark_68_*    # 랜드마크 모델
├── sitemap.xml
└── robots.txt
```

---

## 페이지별 기능

| 경로 | 기능 | 제한 | 사용 기술 |
|------|------|------|-----------|
| `/` | 메인 | - | - |
| `/face2` | 무료 관상 | 무제한 | face-api.js + DB |
| `/face` | AI 관상 | 하루 1회 | Gemini API |
| `/samguk` | 삼국지 닮은꼴 | - | Gemini API |
| `/fortune` | 신년운세 | - | DB 기반 |
| `/fortune/daily` | 오늘의 운세 | - | DB 기반 |

---

## API Keys
```
GEMINI_API_KEY=AIzaSyCltI-V0cYrB71sbi7WhdB-mYQokELViGQ
```
(.env.local에 설정됨)

---

## 주요 로직

### 무료 관상 (/face2) 흐름
1. 이미지 업로드
2. `faceDetection.ts` - face-api.js로 68개 랜드마크 감지
3. `faceAnalyzer.ts` - 눈/코/입/얼굴형 등 특징 계산
4. `faceReadingDB.ts` - 특징별 해석 텍스트 조회
5. 결과 표시

### AI 관상 (/face) 흐름
1. 이미지 업로드
2. localStorage로 하루 1회 체크 (`face_ai_last_used`)
3. 제한 초과시 → `/face2`로 자동 리다이렉트
4. `/api/analyze` → Gemini API 호출
5. 결과 표시

### 결과 공유
- `useScreenshot` 훅 사용
- `modern-screenshot` 라이브러리 (html2canvas 대체)
- iOS: 새 탭에서 길게 눌러 저장

---

## 자주 수정하는 파일

| 작업 | 파일 |
|------|------|
| 관상 해석 텍스트 수정 | `src/lib/faceReadingDB.ts` |
| AI 프롬프트 수정 | `src/app/api/analyze/route.ts` |
| 무료 관상 UI | `src/app/face2/page.tsx` |
| AI 관상 UI | `src/app/face/page.tsx` |
| 메인 페이지 | `src/app/page.tsx` |
| SEO/FAQ | `src/app/layout.tsx` |
| sitemap | `public/sitemap.xml` |

---

## 주의사항

1. **face-api.js**: `'use client'` 필수 (브라우저 전용)
2. **AI 제한**: localStorage 기반이라 브라우저별로 따로 카운트
3. **이미지 캡쳐**: `modern-screenshot` 사용 (CSS lab() 호환)
4. **모델 파일**: `/public/models/`에 있어야 face-api.js 작동

---

## 개발 서버
```bash
npm run dev
# http://localhost:3000
```
