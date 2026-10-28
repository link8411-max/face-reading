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
- 테스트 시작: `components/test/TestHeader`(h1 = 페이지 이름), `TestStart`(성별 pill 필수 → 큰 사진 영역 → 안내 → 분석 버튼. 사진·성별 없으면 버튼 비활성). 관상은 분석에 성별을 쓰지 않아 `needsGender={false}`로 묻지 않는다. 고른 내 성별은 이 기기에만 기억해(`lib/genderMemory.ts`, `useRememberedGender`) 동물상·삼국지·얼굴 궁합 "나" 칸에 미리 고른다
- 결과: `components/result/ResultCard`(캡처 한 장 완결, 워터마크 "운명을 읽다 · unse-ai.com"), `ResultActions`(1순위 공유하기, 이미지 저장, 다시하기)
- 공유하기: `hooks/useResultShare`. 카카오톡 인앱이면 카카오톡 공유(`lib/kakao.ts`, Kakao SDK 2.7.4, 피드 카드: 1인칭 문구·결과 미리보기 이미지·나도 해보기) → 그 밖엔 `lib/share.ts` `shareResult`: 결과 링크+문구를 기본 공유창으로, 없으면 링크 복사. GA share_click method: kakao·link.
  - 카카오디벨로퍼스 앱 "운명을 읽다"(ID 1623598). JavaScript 키(공개 값)는 등록한 도메인(https://unse-ai.com, http://localhost:3200)에서만 동작한다. 도메인이 바뀌면 콘솔 > 플랫폼 키 > JavaScript 키 > SDK 도메인에 추가. **공유 카드를 눌러 이동하려면 별도로 앱 설정 > 제품 링크 관리 > 웹 도메인에 https://unse-ai.com이 있어야 한다**(없으면 카드는 보이지만 눌러도 반응이 없다, 2026-10-27 등록). 운세는 결과 링크가 없어 `useScreenshot().share`(이미지)를 쓰고, 카카오톡 안에서는 `kakao` 옵션의 카드로 보낸다(신년운세는 그 띠의 `/fortune/2027/[띠]`, 오늘의 운세는 `/fortune/daily`, 생년월일·출생 연도는 넣지 않음).
- 결과 공유 링크 (`lib/shareLinks.ts`): `/animal/r/[유형]?s=점수`, `/samguk/r/[장수id]?s=점수`, `/face2/r/[유형키]`, MBTI는 `/mbti/r/infp-entj` (계산기 `/mbti/match`는 정적·검색 노출 유지). 링크에는 유형 키·점수(50~99)·utm(source=share, medium=friend_link)만. 허용 목록 밖이면 테스트 시작 화면으로.
  - 착지 페이지 `components/share/SharePage.tsx`: 서버 `generateMetadata`로 1인칭 문구 미리보기(카톡·인스타 봇은 JS를 실행하지 않음), noindex, canonical은 원래 테스트, 사이트맵 제외. GA `shared_landing`.
  - 미리보기 이미지 `/api/og/result?kind=animal|samguk|face|mbti&…` (1200×630, 삼국지는 도트 초상화). `lib/ogQuery.ts`로 종류별 허용 매개변수·점수(50~99 두 자리)만 받고 CDN에 1년 캐시(초상화를 못 받으면 5분).
- 결과 캡처는 `no-screenshot` 요소와 iframe을 뺀다(`lib/capture.ts`). 운세의 생년월일 줄은 화면에만. 운세 공유 이미지는 결과가 나오면 미리 만들어 두고(`useScreenshot(result)`), 공유하기는 누르자마자 공유창을 연다.
- 얼굴 궁합·우리 팀은 분석 중에 입력(관계·성별·사진·별칭·인원)을 잠근다.
- 이미지 저장: `lib/saveImage.ts`. iOS와 인앱 브라우저(카카오톡·인스타·네이버 등)는 다운로드 대신 길게 눌러 저장 화면(data 이미지), 카카오톡이면 "다른 브라우저로 열기"(`kakaotalk://web/openExternal`)
- 같은 사진으로 다음 테스트: 삼국지·동물상·관상 결과 아래 `components/result/NextTests`(나머지 두 사진 테스트 카드). 사진은 `lib/photoHandoff.ts` 메모리로만 넘기고(브라우저 저장소 금지, 테스트로 막음) 받는 쪽은 `useHandedPhoto`로 바로 분석한다. 새로고침하면 사라진다. GA `next_test_click(test_name=간 곳)`.
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
│   │   ├── profiles.ts       # 장수 얼굴 프로필: 초상화 측정 기준 + 인식 못 한 그림만 글 묘사(handProfiles)
│   │   ├── portraitProfiles.ts # 초상화 특징 → 화풍 쏠림 제거(성별별 표준화) → 프로필
│   │   ├── portraitFeatures.json # 초상화 측정값 (scripts/measure-portraits.mjs)
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
- **오늘의 MBTI 운세** `/fortune/mbti`(운세 탭): MBTI만 고르면 오늘(한국 시간) 운세. `lib/mbti/daily.ts` `mbtiDaily(type, date)`가 `src/content/mbtiDaily.ts` 문장 풀에서 결정적으로 고른다(한마디 14일 안 반복 없음, 같은 날 유형끼리 세 줄 겹침 없음, 테스트로 고정). 문장을 고치면 `npx vitest run tests/mbti`.
  - 날짜는 브라우저에서 계산하고(정적 HTML·캐시의 어제 방지) 탭이 다시 보이면 갱신(`lib/kst.ts` `onDayMaybeChanged`). 고른 유형은 기기에만 기억(`lib/mbtiMemory.ts`), `?t=infp`로 바로 열기.
  - 공유 `/fortune/mbti/r/[type]`(소문자, 날짜 없음, 친구의 '오늘' 운세 + 내 MBTI로 보기), 미리보기 `/api/og/result?kind=mbti-daily&type=`. GA test_name `mbti_daily`.
- 운세 묶음은 `CategoryItem.group`으로 "생년월일로 보는 운세 / MBTI로 보는 운세" 소제목을 나눈다(`CategoryList`).

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

## 함께 하는 테스트 (8단계)
- 사진 한 장 분석은 `lib/face/analyzePhoto.ts` 공용 함수(압축→MediaPipe→정면 판정→성별 기준 z). 실패 이유별 안내 `REASON_TEXT`. 동물상·삼국지·얼굴 궁합·우리 팀이 같이 쓴다.
- **얼굴 궁합** `/face-match`: 관계(친구·연인·짝사랑)를 먼저 고르고 두 얼굴의 동물상으로 궁합(`lib/faceMatch/compat.ts`, 8×8×3, 55~100, 관계별 최고 100점).
  - `?me=cat`(동물상 결과에서 진입)이면 내 칸은 결과로 채워지고, 친구·연인은 초대 링크 `/face-match/i/[동물상]?rel=`를 보낼 수 있다. **짝사랑은 초대 링크를 만들지 않는다.**
  - 결과 공유 `/face-match/r/[a]-[b]?rel=`. 궁합 탭(`tabForPath`) 소속.
- **우리 팀 삼국지** `/samguk/team`: 2~6명, 역할(군주→책사→선봉장→살림꾼, 한 사람 한 역할, 동점은 먼저 올린 사람), 팀의 기운(기타 최다=군웅할거, 위·촉·오 동수 최다=천하삼분), 팀 funStats 평균(`lib/samguk/team.ts`).
  - 별칭은 화면·저장 이미지에만, 공유 링크 `/samguk/team/r/[id-id-…]`와 GA에는 넣지 않는다.
- 진입점: 동물상 결과 "친구 얼굴이랑 궁합"(`ResultActions` companion), 삼국지 결과 "우리 팀 삼국지 만들기"(lead), 홈 "친구랑 같이 해봐요" 4번째 칸, 궁합 허브.

## 시즌 추천 (쿠팡 파트너스)
- `src/content/coupangSeasons.ts`에 시즌(시작·끝 날짜 KST, 링크)을 넣으면 `SeasonPicks` 카드가 기간에만 보이고 끝나면 숨는다. 지금은 2027학년도 수능(2026-11-19) 합격 선물, 11/20까지.
- 위치: 메인 시즌 카드 아래, 오늘의 운세 결과, 띠별 운세 페이지, 신년운세 결과(세부 운세 옆). **사진 테스트 흐름에는 넣지 않는다**(테스트로 막음).
- 링크는 새 창·`rel="sponsored noopener"`, 대가성 문구 필수. GA `coupang_click(slot, keyword)`.
- 다음 시즌(신년·설 선물)은 링크를 만들면 항목만 추가.
- 다이나믹 배너(`CoupangBanner`, 방문자 관심 기반)는 시즌 카드와 별개로 유지한다. GA: 화면에 보이면 `coupang_banner_view(slot)`, 배너로 초점이 옮겨 가면 `coupang_click(slot, keyword=banner)`. slot은 subId의 하이픈을 밑줄로 바꾼 값(mbti-infp → mbti_infp). 구매 실적은 쿠팡 파트너스 리포트의 subId로 본다.

## 방문 통계 (GA4)
- 측정 ID `G-L99JPMPT9D` (`src/lib/analytics.ts`), `layout.tsx`의 `ga4-init` 스크립트. 운영 주소(unse-ai.com, `PROD_HOST_SOURCE`)가 아니면(로컬·Vercel 미리보기) gtag.js를 받지 않고 config도 안 해서 실제 통계에 안 섞인다(E2E는 `dataLayer`로 검사).
- 이벤트는 `track()`만 쓴다: `photo_selected`, `test_start`, `result_view(result_id)`, `share_click(method: link·save_image·share)`, `fortune_submit`, `shared_landing`. GA 준비 전 이벤트는 잠시 모았다가 보낸다. / `test_name`: face·animal·samguk·fortune·daily·mbti_match
- **사진·생년월일·얼굴 수치는 보내지 않는다.** `track()`은 허용 키(test_name, result_id, method)와 유형 키 형식(한글·영문·숫자 24자 이내, 숫자 4자리 연속 금지)만 통과시킨다. 결과는 유형 키만(fox, caocao, 재물상, 띠, INFP_ENTJ).
- 일기토 퍼널(값은 `result_id`에 인코딩, 키 추가 없음): `duel_wave`(보스 웨이브 도달, `w06`~`w36`), `duel_end`(`<시작장수>_<c|l>_<마지막으로 넘은 보스>` 예 `guanyu_l_w18`), `duel_resume`, `duel_abandon`.
- 일기토 판 요약은 GA와 별도로 `/api/duel/run` -> Supabase `duel_runs`(`docs/duel-runs.sql`)에 판마다 1회 저장. 시작 장수·도달 웨이브·결과·보상 id·기기 종류·시간 구간만, IP·runId는 저장하지 않는다. 리포트는 `scripts/duel-real-stats.ts`.
- 개인정보처리방침 5항에 GA 수집 안내와 일기토 플레이 기록 안내.

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

**장수 추가·초상화 교체**: 그림은 `public/images/samguk/<한글이름>.jpg`(화풍·생성 지침 `docs/portrait-prompts.md`, Antigravity로 생성). 데이터는 `samgukDB.ts`(`allSamgukCharacters`)와 `vibes.ts`. 그림이 아직 없는 장수는 `PENDING_PORTRAIT_IDS`에 두면 결과·공유·팀에서 빠진다(그림이 들어왔는데 남아 있으면 테스트 실패). 그림을 넣으면 개발 서버(3311)를 띄우고 `node scripts/measure-portraits.mjs` → calibrate-samguk. 얼굴 인식이 안 되는 그림은 `profiles.ts` handProfiles에 글 묘사 프로필을 쓴다. 장수 수 문구(삼국지 제목·소개·메뉴)는 실제 수와 같아야 한다(테스트).

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

## 삼국지 일기토 (/samguk/duel)

삼국지3 감성 도트 턴제 로그라이크. 36웨이브, 보스는 6·12·18·24·30·36웨이브(장각·하후돈·동탁·황충·마초·여포). 시작 장수는 관우·장비·조운·주유. 설계: `docs/superpowers/specs/2026-10-28-samguk-duel-design.md`.

| 위치 | 내용 |
|------|------|
| `src/lib/duel/` | 규칙(순수 TS, 난수는 `rng.ts` 시드 기반). `battle.ts` 전투·`run.ts` 판 진행·`rewards.ts`·`skills.ts`·`generals.ts` 명단·`balance.ts` 밸런스 수치(설계표 `design.ts`)·`save.ts` 저장·`shareKey.ts` 공유 키·`narrative.ts` 열전·`autoplay.ts` 자동 플레이 |
| `src/game/duel/` | Phaser 장면(Start·Battle·Reward·Result), `bridge.ts`(React↔Phaser 이벤트·디버그 훅), `layout.ts`·`config.ts` |
| `src/components/duel/` | `DuelMount`(천 무늬 배경), `DuelClient`(상태·입력), `OverlayButtons`(캔버스 위 투명 DOM 버튼), `clientLogic.ts`(`overlayLayout` 버튼 배치) |
| 라우트 | `/samguk/duel`(게임, 라우트 그룹 `(game)`), `/samguk/duel/generals/[id]`(열전 12장 정적), `/samguk/duel/r/[key]`(공유 랜딩, noindex, 잘못된 키는 게임으로 리디렉션. 키 예: `guanyu.lvbu.30.l.9`) |
| API | `/api/duel/feedback`(피드백), `/api/duel/run`(판 요약 통계). 환경변수 `SUPABASE_URL`·`SUPABASE_SERVICE_KEY`(없으면 조용히 건너뜀). 테이블 SQL은 `docs/duel-feedback.sql`·`docs/duel-runs.sql`을 Supabase SQL Editor에서 실행 |

- **쿼리**: `?seed=<숫자>`로 같은 판 재현, `?me=<장수id>`로 시작 장수 미리 선택(열전의 "이 장수로 시작").
- **입력**: 그림은 Phaser가, 입력은 DOM 투명 버튼이 받는다(`aria-label`은 장수·기술 이름으로 바뀌므로 E2E는 `button[data-duel-btn="skill0"]` 같은 고정 id로 찾는다). 명령을 한 번 누르면 고르기, 같은 명령(또는 결정 버튼)을 다시 누르면 결정. 고르면 대사창에 미리보기(상성 유불리·예상 피해·효과)가 뜨고, 적의 다음 기술은 항상 표시(`enemyIntent`). 고른 줄(`pendingSel`)과 커서(`battleSel`, 포커스·호버)는 다르며, 고른 줄을 다시 누르면 결정(포커스가 click보다 먼저라 커서로 비교하면 안 된다, `tapRow`). 터치·좁은 화면은 세로형 2x2 큰 카드(각 44px 이상). 게임 중에는 하단 탭바를 숨긴다.
- **디버그 훅**: `window.__duel = { scene, phase, wave, animating }`. E2E는 고정 sleep 대신 이것을 기다린다. 보상 화면은 연출이 끝나야 `scene`이 `reward`로 바뀐다(`phase`는 먼저 바뀜).
- **밸런스 조정**: `docs/duel-balance.md`(측정법·표·결정 기록). 수치는 `src/lib/duel/balance.ts`, 검증은 `scripts/duel-balance.ts`·`scripts/duel-tune.ts`와 `tests/duel/balance.test.ts`. 수치를 바꾸면 판 요약의 `version`(수치 해시)이 바뀐다.
- **에셋 스크립트**: 스프라이트 생성 기록 `docs/duel-sprites.md`, 초상 `scripts/duel-portraits.ts`·`docs/portrait-prompts.md`, 한글 도트 글꼴 서브셋 `scripts/duel-font-subset.mjs`.
- **E2E**: `e2e/duel.spec.ts`(데스크톱·모바일 390x844 플레이, 공유 랜딩, 열전).

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
