# 영어판 연결 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/en` 아래에 영어 페이지(홈·전체·관상·동물상·얼굴 궁합과 그 결과 공유 착지)를 열고, 화면마다 언어 메뉴를 두고, 해외 방문자에게 "영어로 보기" 안내 띠를 띄우되 검색 로봇에게는 절대 자동 전환하지 않는다.

**Architecture:** 루트 레이아웃을 둘로 나눈다(라우트 그룹 `(ko)`와 `en`, 각자 `<html lang>`). 한국어 주소는 폴더만 `(ko)` 아래로 옮겨 하나도 바뀌지 않는다. 공용 컴포넌트는 `LocaleProvider`가 주는 언어로 문구를 고른다. `src/proxy.ts`(Next 16의 미들웨어 이름)가 처음 온 사람의 국가·브라우저 언어를 쿠키 하나로 남기고, 사용자가 고른 언어 쿠키가 있을 때만 그쪽으로 보낸다.

**Tech Stack:** Next.js 16.0.10 App Router(라우트 그룹, 여러 루트 레이아웃, `proxy.ts`), Tailwind 4, vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-13-visual-revamp-design.md` 5.5절(언어)·5.6절(검색). 영어 문구는 이미 `src/content/en/*`, 언어 목록은 `src/lib/i18n/locales.ts`에 있다(이 브랜치에 합쳐져 있음).

## Global Constraints

- 브랜치 `i18n-wire`(이 워크트리, main 8bc5331 + 영어 문구). push·머지 금지.
- **한국어 주소·제목·설명·canonical·구조화 데이터·본문은 하나도 바뀌지 않는다.** 폴더 이동은 `git mv`로만, 내용은 손대지 않는다(import 경로만 고친다).
- 검색 로봇(쿠키 없음)에게는 어떤 주소에서도 언어 때문에 리디렉션하지 않는다. 리디렉션은 사용자가 고른 `lang` 쿠키가 있을 때만, 그리고 그 페이지의 다른 언어판이 있을 때만.
- 언어 목록은 `locales.ts` 한 곳. 언어를 하나 더하는 일이 "목록 한 줄 + `src/content/<언어>/` 파일"로 끝나야 한다(일본어·중국어 예정).
- 영어판 1차 범위: `/en`, `/en/all`, `/en/face2`, `/en/animal`, `/en/face-match`, `/en/face2/r/[key]`, `/en/animal/r/[type]`, `/en/face-match/r/[pair]`. 나머지 페이지는 한국어만.
- 영어판에서는 카카오톡 공유·쿠팡 배너·부적 선물 줄을 빼고 기본 공유창(없으면 링크 복사)을 쓴다.
- 영어판 문구는 `src/content/en/*`만 쓴다. 화면에서 새 영어 문장을 짓지 않는다(필요하면 `ui.ts`에 더하고 테스트).
- 이모지·가짜 숫자 금지, 움직임 규칙(1~4단계)은 그대로.
- 커밋 메시지 한국어, 끝 줄 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. 작업마다 `npm test` 통과, E2E는 Task 2·6 끝에. 기존 무관 실패: `buttons.spec.ts` /exam/meme(Supabase).

## Review Focus

1. **한국어 페이지가 그대로인가**: 폴더 이동 뒤 모든 한국어 주소가 같은 HTML(제목·canonical·본문)을 내야 한다 → Task 2에서 이동 전후 서버 HTML의 `<title>`·canonical을 전 주소 비교.
2. **로봇 리디렉션 금지**: 쿠키 없는 요청은 미국 IP·영어 브라우저여도 307이 나오면 안 된다 → Task 3 단위 테스트.
3. **언어 메뉴가 갈 곳이 없을 때**: 영어판이 없는 한국어 페이지에서 English를 누르면 영어 홈으로 가고 "This page is only in Korean" 한 줄 → Task 4 테스트.
4. **결과 공유 링크**: 영어 결과를 공유하면 `/en/...` 착지로 가고, 미리보기 글도 영어여야 한다 → Task 5.
5. **`<html lang>`**: `/en` 아래는 `en`, 나머지는 `ko` → Task 2 E2E.

---

### Task 1: 언어 바탕(Provider·사전·주소 짝)

**Files:**
- Create: `src/lib/i18n/LocaleProvider.tsx`(클라이언트 context), `src/lib/i18n/dict.ts`, `src/lib/i18n/alternates.ts`
- Test: `tests/i18n/alternates.test.ts`

**Interfaces:**
- Consumes: `LOCALES`, `Locale`, `localePath`(`src/lib/i18n/locales.ts`), `src/content/en/ui.ts`.
- Produces:
  - `LocaleProvider({ locale, children })`, `useLocale(): Locale`(Provider 밖이면 `'ko'`).
  - `t(locale: Locale, key: UiKey): string` — ko 값은 지금 화면에 있는 한국어 그대로(새 `src/content/ko/ui.ts`에 en과 같은 키로 옮겨 적는다), en은 `src/content/en/ui.ts`.
  - `EN_PATHS: string[]` — 영어판이 있는 한국어 경로 패턴: `'/'`, `'/all'`, `'/face2'`, `'/animal'`, `'/face-match'`, `'/face2/r/'`, `'/animal/r/'`, `'/face-match/r/'`(끝이 `/`면 접두어).
  - `counterpart(path: string, to: Locale): string | null` — 다른 언어판 주소(쿼리 유지), 없으면 null. 예: `('/face2','en')`→`'/en/face2'`, `('/en/animal/r/cat?s=88','ko')`→`'/animal/r/cat?s=88'`, `('/saju','en')`→null.
  - `languageAlternates(path: string): Record<string, string> | undefined` — Next metadata `alternates.languages`용 `{ ko, en, 'x-default' }`(x-default=ko), 짝이 없으면 undefined.

- [x] **Step 1: 실패하는 테스트** (`counterpart` 위 예 4개, `languageAlternates('/face2')`가 `{ ko:'https://unse-ai.com/face2', en:'https://unse-ai.com/en/face2', 'x-default':'https://unse-ai.com/face2' }`, `t('en','tab.home')==='Home'`, ko/en ui 키 집합이 같음)
- [x] **Step 2: 실패 확인** — `npx vitest run tests/i18n` → FAIL
- [x] **Step 3: 구현**
- [x] **Step 4: 통과 확인** — `npm test`
- [x] **Step 5: 커밋** — `"영어판 바탕: 언어 context, ko/en 화면 문구 사전, 언어 짝 주소"`

---

### Task 2: 루트 레이아웃 둘로 나누기

**Files:**
- Move: `src/app/layout.tsx` → `src/app/(ko)/layout.tsx`; `src/app/page.tsx`와 한국어 페이지 폴더 전부(`about all animal bujeok dev exam face-match face-tests face2 fortune mbti privacy saju samguk today unse`) → `src/app/(ko)/`. `api`, `globals.css`, `manifest.ts`, `sitemap.ts`, `favicon.ico`는 `src/app/` 그대로.
- Create: `src/app/en/layout.tsx`(영어 루트 레이아웃), `src/components/SiteShell.tsx`(두 레이아웃이 함께 쓰는 body 안쪽: 글꼴 변수, 탭바, 푸터, GA·애널리틱스 스크립트)
- Test: `tests/i18n/layouts.test.ts`, `e2e/i18n.spec.ts`(새로)

**Interfaces:**
- Consumes: Task 1 `LocaleProvider`, `t`.
- Produces: `SiteShell({ locale, children })`. 두 루트 레이아웃은 `<html lang={LOCALE_HTML_LANG[locale]}>` + `<body ...><LocaleProvider locale><SiteShell locale>`만 다르다. 한국어 레이아웃의 metadata는 지금 그대로(이동만), 영어 레이아웃은 영어 사이트 제목·설명(`src/content/en/pageGuides.ts`의 '/' 요약)과 `openGraph.locale: 'en_US'`.

- [x] **Step 1: 이동 전 서버 HTML 기록** — `npm run build && npm start -- -p 3220`(백그라운드)로 띄우고, `src/app/sitemap.ts`의 모든 주소에 대해 `<title>`, `<link rel="canonical">`, `<html lang>`를 뽑아 `test-results/i18n/before.json`에 저장(스크립트는 임시 폴더). 서버를 끈다.
- [x] **Step 2: 테스트** — `tests/i18n/layouts.test.ts`: `src/app/layout.tsx`가 없고 `src/app/(ko)/layout.tsx`·`src/app/en/layout.tsx`가 있고 둘 다 `SiteShell`을 쓴다. `e2e/i18n.spec.ts`: `/`의 `html[lang]`이 `ko`, `/en/face2`가 `en`(이 테스트는 Task 4 뒤에 통과해도 된다 — `test.fixme` 말고 Task 4에서 마저 단다).
- [x] **Step 3: 이동** — `git mv`. 옮긴 뒤 상대 경로 import(`../fonts/...` 등)만 고친다. `layout.tsx`의 body 안쪽을 `SiteShell`로 뽑는다(한국어 출력은 글자 하나 다르지 않게).
- [x] **Step 4: 이동 후 비교** — Step 1과 같은 방법으로 `after.json`을 만들고 두 파일이 같은지 비교(다르면 고친다). `npm test && npm run test:e2e` 통과.
- [x] **Step 5: 커밋** — `"영어판: 루트 레이아웃을 한국어(ko 그룹)·영어(en)로 나눔(한국어 주소·HTML 변화 없음)"`

---

### Task 3: 언어 감지(proxy)와 안내 띠

**Files:**
- Create: `src/proxy.ts`, `src/lib/i18n/detect.ts`(순수 함수), `src/components/i18n/LanguageBanner.tsx`
- Test: `tests/i18n/detect.test.ts`

**Interfaces:**
- Consumes: Task 1 `counterpart`.
- Produces:
  - `decide({ path, langCookie, country, acceptLanguage, hasSuggestCookie }): { redirect?: string; setSuggest?: boolean }`
    - `langCookie`가 `en`이고 `counterpart(path,'en')`가 있으면 `redirect` = 그 주소. `ko`이고 `/en` 아래면 한국어 짝으로.
    - `langCookie`가 없고 `hasSuggestCookie`도 없으면: `country`가 `KR`이 아니고 `acceptLanguage` 첫 언어가 `ko`로 시작하지 않으면 `setSuggest: true`. 그 밖엔 아무것도 안 한다.
    - **`langCookie`가 없으면 절대 `redirect`를 내지 않는다.**
  - `proxy.ts`: `request.headers.get('x-vercel-ip-country')`, `accept-language`, 쿠키 `lang`·`lang_suggest`로 `decide`를 부르고, `redirect`면 307, `setSuggest`면 응답에 `lang_suggest=en`(1년, `SameSite=Lax`, path `/`) 쿠키. `matcher`는 `/api`, `/_next`, `/images`, `/icons`, `/models`, 파일 확장자가 있는 경로를 뺀다.
  - `LanguageBanner`: 한국어 페이지에서 `lang_suggest=en` 쿠키가 있고 `lang` 쿠키가 없고 `counterpart(path,'en')`가 있으면 위쪽에 얇은 띠 "View this page in English"(누르면 `lang=en` 쿠키를 쓰고 이동) + 닫기(누르면 `lang=ko`를 써서 다시 안 뜸). 서버 HTML에는 없다(마운트 뒤에만).

- [x] **Step 1: 실패하는 테스트** (`decide` 표: 쿠키 없음+US+en → `{setSuggest:true}`이고 redirect 없음; 쿠키 없음+KR → `{}`; 쿠키 없음+US+ko-KR 브라우저 → `{}`; `lang=en` + `/face2` → redirect `/en/face2`; `lang=en` + `/saju` → `{}`; `lang=ko` + `/en/animal` → redirect `/animal`; 쿠키 없음 + `/en/face2` → `{}`)
- [x] **Step 2: 실패 확인 → Step 3: 구현 → Step 4: `npm test` 통과**
- [x] **Step 5: 커밋** — `"영어판: 언어 감지(국가·브라우저 언어는 안내 띠만, 고른 언어만 이동), 영어로 보기 띠"`

---

### Task 4: 언어 메뉴와 영어 페이지

**Files:**
- Create: `src/components/i18n/LanguageSwitch.tsx`
- Create: `src/app/en/page.tsx`, `src/app/en/all/page.tsx`, `src/app/en/face2/{layout,page}.tsx`, `src/app/en/animal/{layout,page}.tsx`, `src/app/en/face-match/page.tsx`
- Modify: 세 테스트가 쓰는 공용 컴포넌트에 `useLocale()` 문구 분기 — `TestHeader`, `TestStart`, `GenderPills`, `ResultActions`, `useResultShare`, `MoreTests`, `BottomTabBar`, `SiteShell` 푸터, `HomeGrid`, `FaceHero`, `GuansangResultView`·`RevealMotion`, 동물상 결과, `FaceMatchClient`, `AnalyzingOverlay`, `PageGuide`(영어판은 `src/content/en/pageGuides.ts`)
- Test: `tests/i18n/pages.test.tsx`, `e2e/i18n.spec.ts`

**Interfaces:**
- Consumes: Task 1 `useLocale`, `t`, `counterpart`; `src/content/en/*`; 기존 한국어 페이지 컴포넌트.
- Produces: `LanguageSwitch()` — 헤더 오른쪽 지구 아이콘 + 현재 언어 이름. 누르면 다른 언어 목록(`LOCALES`), 고르면 `lang` 쿠키를 쓰고 `counterpart(path, l)`로 이동, 짝이 없으면 그 언어 홈 + 쿼리 `?only=ko`(영어 홈이 이걸 보면 `t('en','onlyKorean')` 한 줄).

규칙:
- 영어 페이지는 한국어 페이지 컴포넌트를 **그대로 재사용**하고 문구만 언어에 따라 바꾼다(계산·분석·캡처 코드를 복사하지 않는다). 문구 고르기는 `locale === 'en' ? en값 : 지금 한국어` 형태로, 한국어 출력이 지금과 글자 하나 다르지 않게.
- 영어판 결과 데이터는 `src/content/en/guansang.ts`, `animal.ts`, `faceMatch.ts`를 같은 키로 읽는다.
- 영어판 metadata: 제목·설명은 `src/content/en/pageGuides.ts`, canonical은 `/en/...`, `alternates.languages`는 `languageAlternates`. **한국어 짝 페이지에도 `alternates.languages`를 더한다**(canonical·제목은 그대로).
- `LanguageSwitch`는 한국어·영어 모든 페이지 헤더(공용 `TestHeader`와 홈·허브 머리)에 둔다. 부적·일기토 화면 안쪽은 제외(그 페이지들은 탭바 위 공용 머리가 없으면 넣지 않는다).
- 영어판에서는 `CoupangBanner`·`GiftNudge`·카카오톡 공유를 그리지 않는다.
- 영어판 하단 탭: Home(`/en`)·All(`/en/all`)·Today는 영어판이 없으므로 탭 둘(Home·All)만.

- [x] **Step 1: 테스트** — `tests/i18n/pages.test.tsx`: 영어 페이지 파일들이 있고 metadata canonical이 `/en/...`, 한국어 `/face2` layout의 `alternates.languages.en`이 `https://unse-ai.com/en/face2`. 한국어 공용 컴포넌트를 locale 없이 렌더한 HTML이 이 작업 전과 같다(`TestStart`, `ResultActions`, `MoreTests`의 렌더 결과를 Task 시작 때 스냅숏으로 떠 두고 비교). `e2e/i18n.spec.ts`: `/en/face2` 열림·영어 제목·`html[lang=en]`·한글 없음(`/[가-힣]/`가 본문 글자에 없어야 함, 단 캐릭터 그림 alt 제외); `/face2`에서 언어 메뉴로 English → `/en/face2`; `/saju`에서 English → `/en?only=ko`와 안내 문구; 쿠키 없는 요청으로 `/face2`를 열면 307이 없다.
- [x] **Step 2: 실패 확인 → Step 3: 구현 → Step 4: `npm test && npm run test:e2e` 통과**
- [x] **Step 5: 커밋** — `"영어판: 홈·전체·관상·동물상·얼굴 궁합 영어 페이지와 화면마다 언어 메뉴"`

---

### Task 5: 영어 결과 공유·미리보기·사이트맵

**Files:**
- Create: `src/app/en/face2/r/[key]/page.tsx`, `src/app/en/animal/r/[type]/page.tsx`, `src/app/en/face-match/r/[pair]/page.tsx`(한국어 착지와 같은 검증·noindex·canonical 규칙, canonical은 `/en/<테스트>`)
- Modify: `src/lib/shareLinks.ts`(locale 인자: en이면 `/en` 접두어), `src/components/share/SharePage.tsx`(문구 분기), `src/app/api/og/result/route.tsx`·`src/lib/ogQuery.ts`(`lang=en` 허용 목록 값 하나 추가 → 영어 문구), `src/app/sitemap.ts`(영어 주소 5개 + `alternates.languages`, `LAST_MODIFIED` 갱신)
- Test: `tests/i18n/share.test.ts`

- [x] **Step 1: 테스트** — `shareLinks`가 en에서 `/en/animal/r/cat?s=88&utm_source=share&utm_medium=friend_link`를 만든다; ogQuery가 `lang`은 `en`만 허용하고 그 밖은 버린다; 사이트맵에 `https://unse-ai.com/en/face2`가 있고 그 항목의 `alternates.languages.ko`가 `https://unse-ai.com/face2`; 영어 착지 페이지가 noindex다.
- [x] **Step 2: 실패 확인 → Step 3: 구현 → Step 4: `npm test` 통과**
- [x] **Step 5: 커밋** — `"영어판: 영어 결과 공유 착지·영어 미리보기 이미지·사이트맵 언어 짝"`

---

### Task 6: 마무리 확인

- [ ] **Step 1: 전체 확인** — `npm test && npm run test:e2e`(기존 무관 실패 하나만)
- [ ] **Step 2: 한국어 HTML 재비교** — Task 2 Step 1의 `before.json`과 지금을 다시 비교(`<title>`·canonical·`html lang`이 모든 한국어 주소에서 같아야 한다. 다른 곳은 `alternates` 링크가 더해진 것뿐).
- [ ] **Step 3: 스크린숏** — 390px: `/en`, `/en/all`, `/en/face2`, `/en/animal`, `/en/face-match`, `/en/face2/r/earth-mid`, 한국어 `/face2` 머리(언어 메뉴 펼친 상태), 안내 띠가 뜬 `/face2`(쿠키 `lang_suggest=en`을 직접 넣고) → `test-results/i18n/`. 미리보기 `/api/og/result?kind=face&key=earth-mid&lang=en`.
- [ ] **Step 4: CLAUDE.md** — "언어(한국어·영어)" 절 추가: 폴더 구조(`(ko)`·`en`), 언어 더하는 법, proxy 규칙(로봇 리디렉션 금지), 영어판 범위, 영어판에서 빼는 것(카카오·쿠팡·부적 선물).
- [ ] **Step 5: 커밋과 보고** — `"영어판 문서"`. 커밋 목록, 테스트 결과, 비교 결과, 스크린숏 경로, 계획과 달라진 점. push 금지.
