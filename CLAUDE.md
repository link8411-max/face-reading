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
- **얼굴인식**: @mediapipe/tasks-vision FaceLandmarker 478점 (삼국지·동물상), @vladmandic/face-api 68점 (관상만, 추후 이전)
- **OG 이미지**: @vercel/og (동적 생성)
- **PWA**: manifest.ts + sw.js (홈화면 설치 가능)

---

## 디자인 시스템 (4b 뉴트럴, 2026-10-26)

시안: 디자인 캔버스 `https://claude.ai/artifact/Psoi9fmSypmynmFNE2vBhR` (Main, TestStart, ResultCard, SamgukCard). 타깃 20~30대 여성, 무섭지 않고 너무 핑크하지 않은 뉴트럴.

### 토큰 (`globals.css` `@theme`)
`bg-paper`(#FBF6F1) `bg-card`(#ECE5D9) `bg-card-2`(#F1EBE2) `border-line`(#E6DED2) `text-ink`(#2E2A27) `text-muted`(#6B6259) `text-accent`(#A4553A, 포인트는 이것 하나) `blush`(#E9BCA8, 얼굴 그림 볼 홍조만) · 삼국지 카드 전용 `bg-navy-game`(#23263A) `text-gold-game`(#E8B547)
- 글꼴: 제목 `font-serif`(Gowun Batang 400/700), 본문 `font-sans`(Noto Sans KR 400/700), 삼국지 카드 픽셀 글씨 `font-pixel`(Silkscreen). 900 굵기 금지(테스트).
- 모양: 카드 `rounded-[22px]`~`rounded-[30px]`, 버튼 pill(`rounded-full`), 주 버튼 `h-[52px] bg-ink text-paper`.
- 옛 민화 색(#F5E6D3, #C41E3A 등)과 옛 토큰 이름(vermilion, gold, navy, paper-2)은 테스트로 막는다.

### 아이콘·이모지
- 이모지는 제목·버튼·링크·메뉴에 쓰지 않는다(E2E `chrome-emoji.spec.ts`). 아이콘은 `src/components/icons.tsx`의 `Icon`(선 굵기 1.6) 한 세트, 얼굴 그림은 `SmileFace`, 장식은 `MoonDeco`.

### 공통 구성요소
- 테스트 시작: `components/test/TestHeader`(h1 = 페이지 이름), `TestStart`(성별 pill 필수 → 큰 사진 영역 → 안내 → 분석 버튼. 사진·성별 없으면 버튼 비활성)
- 결과: `components/result/ResultCard`(캡처 한 장 완결, 워터마크 "운명을 읽다 · unse-ai.com"), `ResultActions`(1순위 공유하기, 이미지 저장, 다시하기)
- 공유하기: `hooks/useResultShare`. 카카오톡 인앱이면 카카오톡 공유(`lib/kakao.ts`, Kakao SDK 2.7.4, 피드 카드: 1인칭 문구·결과 미리보기 이미지·나도 해보기) → 그 밖엔 `lib/share.ts` `shareResult`: 결과 링크+문구를 기본 공유창으로, 없으면 링크 복사. GA share_click method: kakao·link.
  - 카카오디벨로퍼스 앱 "운명을 읽다"(ID 1623598). JavaScript 키(공개 값)는 등록한 도메인(https://unse-ai.com, http://localhost:3200)에서만 동작한다. 도메인이 바뀌면 콘솔 > 플랫폼 키 > JavaScript 키 > SDK 도메인에 추가. 운세는 결과 링크가 없어 `useScreenshot().share`(이미지)를 쓴다.
- 결과 공유 링크 (`lib/shareLinks.ts`): `/animal/r/[유형]?s=점수`, `/samguk/r/[장수id]?s=점수`, `/face2/r/[유형키]`, MBTI는 `/mbti/r/infp-entj` (계산기 `/mbti/match`는 정적·검색 노출 유지). 링크에는 유형 키·점수(50~99)·utm(source=share, medium=friend_link)만. 허용 목록 밖이면 테스트 시작 화면으로.
  - 착지 페이지 `components/share/SharePage.tsx`: 서버 `generateMetadata`로 1인칭 문구 미리보기(카톡·인스타 봇은 JS를 실행하지 않음), noindex, canonical은 원래 테스트, 사이트맵 제외. GA `shared_landing`.
  - 미리보기 이미지 `/api/og/result?kind=animal|samguk|face|mbti&…` (1200×630, 삼국지는 도트 초상화)
- 이미지 저장: `lib/saveImage.ts`. iOS와 인앱 브라우저(카카오톡·인스타·네이버 등)는 다운로드 대신 길게 눌러 저장 화면(data 이미지), 카카오톡이면 "다른 브라우저로 열기"(`kakaotalk://web/openExternal`)
- 삼국지: `components/samguk/SamgukGameCard`(회사생활 STATUS), `lib/samguk/guardian.ts`(나를 지켜줄 장수: 같은 세력에서 funStats 빈틈을 가장 많이 메우는 장수, 80~98점)
- 8단계 전까지 없는 기능(친구 얼굴 궁합, 우리 팀 삼국지) 버튼은 넣지 않는다.

### OG 이미지 API
- 경로: `/api/og`
- 파라미터: `?title=제목&subtitle=부제` (뉴트럴 카드, `icon`은 선택이며 현재 쓰지 않음)
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
│   ├── animal/               # 동물상 z 프로필·매칭·시뮬레이션·calibration.json
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

## 메뉴·메인 (4a)
- 메뉴와 묶음은 `src/content/navigation.ts` 한 곳에서 정의한다(TABS, CATEGORIES, tabForPath). 홈 묶음 탭·허브(`/face-tests`, `/unse`)·하단 탭바·푸터가 모두 이걸 쓴다. 새 테스트를 추가하면 CATEGORIES에 항목을 넣는다.
- 하단 탭바 `BottomTabBar`(모든 페이지, no-screenshot). 본문은 탭바 높이만큼 아래 여백이 있다.
- 메인 순서(4b): 얼굴 히어로(`FaceHero`) → 친구랑 같이 해봐요(`PlayTogether`, 4번째 칸은 8단계 전까지 MBTI 궁합) → 띠 칩(`ZodiacPicker`) → 쿠팡 배너 → 시즌 카드(`SeasonCard`, `src/content/season.ts`만 바꾸면 교체) → 묶음 탭 → 2027 띠 → FAQ. 홈 FAQ는 `src/content/homeFaq.ts`(화면·구조화 데이터 공용).
- 하단 탭: 홈 / 얼굴 / 운세 / 궁합(`/mbti`).
- 디자인 토큰·글꼴은 위 "디자인 시스템 (4b 뉴트럴)" 참고.
- 참여자 수·인기 순위 같은 숫자는 실제 집계 전까지 넣지 않는다(테스트로 막음).

## 신년운세 (연도별 갱신)
- 기준 연도: `src/lib/fortuneYear.ts` (현재 2027 정미년). 해가 바뀌면 이 값과 `fortuneDB.띠별올해`·`오행.*.올해조언`, `src/content/fortune2027Zodiac.ts`(띠별 페이지 본문)를 함께 갱신한다.
- 사주 계산 `src/lib/saju.ts`: 일주는 `korean-lunar-calendar`(천문연 데이터), 년주·월주는 입춘·절기 근사 날짜 기준(입춘 2/4 등). 음력 입력은 `src/lib/fortuneService.ts`에서 양력으로 변환(윤달 포함).
- 띠별 페이지: `/fortune/2027`(허브), `/fortune/2027/[zodiac]`(rat~pig, 정적 생성, 띠당 본문 1,500자 이상 테스트로 고정)
- `/fortune/layout.tsx`에는 구조화 데이터를 두지 않는다 (하위 페이지에 중첩됨). `/fortune/page.tsx`에서 렌더.

## MBTI (5단계)
- 궁합 `src/lib/mbti/compat.ts`: 네 축 같음/다름 × 맥락(연애·친구·직장) 가중치 → 55~100으로 펼침. 맥락마다 가장 잘 맞는 쌍이 정확히 100점(테스트로 고정). 대칭·결정적. 널리 쓰이는 궁합표 경향(E/I·J/P 반대, S/N 같음)을 따른다.
- 유형 본문 `src/content/mbtiTypes.ts`(16유형, 페이지 본문 1,500자 이상). **이달의 운세는 `monthly.month`가 현재 달과 다르면 숨는다** → 매달 갱신(7단계 파이프라인 전까지 수동).
- 페이지: `/mbti`(허브), `/mbti/[type]`(소문자 16개, 정적), `/mbti/match`(계산기, `?a=&b=` 미리 선택). 조합별 개별 페이지는 만들지 않는다(얇은 콘텐츠).

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

## 방문 통계 (GA4)
- 측정 ID `G-L99JPMPT9D` (`src/lib/analytics.ts`), `layout.tsx`의 `ga4-init` 스크립트. 로컬(localhost)에서는 gtag.js를 받지 않고 config도 안 해서 실제 통계에 안 섞인다(E2E는 `dataLayer`로 검사).
- 이벤트는 `track()`만 쓴다: `photo_selected`, `test_start`, `result_view(result_id)`, `share_click(method: link·save_image·share)`, `fortune_submit`, `shared_landing`. GA 준비 전 이벤트는 잠시 모았다가 보낸다. / `test_name`: face·animal·samguk·fortune·daily·mbti_match
- **사진·생년월일·얼굴 수치는 보내지 않는다.** `track()`은 허용 키(test_name, result_id, method)와 유형 키 형식(한글·영문·숫자 24자 이내, 숫자 4자리 연속 금지)만 통과시킨다. 결과는 유형 키만(fox, caocao, 재물상, 띠, INFP_ENTJ).
- 개인정보처리방침 5항에 GA 수집 안내.

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

**성별별 기준값 (2b)**: `src/lib/face/featureStats.ts`의 `FEATURE_STATS_BY_GENDER`, z는 `toZ(f, gender)`로 사용자가 고른 성별 기준을 쓴다.
- 재측정: 개발 서버(`npx next dev -p 3311`)를 띄우고 `node scripts/measure-face-stats.mjs` → 출력값을 붙여 넣는다. 성별 라벨은 `scripts/dev-face-genders.json`, 정면 사진만 쓴다. 표본이 작아 t 기반 축소 추정.
- 시뮬레이션은 성별 분포에서 특징값을 뽑아 실제 경로(`toZ(f, gender)`)로 매칭한다 (`src/lib/face/sampleFeatures.ts`).

**프로필이나 기준값을 바꾸면** `npx tsx --tsconfig tsconfig.json scripts/calibrate-samguk.ts`와 `scripts/calibrate-animal.ts`로 bias를 다시 만들고 `npm test`(분포 테스트: 전원 1회 이상, 균등의 3배 이하, 성별별)를 통과시킬 것.

### 동물상 테스트 (/animal) 흐름
1. 성별 선택 + 이미지 업로드
2. `face/mediapipe.ts` 랜드마크 → `checkFrontal` → `extractFeatures` → `toZ(f, gender)`
3. `lib/animal/matcher.ts` `matchAnimal(z, calibration.bias)`: 8종 z 프로필(`lib/animal/profiles.ts`)과 가중 거리, 닮음 70~98%
4. 특징 묘사(`describe`)는 같은 z에서 한 방향만 골라 모순이 없다. 해석 문구는 `animalTypeDB.ts`

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
| 홈 FAQ(화면·구조화 데이터) | `src/content/homeFaq.ts` |
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
테스트 페이지는 `"use client"`라 서버 HTML에 글이 거의 없다. 그래서 각 layout이 `<PageGuide>`(서버 컴포넌트)를 렌더한다. 처음엔 2~3줄 `summary`만 보이고 소개·특징은 "자세히 보기"(details)로 접힌다(HTML에는 남아 색인됨). 기술·개인정보 설명은 본문이 아니라 FAQ에 둔다. 그 밖에 FAQ(+페이지별 FAQPage JSON-LD), 다른 테스트 링크를 HTML에 넣는다. 섹션에는 `no-screenshot` 클래스가 있어 결과 캡처에 섞이지 않는다. 테스트: `npm test`

### 새 페이지 추가 시 SEO 체크리스트
1. `layout.tsx` 생성 (메타데이터 + JSON-LD)
2. `src/app/sitemap.ts`의 `SITEMAP_ROUTES`와 `LAST_MODIFIED`에 추가
3. `src/content/pageGuides.ts`에 본문(요약/소개/특징/FAQ/관련 테스트)을 넣고 layout.tsx의 `{children}` 아래에 `<PageGuide route="..." />` 추가

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
