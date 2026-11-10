# Face Reading Project

## 배포
```bash
git add . && git commit -m "메시지" && git push
```
**Vercel 자동 배포** - push하면 끝
- Vercel 함수 지역은 프로젝트 설정에서 **서울(icn1)** (2026-11-04, Supabase가 서울이라). Hobby 요금제는 프로젝트당 1지역이고 라우트의 `preferredRegion`은 적용되지 않는다. 지역 설정을 바꾸면 새 배포가 필요하다.

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
- **얼굴인식**: @mediapipe/tasks-vision FaceLandmarker 478점 (삼국지·동물상·관상). @vladmandic/face-api는 성별 추정(tiny_face_detector + age_gender)에만 쓴다
- **OG 이미지**: @vercel/og (동적 생성)
- **PWA**: manifest.ts + sw.js v2(캐시 + push 핸들러) + PNG 아이콘 `icon-192/512`·`apple-touch-icon-180`·`badge-96`(`scripts/make-push-icons.mjs`로 생성) (홈화면 설치 가능)

---

## 디자인 시스템 (4b 뉴트럴, 2026-10-26)

시안: 디자인 캔버스 `https://claude.ai/artifact/Psoi9fmSypmynmFNE2vBhR` (Main, TestStart, ResultCard, SamgukCard). 타깃 20~30대 여성, 무섭지 않고 너무 핑크하지 않은 뉴트럴.

### 토큰 (`globals.css` `@theme`)
`bg-paper`(#FBF6F1) `bg-card`(#ECE5D9) `bg-card-2`(#F1EBE2) `border-line`(#E6DED2) `text-ink`(#2E2A27) `text-muted`(#6B6259) `text-accent`(#A4553A, 포인트는 이것 하나) `blush`(#E9BCA8, 얼굴 그림 볼 홍조만) · 삼국지 카드 전용 `bg-navy-game`(#23263A) `text-gold-game`(#E8B547)
- 글꼴: 제목 `font-serif`(Gowun Batang 400/700), 본문 `font-sans`(Noto Sans KR 400/700), 삼국지 카드 픽셀 글씨 `font-pixel`(Silkscreen). 900 굵기 금지(테스트).
  - 자체 호스팅(`next/font/local`, 2026-11-05): woff2와 OFL 라이선스는 `src/fonts/`, `layout.tsx`에서 읽는다. Google Fonts(`next/font/google`)는 쓰지 않는다 — Vercel 빌드가 폰트 다운로드 실패로 깨진 적이 있다(테스트로 막음). 한글 글꼴은 `scripts/font-subset.mjs`로 KS X 1001 2350자 + 라틴·기호 + src 코드에 나오는 글자만 남긴다(원본·사용법은 스크립트 머리말). 2350 밖 한글을 새 문구에 쓰면 스크립트를 다시 돌린다.
- 모양: 카드 `rounded-[22px]`~`rounded-[30px]`, 버튼 pill(`rounded-full`), 주 버튼 `h-[52px] bg-ink text-paper`.
- 옛 민화 색(#F5E6D3, #C41E3A 등)과 옛 토큰 이름(vermilion, gold, navy, paper-2)은 테스트로 막는다.

### 아이콘·이모지
- 이모지는 제목·버튼·링크·메뉴에 쓰지 않는다(E2E `chrome-emoji.spec.ts`). 아이콘은 `src/components/icons.tsx`의 `Icon`(선 굵기 1.6) 한 세트, 얼굴 그림은 `SmileFace`, 장식은 `MoonDeco`.

### 공통 구성요소
- 테스트 시작: `components/test/TestHeader`(h1 = 페이지 이름), `TestStart`(성별 pill 필수 → 큰 사진 영역 → 안내 → 분석 버튼. 사진·성별 없으면 버튼 비활성). 관상 2판도 성별로 보정하므로 묻되, 사진을 고르면 추정해 미리 골라 둔다(아래 관상 2판 절). 고른 내 성별은 이 기기에만 기억해(`lib/genderMemory.ts`, `useRememberedGender`) 동물상·삼국지·얼굴 궁합 "나" 칸에 미리 고른다
- 결과: `components/result/ResultCard`(캡처 한 장 완결, 워터마크 "운명을 읽다 · unse-ai.com"), `ResultActions`(1순위 공유하기, 이미지 저장, 다시하기)
- 공유하기: `hooks/useResultShare`. 카카오톡 인앱이면 카카오톡 공유(`lib/kakao.ts`, Kakao SDK 2.7.4, 피드 카드: 1인칭 문구·결과 미리보기 이미지·나도 해보기) → 그 밖엔 `lib/share.ts` `shareResult`: 결과 링크+문구를 기본 공유창으로, 없으면 링크 복사. GA share_click method: kakao·link.
  - 카카오디벨로퍼스 앱 "운명을 읽다"(ID 1623598). JavaScript 키(공개 값)는 등록한 도메인(https://unse-ai.com, http://localhost:3200)에서만 동작한다. 도메인이 바뀌면 콘솔 > 플랫폼 키 > JavaScript 키 > SDK 도메인에 추가. **공유 카드를 눌러 이동하려면 별도로 앱 설정 > 제품 링크 관리 > 웹 도메인에 https://unse-ai.com이 있어야 한다**(없으면 카드는 보이지만 눌러도 반응이 없다, 2026-10-27 등록). 운세는 결과 링크가 없어 `useScreenshot().share`(이미지)를 쓰고, 카카오톡 안에서는 `kakao` 옵션의 카드로 보낸다(신년운세는 그 띠의 `/fortune/2027/[띠]`, 오늘의 운세는 `/fortune/daily`, 생년월일·출생 연도는 넣지 않음).
- 결과 공유 링크 (`lib/shareLinks.ts`): `/animal/r/[유형]?s=점수`, `/samguk/r/[장수id]?s=점수`, `/face2/r/[유형키]`, MBTI는 `/mbti/r/infp-entj` (계산기 `/mbti/match`는 정적·검색 노출 유지). 링크에는 유형 키·점수(50~99)·utm(source=share, medium=friend_link)만. 허용 목록 밖이면 테스트 시작 화면으로.
  - 착지 페이지 `components/share/SharePage.tsx`: 서버 `generateMetadata`로 1인칭 문구 미리보기(카톡·인스타 봇은 JS를 실행하지 않음), noindex, canonical은 원래 테스트, 사이트맵 제외. GA `shared_landing`, `push_subscribe`(result_id: 유형 키)·`push_unsubscribe`·`push_blocked(result_id: denied·ios_install·server·kakao)`.
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
│   ├── face/guansang*.ts · palaces.ts · genderGuess.ts · revealTimeline.ts  # 관상 2판 (분류·삼정·성별 추정·공개 모션 일정)
│   ├── animalTypeDB.ts       # 동물상 데이터 (8종)
│   ├── animal/               # 동물상 z 프로필·매칭·시뮬레이션·calibration.json
│   ├── samgukDB.ts           # 삼국지 인물 데이터
│   ├── fortuneDB.ts          # 운세 데이터
│   └── saju.ts               # 사주 계산
└── hooks/
    └── useScreenshot.ts      # 결과 캡쳐/공유 훅

public/
├── models/                   # face_landmarker.task (MediaPipe) + tiny_face_detector_*·age_gender_* (성별 추정)
├── icons/                    # PWA 아이콘
│   ├── icon-192x192.svg
│   └── icon-512x512.svg
├── sw.js                     # 서비스 워커
└── robots.txt
```

---

## 관상 2판 (오행 얼굴형 × 삼정, 2026-11-07)
- 파이프라인: `lib/face/analyzePhoto.ts`의 `analyzePhotoDetailed`(MediaPipe 랜드마크·정면 검사·z·삼정 비율) → `classifyGuansang`(`lib/face/guansang.ts`, 얼굴형 5 × 힘이 실린 자리 3) → `readPalaces`(`palaces.ts`, 돈·일·사랑·사람·버팀 다섯 자리 강/보통/키울 곳). 화면은 `components/face/GuansangResultView`, 공개 모션은 `RevealMotion`.
- 유형 키: `{shape}-{zone}` 15개 (`lib/face/guansangKeys.ts`; shape = wood/fire/earth/metal/water, zone = up/mid/down). 예: `/face2/r/earth-mid` = "곳간이 든든한 상". 옛 6유형 키(wealth 등)는 `LEGACY_FACE_KEYS`로 새 키에 연결돼 같은 결과로 착지한다.
- 문구는 전부 `src/content/guansang.ts`. `tests/guansang/copy.test.ts`가 금지어(외모 비하·단정)를 검사한다. 수정하면 `npm test`.
- 보정 재실행: `npx tsx --tsconfig tsconfig.json scripts/calibrate-guansang.ts` (결과 `lib/face/guansangCalibration.json`). 통계 재측정: dev 서버(3311)를 띄우고 `/dev/face-lab`을 연 상태에서 `node scripts/measure-guansang-stats.mjs` → 출력으로 `guansangStats.ts` 갱신.
- 상정은 헤어라인이 아니라 MediaPipe 점 10을 기준으로 잰다(머리카락에 안 흔들림). 그래서 `ZONE_UP_RANGE`(`guansangFeatures.ts`)는 추측이 아니라 측정 최소·최대이며, 범위 밖이면 `foreheadUncertain`으로 이마 결론을 낮춘다. 통계를 다시 재면 같이 갱신한다.
- 성별 미리 선택: `lib/face/genderGuess.ts`(`guessGender`, 확신 0.6 미만이면 비움, 4초 타임아웃). 모델은 face-api tiny_face_detector + age_gender만. 추정값은 사용자가 이미 고른 성별을 덮지 않고 GA에도 보내지 않는다.
- `RevealMotion`: 사진 위에 삼정 띠가 그려지는 공개 모션. "건너뛰기" 버튼이 있고 `prefers-reduced-motion`이면 모션 없이 바로 결과(`revealTimeline.ts`의 `revealPlan`).

## 메뉴·메인 (4a)
- 메뉴와 묶음은 `src/content/navigation.ts` 한 곳에서 정의한다(TABS, CATEGORIES, tabForPath). 홈 묶음 탭·허브(`/face-tests`, `/unse`)·하단 탭바·푸터가 모두 이걸 쓴다. 새 테스트를 추가하면 CATEGORIES에 항목을 넣는다.
- 하단 탭바 `BottomTabBar`(모든 페이지, no-screenshot). 본문은 탭바 높이만큼 아래 여백이 있다.
- 메인 순서(2026-11-07 개편 1단계, 설계 `docs/superpowers/specs/2026-11-07-site-revamp-design.md`): 관상 히어로(`FaceHero`, "내 관상 보러 가기") → 시즌 카드(`SeasonCard`, `src/content/season.ts`만 바꾸면 교체: 평소 /saju, 12/1~1월 /fortune 신년운세 — 교체값은 파일 주석) → 띠 칩(`ZodiacPicker`) → 친구랑 같이 해봐요(`PlayTogether`: 동물상·얼굴 궁합·MBTI 궁합·삼국지, 관상은 히어로와 겹쳐 뺌) → 쿠팡 배너 → 시즌 추천 → 묶음 탭 → FAQ. 홈 FAQ는 `src/content/homeFaq.ts`(화면·구조화 데이터 공용).
- 하단 탭: 홈 / 관상(`/face-tests`) / 사주·운세(`/unse`) / 궁합(`/mbti`). URL은 그대로 두고 이름만 바꿨다.
- 허브 순서: 관상·얼굴 테스트 = [관상·동물상] 내 관상 풀이 → 동물상, [삼국지로 보는 얼굴] 닮은꼴 → 우리 팀 → 월드컵 → 열전 → 영상 → 일기토. 사주·운세 = 내 사주 풀이 → 신년운세 → 띠별 → 오늘의 운세, [MBTI] 오늘의 MBTI 운세. 궁합·MBTI = 얼굴 궁합 → MBTI 궁합 계산기 → MBTI 유형별 풀이(오늘의 MBTI 운세는 사주·운세에만).
- 푸터는 같은 데이터를 쓰되 `footer: false` 항목은 뺀다(삼국지는 닮은꼴·열전만 푸터에).
- 결과 사이 연결: `NEXT_BY_TEST`(navigation.ts, 같은 줄기 1 + 다른 줄기 1) → `components/result/NextSteps`("이어서 보면 좋아요"). 사주·신년운세·띠별 글·오늘의 운세·관상·동물상·삼국지·MBTI 유형·MBTI 궁합 계산기에 붙어 있다. 사진 결과에서는 같은 사진 칸을 `NextTests`가 맡으므로 NextSteps는 다른 줄기만 보인다(`withPhoto`). GA `next_test_click(test_name=간 곳)`. 생년월일 넘기기는 아직 없다(링크만).
- 디자인 토큰·글꼴은 위 "디자인 시스템 (4b 뉴트럴)" 참고.
- 참여자 수·인기 순위 같은 숫자는 실제 집계 전까지 넣지 않는다(테스트로 막음).

## 신년운세 (연도별 갱신)
- 기준 연도: `src/lib/fortuneYear.ts` (현재 2027 정미년). 해가 바뀌면 이 값과 `fortuneDB.띠별올해`·`오행.*.올해조언`, `src/content/fortune2027Zodiac.ts`(띠별 페이지 본문)를 함께 갱신한다.
- 사주 계산 `src/lib/saju/engine.ts`(`computeSaju`, manseryeok 래퍼, 절기 시각·자정 경계·서머타임 반영). `src/lib/fortuneService.ts`가 이를 불러 네 기둥(시간을 알 때)·오행 집계·세운을 만들고, 강한·약한 오행도 이 집계로 정한다. 시간 입력은 13칸(`HOUR_SLOTS`), 성별은 받지 않아 대운은 없다. 음력 입력은 양력으로 변환(윤달 포함) 후 계산. `src/lib/saju.ts`의 `년주계산` 등은 일진 엔진용 호환 래퍼.
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

## 오늘의 운세 (일진 엔진)
- 계산: 내 년주(60갑자) × 오늘 일진의 천간 합·충·생극 + 지지 육합·삼합·형·충 → 별점·한마디·근거·영역 4(재물·연애·일·건강)·행운 색/시간/방향. 결정적 순수 함수.
- 파일: `src/lib/dailyEngine/{relations,index,format}.ts`, 문장 `src/content/dailyFortuneText.ts`(조사는 `lib/josa.ts`), 설계 `docs/superpowers/specs/2026-11-05-daily-fortune-engine-design.md`.
- 날짜는 `kstDate` 기준이고 브라우저에서는 마운트 뒤 계산(정적 HTML의 어제 방지). 띠 모드(홈 `ZodiacPicker`)는 일간 오행 × 띠 오행으로 계산한다.
- `/fortune/daily?year=1990&early=1` 딥링크는 읽은 뒤 `year`/`early`만 주소에서 지운다(utm은 유지).
- 생년은 GA·공유·저장 이미지에 넣지 않는다. 캡처 제목은 "경오년 말띠".
- 테스트 `npx vitest run tests/dailyEngine`(60×60 분포 고정). 홈 번들에 `fortuneDB`·`DailyFortuneCard`를 넣지 않는다(stage4a 테스트).

## 아침 운세 푸시
- 구조: 오늘의 운세 카드의 `PushToggle` → `/api/push/subscribe` → Supabase `push_subscriptions`(년주·희망 발송 시각 `send_at` 저장) → pg_cron이 30분마다 `/api/push/send` 호출(그 시각 창의 구독만 발송) → web-push 발송 → 알림 클릭 시 `/fortune/daily?gz=<년주>` 착지.
- 파일: `src/lib/push/{text,validate,store,send,guard,client}.ts`, `src/app/api/push/{subscribe,send}/route.ts`, `src/components/fortune/PushToggle.tsx`, `public/sw.js`(push·notificationclick), `docs/push-subscriptions.sql`, 설계 `docs/superpowers/specs/2026-11-05-daily-push-design.md`.
- 환경변수 4개(Vercel): `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`(`mailto:…`), `PUSH_CRON_SECRET`. 없으면 버튼이 숨고 API는 503(빌드는 없이도 통과). **환경변수를 넣거나 바꾼 뒤에는 재배포가 필요하다**(`NEXT_PUBLIC` 키는 빌드 때 코드에 박힌다). VAPID 키 생성: `npx web-push generate-vapid-keys`.
- **VAPID 키는 교체하지 않는다.** 교체하면 기존 구독자 전원이 403으로 끊기고 5일 뒤 삭제된다; 꼭 교체해야 하면 사용자가 버튼을 다시 눌러야 한다.
- DB·스케줄: `docs/push-subscriptions.sql`을 Supabase SQL Editor에서 실행 -> 확장(pg_cron·pg_net)은 SQL 또는 Dashboard > Database > Extensions에서 켜고 -> 파일의 '한 번만 실행' 블록으로 Vault에 `push_cron_secret` 넣고(중복 실행 금지) -> 그 아래 cron 블록 주석 해제(cron 하나: `*/30 * * * *`, 이름 `daily-push-every-30m`). 이전 3개 스케줄(`daily-push-0830`·`-0845-retry`·`-0900-retry`)이 남아 있으면 `cron.unschedule`로 지운다.
- 알림 시각: 30분 단위 슬롯 05:00~23:30, 기본 08:30(열 `send_at`, check·인덱스는 SQL 파일). 호출 시각(KST)을 30분 경계로 스냅(+5분 허용, `snapSlot`)한 값이 `to`이면 발송 창은 `(to−60분, to]` — 직전 회차를 놓쳐도 다음 회차가 보정한다. 자정에서 잘리므로 23:30 슬롯은 재시도가 없다(`slotWindow`, `src/lib/push/send.ts`). 슬롯 라벨은 `src/lib/push/slotLabel.ts`.
- 엣지: 구독은 됐는데 IndexedDB 쓰기가 실패하면 sendAt이 유실돼 서버 기본값 08:30으로 간다.
- 롤백: `select cron.unschedule('daily-push-every-30m');` (하나)
- 아침 점검(SQL Editor):
  1. `select * from push_send_log where sent + failed + removed > 0 or day = current_date order by id desc limit 10;`(최근 회차들, `slot_to`로 회차 구분) + 일별 요약 `select day, count(*) runs, sum(sent) sent, sum(failed) failed, sum(removed) removed from push_send_log group by day order by day desc limit 7;`
  2. `select j.jobname, d.status, d.start_time, d.return_message from cron.job_run_details d join cron.job j using (jobid) order by d.start_time desc limit 10;` (최근 10회차)
  3. `select id, status_code, error_msg, created from net._http_response order by created desc limit 6;` (6시간만 보관)
  4. `select ganji, count(*), count(*) filter (where fail_count > 0) as failing from push_subscriptions group by rollup (ganji) order by ganji;`
- 로그 행이 없으면 실패다(401 비밀 불일치·503 환경변수·500 Supabase/VAPID). cron 행은 요청을 큐에 넣기만 해서 항상 succeeded로 보인다. 서버 로그엔 `[push] send failed: unauthorized|disabled|error`만 남는다(500이면 0건 행도 기록).
- 수동 발송: `curl -X POST -H "Authorization: Bearer $PUSH_CRON_SECRET" https://unse-ai.com/api/push/send` (www 말고 정규 도메인). 지금 KST 시각 기준 한 시간 창의 구독만 보낸다. 그날 KST 발송으로 기록되니(기기당 하루 1회) 자정 뒤에 시험하면 다음 날 몫이 소진된다.
- 규칙: 기기당 하루 1회(`last_sent_on`, KST). 실패는 하루 1회만 집계(`push_bump_fail`)·5회 누적 삭제, 404/410은 즉시 삭제. 구독 endpoint는 허용 호스트(fcm·mozilla·apple·windows·samsung)만. 기기별 발송 타임아웃 10초, 한 번 호출 예산 40초(maxDuration 60). 응답·로그의 `sent`는 실제 발송 수이고 `unrecorded`는 그중 `last_sent_on` 기록에 실패한 수(다음 회차의 창에 걸리면 한 번 더 갈 수 있음). 생년은 저장·전송하지 않고 년주 2글자만. endpoint는 로그에 남기지 않는다.
- 로그: `push_send_log`

| 컬럼 | 뜻 |
|------|-----|
| day, finished_at | KST 날짜, 행을 넣은 시각(호출이 끝난 때) |
| sent, failed, removed | 성공·실패·삭제 수 |
| ms | 소요 시간 |
| slot_to | 이 회차의 창 끝 시각(KST, `HH:MM`) |

- 버튼에는 `알림 시각` select(30분 슬롯)가 있다. 다른 년주의 운세를 보는 중이면 잠기고(내 구독 년주와 다르므로), 시각을 바꾸면 저장된 년주로 다시 구독한다.
- 버튼 상태 순서(`pushUiState`): 카카오톡 인앱(`kakao`) > iOS 비설치(`ios_install`) > 미지원·키 없음(`unsupported`, 숨김) > 권한 거부(`denied`) > `off` > `on`. iOS는 홈 화면에 추가한 뒤에만 구독 가능, 카카오톡 인앱은 외부 브라우저로 열어야 한다.
- 테스트 `npx vitest run tests/push`.

## 페이지별 기능

| 경로 | 기능 | 제한 | 사용 기술 |
|------|------|------|-----------|
| `/` | 메인 | - | - |
| `/face2` | 무료 관상 (오행 얼굴형 5 × 삼정 3 = 15유형) | 무제한 | MediaPipe + 15유형 분류 |
| `/animal` | 동물상 테스트 | 무제한 | face-api.js + DB |
| `/samguk` | 삼국지 닮은꼴 | 무제한 | MediaPipe + 프로필 매칭 |
| `/samguk/videos` | 삼국지 쇼츠 모음(격자·세로 피드) | - | YouTube API/RSS, ISR 1시간 |
| `/fortune` | 신년운세 | - | DB 기반 |
| `/fortune/daily` | 오늘의 운세 | - | 일진 엔진(`lib/dailyEngine`) |
| `/exam/meme` | 밈 능력고사(매일 5문제·성적통지표·친구 대결) | 하루 한 번(기기 기준) | 얼린 회차(`src/content/exam`) + `lib/exam` |

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
  - 사진 테스트 시작 화면을 뺀 모든 내용 페이지와 공유 착지(subId `share-<종류>`, 우리 팀은 `share-team`)에 있다. 오늘의 MBTI 운세는 결과 화면에만 있다.

## 방문 통계 (GA4)
- 측정 ID `G-L99JPMPT9D` (`src/lib/analytics.ts`), `layout.tsx`의 `ga4-init` 스크립트. 운영 주소(unse-ai.com, `PROD_HOST_SOURCE`)가 아니면(로컬·Vercel 미리보기) gtag.js를 받지 않고 config도 안 해서 실제 통계에 안 섞인다(E2E는 `dataLayer`로 검사).
- 이벤트는 `track()`만 쓴다: `photo_selected`, `test_start`, `photo_fail(result_id: noface·frontal·read·tool)`, `result_view(result_id)`, `share_click(method: link·save_image·share)`, `fortune_submit`, `shared_landing`, 푸시 `push_subscribe(result_id=년주 2글자)`, `push_unsubscribe`, `push_blocked(result_id: kakao·ios_install·denied·server)`.
- **사진 분석 실패 모니터링**: GA 탐색에서 `photo_fail` 이벤트를 `result_id`(이유) × 브라우저·OS로 본다. `test_start` 대비 `result_view` 사용자 수가 특정 브라우저에서만 떨어지면 그 환경의 문제. 실패 문구는 `lib/face/analyzePhoto.ts` `failText`(고개 돌림은 방향·정도 숫자까지). GA 준비 전 이벤트는 잠시 모았다가 보낸다. / `test_name`: face·animal·samguk·fortune·daily·mbti_match·zodiac·mbti(띠·MBTI 글의 공유하기)·saju(내 사주 풀이)
- **사진·생년월일·얼굴 수치는 보내지 않는다.** `track()`은 허용 키(test_name, result_id, method)와 유형 키 형식(한글·영문·숫자 24자 이내, 숫자 4자리 연속 금지)만 통과시킨다. 결과는 유형 키만(fox, caocao, 재물상, 띠, INFP_ENTJ).
- 일기토 퍼널(값은 `result_id`에 인코딩, 키 추가 없음): `duel_wave`(보스 웨이브 도달, `w06`~`w36`), `duel_end`(`<시작장수>_<c|l>_<마지막으로 넘은 보스>` 예 `guanyu_l_w18`), `duel_resume`, `duel_abandon`.
- 일기토 판 요약은 GA와 별도로 `/api/duel/run` -> Supabase `duel_runs`(`docs/duel-runs.sql`)에 판마다 1회 저장. 시작 장수·도달 웨이브·결과·보상 id·기기 종류·시간 구간만, IP·runId는 저장하지 않는다. 리포트는 `scripts/duel-real-stats.ts`.
- 개인정보처리방침 5항에 GA 수집 안내와 일기토 플레이 기록 안내.

## API Keys
없음 (Gemini 제거됨). `/face`는 `next.config.ts`에서 `/face2`로 308 리디렉션.

---

## 주요 로직

### 무료 관상 (/face2) 흐름
1. 이미지 업로드 (성별은 추정해 미리 선택) → 2. `analyzePhotoDetailed` → `classifyGuansang` → `readPalaces` → 3. RevealMotion 후 결과 표시. 자세한 내용은 아래 "관상 2판" 절

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
- `sw.js` v2 - 서비스 워커 (캐싱, 오프라인 지원, `push`·`notificationclick` 핸들러)
- PNG 아이콘 `public/icons/{icon-192,icon-512,apple-touch-icon-180,badge-96}.png` (`scripts/make-push-icons.mjs`)
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

## 삼국지 인물열전 (/samguk/people)

127명의 연의·정사 열전, 관계도, 응원·투표. 설계: `docs/superpowers/specs/2026-11-03-samguk-yeoljeon-design.md`, 진행표: `docs/samguk-people-progress.md`.

| 위치 | 내용 |
|------|------|
| 라우트 | `/samguk/people`(허브: 삼국 지도·세력 버튼·이름 검색·인물 카드·오늘의 인물, 아래쪽 `#relations`에 닫힌 세력별 관계도·관계 글), `/samguk/people/[id]`(열전 127개 정적, `dynamicParams=false`), `/samguk/people/ranking`(응원 순위, ISR `revalidate=3600`) |
| 데이터 | `src/content/samgukPeople/<id>.ts`(인물 한 명당 한 파일, 형식은 `types.ts`) → `index.ts` 등록(`PEOPLE`, `PEOPLE_IDS`). 인물 id는 `samgukDB`와 같다. 파이프라인: 작성 → 사실 검토 → 쉬운 말 → 재미 → 인용 점검 |
| `ids.ts` | 클라이언트·닮은꼴 페이지가 열전 id 목록만 가볍게 쓰려는 파일(인물 본문 import 금지). **`index.ts`와 같아야 하며 테스트(`tests/peopleLinks.test.ts`)가 어긋남을 잡는다.** 인물을 추가하면 둘 다 고친다 |
| 조회 | 열전 코드는 `lib/people/characters.ts`의 `characterById`를 쓴다(초상화 대기 인물도 포함. `samgukDB`의 `getCharacterById`는 대기 인물이 빠진다). 관계 화면 말은 `relationLabel`(부녀·모자·남매 등, 데이터 `type`은 그대로) |
| API | `/api/people/vote`(POST: JSON만, 같은 사이트 Origin만, 10분 60회), `/api/people/stats`(GET). 환경변수 `SUPABASE_URL`·`SUPABASE_SERVICE_KEY`(없으면 503, 화면은 숫자를 숨김). 선택 `PEOPLE_VOTE_SECRET`(투표자 해시 키, 없으면 서비스 키 사용) |
| DB | `docs/people-votes.sql`. 2026-11-04 Supabase 프로젝트 real-estate(일기토 테이블과 같은 곳)에 실행 완료(RLS 켜고 service_role만 접근, 월드컵 종류 `cup_match`·`cup_win`도 허용). 테이블이 없으면 투표가 조용히 꺼진다 |
| 중복 방지 | 하루마다 바뀌는 해시(`HMAC(날짜, 기기id\|IP)`)로 같은 날 같은 대상은 한 번. `pv` 쿠키는 서명값 `<uuid>.<발급일YYYYMMDD>.<HMAC-SHA256(비밀, pv\|uuid\|발급일) 앞 32자>`(`signPvCookie`·`verifyPvCookie`)이고 틀리면 쿠키 없음으로 본다. **첫날(쿠키가 없거나 발급일이 오늘)은 기기id를 `new`로 고정해 IP 기준**, 다음 날부터 쿠키 uuid로 센다(위조·즉석 발급 쿠키는 첫날 IP 기준으로 묶이고, 쿠키 uuid는 `HMAC(비밀, pvid\|IP\|발급일)`이라 IP·날짜마다 하나만 발급돼 비축을 막는다(IP를 바꾸며 모은 쿠키까지 막지는 못함). IP·쿠키 원본은 저장하지 않는다. 같은 IP의 첫 방문자끼리는 첫날 표가 겹칠 수 있어 `counted:false` 문구는 "오늘 응원이 반영됐어요"·"오늘 투표가 반영됐어요" |
| 허브 구조 | 서버 `page.tsx`가 `lib/people/hubCards.ts`로 카드 최소 필드(id·이름·자·세력·초상화·첫 문장·funFacts[0])만 뽑아 클라이언트 `PeopleBrowser`에 넘긴다. 127명 카드는 모두 서버 HTML에 있고(`li[data-person]`, 숨김은 `hidden` 클래스) 필터·검색·더 보기·오늘의 인물은 `lib/people/hubFilter.ts` 순수 함수. 지도는 직접 그린 SVG `ThreeKingdomsMap`(글자 viewBox 13 이상). 처음 12명은 `hubCards.ts`의 `POPULAR_IDS` 고정 순서(응원 순위는 허브가 정적이라 읽지 않음). 오늘의 인물은 한국 날짜로 브라우저에서 계산(`todayIndex`, 127일 동안 겹치지 않음) |
| 표시 규칙 | 응원은 실제 숫자로 보인다(0이면 "첫 응원을 남겨 보세요", 1+는 `응원 N번`, 순위를 알면 "지금 응원 순위 N위", 순위는 stats 응답의 `rank`). 기록이 꺼져 있으면(503) 숫자·순위를 숨긴다. 투표 비율은 투표 전엔 숨기고 합이 10 미만이면 "지금 N명이 투표했어요". 순위 페이지는 응원이 1번이라도 있으면 실제 순위를 보이고, 응원 없는 인물은 닫힌 세력별 목록 |

**내용 규칙**
- 실제 기록이 없는 명언을 만들지 않는다(`famousQuote: null`). 말을 쓰면 출처(`정사`·`배송지 주`·`연의`)를 표시한다.
- 연의에만 있는 이야기는 `life`, 정사는 `historyNote`, 차이는 `novelVsHistory`에 나눠 쓰고, 요약(`summary`)에 연의 사건을 쓰면 "연의에서는"처럼 밝힌다(검색 미리보기가 된다).
- 해요체, 어려운 말에는 괄호 풀이. 관계 설명(`relations.note`)도 해요체나 짧은 명사구로 쓴다(`~다` 종결은 테스트로 막음).
- `rivalId`는 부부·혼인·부자·형제·숙질·친족이 아닌 인물(테스트로 확인).

---

## 삼국지 장수 월드컵 (/samguk/cup)

초상화가 있는 장수 16강(또는 8강)에서 카드 글을 읽고 둘 중 하나를 고르는 월드컵. 열전 데이터를 그대로 재사용한다(새 문장 없음). 설계: `docs/superpowers/specs/2026-11-04-samguk-worldcup-design.md`, 계획: `docs/superpowers/plans/2026-11-04-samguk-worldcup.md`.

| 위치 | 내용 |
|------|------|
| 라우트 | `/samguk/cup`(판 고르기, ISR 3600), `/samguk/cup/[board]`(게임, `?with=<id>`면 그 장수를 대진에 반드시 포함), `/samguk/cup/ranking`(판별 우승 순위·경기 승수, ISR 3600), `/samguk/cup/r/[board]/[id]`(공유 착지: noindex·canonical `/samguk/cup`·사이트맵 제외, 버튼 `나도 해보기`). 사이트맵에는 `/samguk/cup`·`/samguk/cup/ranking`만 |
| `src/lib/cup/boards.ts` | 판 키(`warrior`·`strategist`·`women`·`random`)·판 이름·`boardPool`·대진 뽑기(`drawEntrants`), `cupBoardFor(id)`(열전·닮은꼴 결과의 "월드컵 하기" 링크가 열 판: 무장 → 책사 → 여인 순 첫 판, 어디에도 없으면 random, 초상화 대기·모르는 id는 null이라 링크를 그리지 않음). 클라이언트에서도 쓰므로 열전 본문을 가져오지 않는다 |
| `cards.ts` | 카드 데이터(열전 `summary` 첫 문장·`funFacts`)와 `meetNotes`(`relations.note`와 `source`). 열전 본문을 읽으므로 서버 전용 |
| `game.ts` | 진행 상태(`startCup`·`pick`·`currentMatch`)와 비율 문구. 순수 함수 |
| `votes.ts` | 월드컵 API 검증(`validateCupVote`)·저장 행(`cupRow`)·속도 제한 `cupGuard` |
| `share.ts` / `shareLanding.ts` | 공유 링크·문구·미리보기 이미지 주소(클라이언트 안전) / 공유 링크 검사(서버·엣지 전용) |
| `types.ts` | 카드 타입(클라이언트도 가져옴) |
| 컴포넌트 | `src/components/cup/`: `CupGame`(대결), `CupResult`(끝 화면), `CupCardButton`, `CupWithLink`(열전·닮은꼴 결과의 `?with=` 링크) |
| 판 구성 | `warrior` = `stats.무력` 상위 16(동점 `통솔`), `strategist` = `stats.지력` 상위 16(동점 `정치`, `huatuo` 제외), `women` = `gender '여'` 전원(16명 이상이면 무작위 16, 8~15명이면 무작위 8), `random` = 전원에서 무작위 16. 동점은 id 오름차순. 출전자는 초상화가 있는 인물(`samgukCharacters`)만. 능력치 기준 설명은 "코에이 스타일 무력/지력 기준"으로 쓰고 "역사적 강함"이라 쓰지 않는다 |
| 저장 | `people_votes` 표(`docs/people-votes.sql`)에 `kind 'cup_match'`(target = `pairKey(a,b)`, 판과 무관, option = 고른 id)와 `kind 'cup_win'`(target = 판 키, option = 우승 id). 개인정보는 열전 투표와 같은 방식(해시만 저장) |
| API | `POST /api/people/cup`(JSON만, 같은 사이트 Origin만, 열전 투표와 **따로** IP당 10분 200회). 투표자 판별은 열전과 같은 `pv` 쿠키·`resolveVoter`. 환경변수는 열전과 같고 없으면 503(화면은 숫자를 숨김) |
| SQL | `docs/cup-votes.sql`(집계 함수 `cup_pair_stats`·`cup_win_counts`·`cup_match_wins`와 `(kind, target)` 색인). **아직 Supabase에서 실행하지 않았다.** 배포 전에 사용자 승인을 받고 컨트롤러가 실행한다. API가 503을 주는 때는 환경변수가 없을 때뿐이다. 환경변수가 있는데 SQL이 아직이면 표는 그대로 저장되고(표는 이미 `cup_match`·`cup_win`을 허용), 쌍 집계 읽기만 실패해 API는 200에 `others: null`을 돌려주며 화면은 `지금은 다른 사람 선택을 불러오지 못했어요`를 보이고, 판 고르기·순위 페이지는 숫자를 숨긴다. `docs/people-votes.sql`은 `cup_match`·`cup_win` 종류를 이미 허용한다(실행 완료) |
| GA | `TestName`에 `'cup'`. `cup_start(result_id=<판>)`, `cup_end(result_id=<판>_<우승 id>)`, 공유는 `share_click(test_name='cup')`. 값은 24자 이하(`strategist_huangyueying` 23자가 최장, 판 키+후보 id 전 조합을 테스트로 확인) |

**표시 규칙**
- 가짜 숫자 금지: 비율·순위·판 수는 실제 집계만 보이고, 집계가 없거나 못 읽으면 숨긴다.
- 비율 문구(내 표 제외, 판과 무관하게 두 사람 쌍 기준): 다른 사람 0명 `이 대결을 처음 골랐어요`, 1~9명 `지금까지 N명이 이 대결을 골랐어요`, 10명 이상 `다른 사람들은 N%가 ○○를 골랐어요`(을/를은 받침으로), 실패 `지금은 다른 사람 선택을 불러오지 못했어요`.
- 질문 `둘 중 누가 더 끌리나요?`, 진행 표시 `<판 이름> <N강> · <i>/<경기 수>`, 만난 장면 머리 `이 둘이 만난 장면:`, 카드 읽을거리 머리 `알고 보면:`. 기록에 없는 문장은 새로 쓰지 않는다.
- 쿠팡 다이나믹 배너: 판 고르기(`cup-hub`, 판 목록 아래)·끝 화면(`cup-<판>`, 버튼 아래·우승 순위 위)·순위(`cup-ranking`)·공유 착지(`share-cup`)에 있고 대결 중에는 없다.
- 끝 화면: `나의 최애 장수`, 결승까지 이긴 상대 줄, 버튼 `공유하기`·`<이름> 열전 보기`·`다른 판 하기`, 판별 우승 상위 5(집계 있을 때만)와 `전체 순위 보기`.

---

## 삼국지 쇼츠 연결 (/samguk/videos)

유튜브 채널(`@unse_ai`, 채널 `UCQvI9qIC3pIq_24_x5XE_3g`) 쇼츠를 사이트에 잇는다. 설계: `docs/superpowers/specs/2026-11-04-samguk-videos-design.md`. 롱폼(181초 이상)은 어느 화면에도 내지 않는다.

| 위치 | 내용 |
|------|------|
| 데이터 흐름 | `lib/videos/fetch.ts`의 `getChannelVideos()`: YouTube Data API(업로드 재생목록 `UUQvI9qIC3pIq_24_x5XE_3g`) → 실패하면 RSS(`feeds/videos.xml`, `isShort=true`·`durationSec=null`) → 그래도 실패하면 **빈 목록**(throw 안 함, 빌드 안 깨짐). 모든 fetch는 `revalidate: 3600`(ISR 1시간). 영상이 0편이면 열전·결과·허브의 영상 칸이 통째로 사라지고 `/samguk/videos`만 "아직 올라온 영상이 없어요" |
| 파일 | `lib/videos/{types,format,parse,fetch,forPerson,jsonld}.ts`, `components/videos/*`(VideoPlayer·VideoFeed·VideosBrowser·PersonVideos·RelatedVideosRow·Sanggwando·ResultVideos·ResultVideoBlock·VideoStrip), `app/samguk/videos/page.tsx`, `/api/samguk/videos/[id]`(결과 화면이 클라이언트에서 영상 한 편을 받는 길). 영상 id는 `/^[A-Za-z0-9_-]{11}$/`만 쓴다 |
| 보정 파일 | `src/content/videoOverrides.ts`: 영상 id → `{ people?, hide?, event? }`. **숨기려면** `hide: true`, **인물을 고치려면** `people: [id, …]`(첫째가 주인공). 보정이 해시태그 추출보다 우선한다. 해시태그는 `allSamgukCharacters`의 `name`과 정확히 같을 때만 인물 id로 바뀐다 |
| 환경변수 | `YOUTUBE_API_KEY`(Vercel Production, Google Cloud 프로젝트 `unse-ai-513714`, YouTube Data API v3만 허용). **`lib/videos/fetch.ts`에서만 읽는다.** 없으면 RSS 경로. `tests/videos/boundaries.test.ts`가 클라이언트 파일의 서버 모듈·키 사용을 막는다 |
| 재생 | 첫 화면엔 iframe 없음, 누르면 `youtube-nocookie.com/embed/<id>?autoplay=1&playsinline=1` 하나만. 24시간 안이면 `NEW`, 그 뒤 `조회수 1,008회`(규칙은 `format.ts` `videoBadge` 한 곳, 열전 첫 카드는 ` · 1:03` 길이도 붙임). 열전 첫 줄은 본인 영상 전부(2편 이상이면 같은 크기 카드를 가로로 넘김). 피드는 `?v=`를 `pushState`로 쌓고 뒤로 가기·`popstate`로 닫는다(딥링크로 들어왔으면 닫을 때 `replaceState`) |
| 노출 위치 | **열전**(`/samguk/people/[id]`) 순서: 요약 → 1분 영상 → 쿠팡 → 상관도 → 관계 인물 영상 → 닮은꼴 배너. **결과 화면**: 공유 버튼·쿠팡 아래 "내 장수 이야기, 1분 영상" 카드와 엮인 장수 칸(둘 다 `no-screenshot`). **허브 띠** `VideoStrip`: 열전 허브 지도 아래, `(match)/layout.tsx`(시작 화면·결과·공유 착지·우리 팀) 안내문 위. 누르면 `/samguk/videos?v=<id>` 피드(canonical은 `/samguk/videos` 하나) |
| GA | `video_play {slot, result_id}`, `video_subscribe_click {slot}`, `video_test_click {slot}`. slot은 `people`·`result`·`videos`·`hub`. 결과(`result`)·허브(`hub`) 카드 클릭도 그 slot으로 `video_play`를 보내고, 이어서 피드에서 재생하면 slot `videos`로 한 번 더 보내므로 건수가 겹친다. 영상 id의 `-`는 `_`로 바꿔 `result_id`에 넣는다(`SAFE_VALUE`는 그대로). `next_test_click`과 뜻이 달라 새 이벤트 |
| tsconfig | `scripts/shorts`(쇼츠 제작 스크립트, 별도 의존성)는 `exclude`에 있다. 없으면 `next build`가 이 폴더까지 타입 검사해 실패한다 |
| 채널 프로필 링크 | 사용자가 유튜브 스튜디오에서 직접 건다: `https://unse-ai.com/samguk/videos?utm_source=youtube&utm_medium=profile&utm_campaign=channel` (`?v=`는 공유용이라 프로필에 쓰지 않는다) |

---

## 자주 수정하는 파일

| 작업 | 파일 |
|------|------|
| 관상 해석 텍스트 수정 | `src/content/guansang.ts` (금지어 테스트 `tests/guansang/copy.test.ts`) |
| 삼국지 인물 얼굴 프로필 | `src/lib/samguk/profiles.ts` |
| 무료 관상 UI | `src/app/face2/page.tsx` |
| 메인 페이지 | `src/app/page.tsx` |
| 페이지 설명 본문/FAQ | `src/content/pageGuides.ts` |
| 홈 FAQ(화면·구조화 데이터) | `src/content/homeFaq.ts` |
| 오늘의 운세 문장 | `src/content/dailyFortuneText.ts` (검증 `npx vitest run tests/dailyEngine`) |
| 푸시 알림 문구 | `src/lib/push/text.ts` |
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

### IndexNow (네이버·빙 색인 알림)
- 네이버 '웹 페이지 수집 요청'은 하루 50건이 한도라, 페이지를 많이 바꾸면 IndexNow로 한 번에 알린다. 네이버(`searchadvisor.naver.com/indexnow`)와 공용(`api.indexnow.org`, 빙 등에 공유) 두 곳에 보낸다.
- 키 파일 `public/bdd5889660e497f527dd0a32a46b7f0f.txt`(공개값, 규격상 노출). 스크립트 `scripts/indexnow.mjs`의 `KEY`와 같아야 한다.
- 배포가 끝난 뒤: `node scripts/indexnow.mjs`(사이트맵 전체) 또는 `node scripts/indexnow.mjs /경로 /경로`(바꾼 페이지만), 미리 보기는 `--dry-run`. 200·202면 접수, 403은 키 파일 확인 실패.

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

1. **face-api.js(성별 추정)**: `'use client'` 필수 (브라우저 전용)
2. **AI 제한**: localStorage 기반이라 브라우저별로 따로 카운트
3. **이미지 캡쳐**: `modern-screenshot` 사용 (CSS lab() 호환)
4. **모델 파일**: `/public/models/`에 `face_landmarker.task`(MediaPipe)와 성별 추정용 tiny_face_detector·age_gender가 있어야 작동
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

## 밈 능력고사 (/exam/meme, 1차 구현 2026-11-12)
- 설계: `docs/superpowers/specs/2026-11-11-meme-exam-design.md`, 계획: `docs/superpowers/plans/2026-11-12-meme-exam.md`. 서버 저장·집계·또래 비교·낱말 모음은 다음 계획(지금 화면에 정답률·상위 %·응시자 수 같은 숫자는 없다).
- 구조: 말 카드 `src/content/exam/meme-cards.json`(원본) → 얼린 회차 `src/content/exam/meme-rounds.json`(**뒤에 덧붙이기만**, 대결 링크가 옛 회차를 가리킨다) → 화면 `src/components/exam/ExamGame`(시작→문제→해설→채점→성적표 상태 기계). 순수 함수는 `src/lib/exam/`: `rounds.ts`(회차 만들기·뱃지·`EXAM_EPOCH`·오늘 회차 고르기), `score.ts`(점수·등급·별명), `link.ts`(대결 링크 `/exam/meme/r/<회차>-<OX 5글자>-<점수>-<등급>[h]`), `memory.ts`(기기 저장: 오늘 성적표·연속 응시, 저장소를 못 써도 던지지 않음).
- 회차 늘리기: 새 말을 승인하면 카드 한 장을 쓰고 `npx tsx --tsconfig tsconfig.json scripts/exam/make-rounds.ts --add=14`(`--print`는 저장 없이 출력). 이미 있는 회차는 다시 만들지 않는다. 오늘 회차 번호가 얼린 회차 수를 넘으면 마지막 회차를 다시 연다(그때부터 날마다 같은 문제이므로 **출시 전·후로 회차를 넉넉히 미리 만들어 둔다**). `EXAM_EPOCH`(1회차 날짜, 지금 2026-11-16)는 실제 출시 날에 맞춰 한 번만 고친다.
- 페이지: `/exam`(→ `/exam/meme` 리디렉션), `/exam/meme`, `/exam/meme/r/[code]`(공유 착지: noindex·canonical `/exam/meme`·사이트맵 제외, 잘못된 코드는 일반 시작 화면). 미리보기 `/api/og/result?kind=exam&grade=&correct=`. 홈 '친구랑 같이 해봐요' 카드와 푸터(`FOOTER_EXTRA`)에서 들어온다.
- GA: `exam_start(result_id=meme)`, `exam_end(result_id=meme_g<등급>)`, 공유 `share_click(test_name=exam)`, 착지 `shared_landing`. 문제별 정오·태어난 해는 보내지 않는다.
- 규칙: 해설은 카드의 `meaning`·`usage`·`origin`을 그대로 보여 준다(화면에서 문장을 짓지 않는다). 등급 표는 출시 뒤 바꾸지 않는다. 진행 중인 판은 시작한 회차로 끝난다(자정을 넘겨도). 문제마다 제한 시간이 다르다(`timeLimitMs`: 5초 + 읽을 글자×0.11초, 10~25초), 힌트는 한 판에 한 번(오답 둘 흐림, 그 문제 가산점 0). 테스트 `npx vitest run tests/exam`, E2E `e2e/exam.spec.ts`.
- (아래는 0단계 수집·카드 작성 기록)
- 후보 수집: `node scripts/exam/collect.mjs`(찾기+확인, 5분쯤), `--no-find`(확인만), `--all`(전부 다시). Playwright로 네이버 블로그 검색과 "<말> 뜻" 검색을 읽는다(공식 검색 API는 개발자센터에서 빠져 키 없이 읽음). 화면이 바뀌어 요약이 비면 `parseVerify`를 고친다.
- 설정 `scripts/exam/subjects/meme.json`: 검색어(`findQueries`), 씨앗(`seeds`, SNS에서 본 말을 손으로 넣는 곳), 금지어(`banned`), 뽑기 오탐 막는 말(`stopwords`).
- 결과 `docs/exam/meme-candidates.json`이 원본이다(`docs/exam/meme-candidates.md`는 11/11 손 조사 기록). 스크립트는 `status`까지만 정하고, **승인·보류·반려는 Claude가 `decision`에 이유와 함께 적는다**(사용자 결정). 사용자에게 하나씩 묻지 않는다. `used`는 출제한 말.
- 판정 기준: 서로 다른 출처 2곳 이상에서 뜻이 일치, 누구를 낮추지 않는 말(외모·집단·실존 인물 놀림, 욕설 원형은 반려), 대화 빈칸에 넣을 수 있는 말. 네이버 요약(AI 브리핑)은 틀릴 때가 있어 요약 하나만으로 승인하지 않는다.
- 새 말은 블로그보다 SNS가 빠르다. 쓰레드는 Aside 브라우저(로그인됨)로 "신조어 뜻", "요즘 유행어", "무슨 뜻이야"를 검색해 본 말을 `seeds`에 넣고 스크립트로 확인한다.
- 수집 틀은 과목별이다: `scripts/exam/subjects/<과목>.json` 하나(목록 사이트 `listSources`, 블로그 검색어, 씨앗, 금지어, 확인 검색어 꼬리 `verifySuffix`)를 만들고 `--subject=<과목>`으로 돌리면 `docs/exam/<과목>-candidates.json`이 생긴다. 밈 과목의 목록 사이트는 인스타공백닷컴 밈 사전(이름·시기만 가져오고 설명문은 옮기지 않는다). 이 사이트에서만 본 말은 네이버 요약이 같은 글을 인용했을 수 있어 독립 출처로 치지 않는다.
- 문제는 손으로 쓰지 않고 말 카드에서 찍어 낸다: 카드 `src/content/exam/meme-cards.json`(말·갈래·난이도·한 줄 뜻 `gloss`·원형·해설 세 줄·출처·구조화된 대화 `skit`) → `scripts/exam/make-rounds.ts`(엔진은 `src/lib/exam/rounds.ts`)가 유형 여섯(뜻 고르기·말 고르기·줄임말 풀기·줄이기·O/X·대화)으로 회차를 만든다. 새 말을 승인하면 카드만 한 장 쓴다. 대화(상황극) 문제는 한 회차에 많아야 하나(사용자: "상황극에 너무 매달리지 마").
- 레트로: 카드의 `when`(1990s·2000s·2010s·2020s·연도)이 문제 뱃지("90년대 레트로", "2026년". 신상·최신 같은 말은 안 붙임)가 된다. 1990s~2010s 카드는 레트로로 회차마다 셋째 자리에 한 문제(갈래 `code`는 삐삐 숫자). 사용자 뜻: 레트로는 어린 사람들이 푸는 재미라서 "옛날 말"이라 부르지 않는다. 뜻이 검색으로 확인 안 되는 옛날 말은 넣지 않는다(예: '캡', '0404'는 확인 못 해 뺌).
