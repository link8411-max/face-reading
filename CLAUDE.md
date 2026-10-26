# Face Reading Project

## 배포
```bash
git add . && git commit -m "메시지" && git push
```
**Vercel 자동 배포** - push하면 끝

## 테스트
```bash
npm test             # 단위 테스트 (vitest): 특징 추출, 매칭, 분포 시뮬레이션, 문구 사실성
npx playwright install chromium   # 처음 한 번 (E2E용 브라우저)
npm run test:e2e     # E2E (next build 후 3200 포트): 전 페이지 로딩·링크·모든 버튼·돌아가기/다시하기·자체 파일 404
```
- 삼국지 실얼굴 E2E는 `public/dev-faces/person1.jpg`가 있을 때만 실행된다 (git·배포 제외 폴더, AI 생성 인물 사진).
- `/dev/face-lab`(개발 전용, production 404)에서 초상화·테스트 얼굴의 특징값과 매칭을 한 번에 볼 수 있다.
- "돌아가기"는 항상 홈으로 간다 (`useBackOrHome`). `router.back()`은 검색 유입 시 사이트 밖으로 나가므로 쓰지 않는다.

---

## 기술 스택
- **프레임워크**: Next.js 16 (App Router) + TypeScript
- **스타일**: Tailwind CSS 4
- **AI 호출 없음**: 결과는 규칙 계산 + 미리 작성한 해석 데이터 (Gemini 제거됨)
- **얼굴인식**: @mediapipe/tasks-vision FaceLandmarker 478점 (삼국지), @vladmandic/face-api 68점 (관상·동물상, 2b단계에서 MediaPipe로 이전 예정)
- **OG 이미지**: @vercel/og (동적 생성)
- **PWA**: manifest.ts + sw.js (홈화면 설치 가능)

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
│   ├── layout.tsx            # 루트 레이아웃 + SEO + PWA
│   ├── manifest.ts           # PWA 매니페스트
│   ├── face2/page.tsx        # 무료 관상 분석 (/face2) - 무제한
│   ├── animal/page.tsx       # 동물상 테스트 (/animal)
│   ├── samguk/page.tsx       # 삼국지 닮은꼴 (/samguk)
│   ├── fortune/
│   │   ├── page.tsx          # 신년운세 (/fortune)
│   │   └── daily/page.tsx    # 오늘의 운세 (/fortune/daily)
│   └── api/
│       ├── fortune/route.ts  # 운세 API
│       └── og/route.tsx      # OG 이미지 동적 생성
├── lib/
│   ├── face/
│   │   ├── mediapipe.ts      # MediaPipe 랜드마크 추출 (브라우저 전용, dynamic import)
│   │   ├── landmarkFeatures.ts # 랜드마크 → 연속 특징 15개 (크기·위치·기울기 불변)
│   │   └── featureStats.ts   # 특징 평균·표준편차, z 점수
│   ├── samguk/
│   │   ├── profiles.ts       # 장수 52명 얼굴 프로필 (z값 + 가중치, 근거 주석)
│   │   ├── matcher.ts        # 가중 거리 매칭 + 닮은 이유/얼굴 분석 문장
│   │   ├── simulate.ts       # 분포 시뮬레이션 (시드 고정)
│   │   └── calibration.json  # 쏠림 보정 bias (scripts/calibrate-samguk.ts로 생성)
│   ├── faceDetection.ts      # face-api.js 얼굴 감지 (68 랜드마크)
│   ├── faceReadingDB.ts      # 관상 해석 데이터베이스
│   ├── faceAnalyzer.ts       # 특징 → 해석 변환
│   ├── animalTypeDB.ts       # 동물상 데이터 (8종)
│   ├── animalTypeAnalyzer.ts # 얼굴특징 → 동물상 매핑
│   ├── samgukDB.ts           # 삼국지 인물 데이터
│   ├── fortuneDB.ts          # 운세 데이터
│   └── saju.ts               # 사주 계산
└── hooks/
    └── useScreenshot.ts      # 결과 캡쳐/공유 훅

public/
├── models/                   # face-api.js 모델 + face_landmarker.task (MediaPipe)
│   ├── ssd_mobilenetv1_*     # 얼굴 감지 모델
│   └── face_landmark_68_*    # 랜드마크 모델
├── icons/                    # PWA 아이콘
│   ├── icon-192x192.svg
│   └── icon-512x512.svg
├── sw.js                     # 서비스 워커
└── robots.txt
```

---

## 페이지별 기능

| 경로 | 기능 | 제한 | 사용 기술 |
|------|------|------|-----------|
| `/` | 메인 | - | - |
| `/face2` | 무료 관상 | 무제한 | face-api.js + DB |
| `/animal` | 동물상 테스트 | 무제한 | face-api.js + DB |
| `/samguk` | 삼국지 닮은꼴 | 무제한 | MediaPipe + 프로필 매칭 |
| `/fortune` | 신년운세 | - | DB 기반 |
| `/fortune/daily` | 오늘의 운세 | - | DB 기반 |

---

## API Keys
없음 (Gemini 제거됨). `/face`는 `next.config.ts`에서 `/face2`로 308 리디렉션.

---

## 주요 로직

### 무료 관상 (/face2) 흐름
1. 이미지 업로드
2. `faceDetection.ts` - face-api.js로 68개 랜드마크 감지
3. `faceAnalyzer.ts` - 눈/코/입/얼굴형 등 특징 계산
4. `faceReadingDB.ts` - 특징별 해석 텍스트 조회
5. 결과 표시

### 삼국지 닮은꼴 (/samguk) 흐름
1. 성별 선택(남/여) + 이미지 업로드
2. `face/mediapipe.ts` - MediaPipe로 478점 랜드마크 (픽셀 좌표로 변환)
3. `checkFrontal` - 고개를 많이 돌렸으면 안내 / 얼굴 없으면 안내
4. `extractFeatures` → `toZ` → `matchCharacter(z, gender, calibration.bias)`
5. 결과 표시 (닮은 이유, 얼굴 분석, 인물 정보)

**프로필이나 FEATURE_STATS를 바꾸면** `npx tsx --tsconfig tsconfig.json scripts/calibrate-samguk.ts`로 bias를 다시 만들고 `npm test`(분포 테스트: 전원 1회 이상, 균등의 3배 이하)를 통과시킬 것.

### 동물상 테스트 (/animal) 흐름
1. 이미지 업로드
2. `faceDetection.ts` - face-api.js로 68개 랜드마크 감지
3. `animalTypeAnalyzer.ts` - 눈/코/입/얼굴형 → 동물상 점수 계산
4. `animalTypeDB.ts` - 8가지 동물상 데이터 조회
5. 결과 표시 (매칭률, 성격, 연애스타일, 궁합 등)

### 결과 공유
- `useScreenshot` 훅 사용
- `modern-screenshot` 라이브러리 (html2canvas 대체)
- iOS: 새 탭에서 길게 눌러 저장

### PWA
- `manifest.ts` → Next.js가 자동으로 `/manifest.webmanifest` 생성
- `sw.js` - 서비스 워커 (캐싱, 오프라인 지원)
- 홈화면 추가 가능 (iOS Safari, Android Chrome)

---

## 자주 수정하는 파일

| 작업 | 파일 |
|------|------|
| 관상 해석 텍스트 수정 | `src/lib/faceReadingDB.ts` |
| 삼국지 인물 얼굴 프로필 | `src/lib/samguk/profiles.ts` |
| 무료 관상 UI | `src/app/face2/page.tsx` |
| 메인 페이지 | `src/app/page.tsx` |
| 페이지 설명 본문/FAQ | `src/content/pageGuides.ts` |
| 홈 FAQ 구조화 데이터 | `src/app/page.tsx` |
| sitemap | `src/app/sitemap.ts` (내용 바꾸면 `LAST_MODIFIED` 날짜 갱신) |

---

## SEO 구성

### 각 페이지별 layout.tsx
모든 페이지에 개별 `layout.tsx`가 있으며 다음을 포함:
- `title`, `description`, `keywords`
- `openGraph` (title, description, siteName, images)
- `twitter` card
- `alternates.canonical` (정규 URL)
- `JSON-LD` 구조화 데이터 (SoftwareApplication)

### PageGuide (서버 렌더 본문)
테스트 페이지는 `"use client"`라 서버 HTML에 글이 거의 없다. 그래서 각 layout이 `<PageGuide>`(서버 컴포넌트)를 렌더해 소개, 이용법, FAQ(+페이지별 FAQPage JSON-LD), 다른 테스트 링크를 HTML에 넣는다. 섹션에는 `no-screenshot` 클래스가 있어 결과 캡처에 섞이지 않는다. 테스트: `npm test`

### 새 페이지 추가 시 SEO 체크리스트
1. `layout.tsx` 생성 (메타데이터 + JSON-LD)
2. `src/app/sitemap.ts`의 `SITEMAP_ROUTES`와 `LAST_MODIFIED`에 추가
3. `src/content/pageGuides.ts`에 본문(소개/이용법/특징/FAQ/관련 테스트)을 넣고 layout.tsx의 `{children}` 아래에 `<PageGuide route="..." />` 추가

---

## 네비게이션 패턴

결과 화면의 "돌아가기" 버튼 동작:
- **결과 화면**: `resetAll()` 호출 → 입력 화면으로 (텍스트: "← 다시하기")
- **입력 화면**: `router.back()` → 이전 페이지로 (텍스트: "← 돌아가기")

```tsx
<button onClick={() => result ? resetAll() : router.back()}>
  ← {result ? '다시하기' : '돌아가기'}
</button>
```

---

## 주의사항

1. **face-api.js**: `'use client'` 필수 (브라우저 전용)
2. **AI 제한**: localStorage 기반이라 브라우저별로 따로 카운트
3. **이미지 캡쳐**: `modern-screenshot` 사용 (CSS lab() 호환)
4. **모델 파일**: `/public/models/`에 있어야 face-api.js 작동
5. **페이지 추가/삭제 시**: 반드시 `src/app/sitemap.ts` 업데이트!
6. **SEO**: 새 페이지는 layout.tsx + sitemap + canonical URL 필수

---

---

## 에이전트 협업 지침 (Agent Collaborative Vibe)

이 프로젝트는 여러 AI 에이전트(Antigravity, Claude 등)가 함께 빌드합니다. 일관성을 위해 다음을 준수합니다.

1.  **지침 공유**: 워크플로우 전용 지침은 `.agent/workflows/` 폴더에 마크다운으로 저장하며, 모든 에이전트는 작업 전 이를 확인한다.
2.  **바이브 코딩**: 단순한 코드 구현을 넘어, 프로젝트의 '킥(질감, 감성, 재미 요소)'을 이해하고 코딩한다.
3.  **상호 참조**: 새로운 스타일이나 로직이 결정되면 `CLAUDE.md`와 워크플로우 문서를 즉시 업데이트하여 지식을 동기화한다.

---

## 삼국지 캐릭터 아트 '킥(Kick)' 원칙

삼국지 닮은꼴 서비스의 핵심 재미를 위해 다음 포트레이트 가이드를 준수한다.

1.  **코에이(KOEI) 오마주**: 90년대 고전 게임(삼국지 3~5)의 '디더링(Dithering)' 질감을 반드시 살린다.
2.  **시그니처 디테일**: 인물별 고유 서사를 반영한다.
    - 관우: 중자색(붉은) 얼굴, 2자(긴) 수염.
    - 장비: 호목(호랑이 눈), 연턱(제비 턱).
    - 제갈량: 백우선, 윤건(학자 모자).
3.  **현대적 재해석**: 사용자의 실제 사진에서 추출된 '인상(분석 데이터)'을 캐릭터 포트레이트에 미세하게 투영하여 '나만의 장수' 느낌을 준다.
4.  **기술 사양**: 16비트 레트로 게임 화풍, 낮은 팔레트(Muted colors), 유화적 터치를 도트로 표현.
