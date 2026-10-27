# 오늘의 MBTI 운세 실행 계획

> 실행: superpowers:executing-plans(네이티브). 단계는 체크박스로 추적한다.

**목표:** MBTI만 고르면 오늘(한국 시간) 운세가 나오는 `/fortune/mbti`를 만든다. 결과 공유 링크·미리보기·카카오 카드를 붙이고, 운세 메뉴를 "생년월일로 / MBTI로" 두 갈래로 나눈다.

**구조:**
- 문장 고르기는 순수 함수(`lib/mbti/daily.ts`)로 두고 문장 풀은 콘텐츠 파일에 둔다.
- 화면은 4b 공통 구성요소와 기존 공유 훅을 쓴다.
- "오늘"은 브라우저에서 계산한다. 정적 페이지와 CDN 캐시 때문에 날짜가 묵지 않게 하고, 서버 HTML과 화면이 어긋나지 않게 하려는 것이다.

**설계:** `docs/superpowers/specs/2026-10-27-mbti-daily-design.md`

## 공통 제약
- 같은 날 같은 유형 → 누구에게나 같은 결과. 날짜는 한국 시간 `YYYY-MM-DD`.
- 한 유형의 한마디는 최소 14일 동안 다시 나오지 않는다.
- 같은 날 서로 다른 두 유형의 일·연애·관계 세 줄이 모두 같으면 안 된다.
- 문장은 긍정형이나 부드러운 조언형으로 쓴다. 부정어("최악", "안 맞", "큰일", "조심하지 않으면")와 이모지는 쓰지 않는다.
- 링크에는 유형 키(소문자)와 utm만 넣고 날짜는 넣지 않는다. 미리보기 이미지에도 날짜를 넣지 않는다(오래 캐시해도 내용이 맞게).
- 기억한 MBTI는 이 기기의 localStorage에만 둔다(서버·GA로 보내지 않음). 못 쓰면 기억 없이 동작한다.
- GA: `test_name: 'mbti_daily'`, `result_id`는 대문자 유형만 보낸다(예 `INFP`).
- 제목·설명은 `tests/seo-snippets.test.tsx` 규칙(제목 48자, 설명 110자, 끝에 " – 운명을 읽다", og 같은 문구, 느낌표 없음)을 따른다.

## 리뷰 초점
1. 한국 시간 자정 경계: 23:59와 00:00(KST)의 날짜가 바뀐다. UTC 기준이 아니어야 한다(작업 1 테스트).
2. 공유 착지와 시작 페이지가 캐시된 HTML의 "어제"를 보여 주면 안 된다. 날짜 의존 내용은 마운트 뒤에 그린다(작업 3 E2E: 고정 시각 두 날짜).
3. 잘못된 유형 링크(`/fortune/mbti/r/xxxx`, 대문자 `INFP`, `constructor`)는 500 없이 시작 화면으로 간다. 대문자는 소문자로 보낸다(작업 2·3 테스트).
4. 저장된 MBTI 값이 이상하면 무시한다(작업 2 테스트).
5. 기억한 유형이 있는 방문자가 친구 링크로 오면, 친구 결과가 먼저 보이고 "내 MBTI로 보기"는 내 결과로 바로 간다(작업 3 E2E).

---

### 작업 1: 문장 규칙과 문장 풀
**파일:** `src/lib/mbti/daily.ts`(생성), `src/content/mbtiDaily.ts`(생성), 테스트 `tests/mbti/daily.test.ts`

**만드는 것:**
- `kstDate(now: Date): string`: `YYYY-MM-DD`. `coupangSeasons.ts`의 내부 `kstDate`는 이 함수를 쓰도록 바꾼다.
- `mbtiDaily(type: MbtiType, date: string): MbtiDaily`
  - 반환값: `{ headline: string; work: string; love: string; relation: string; lucky: { color: string; time: string; action: string }; match: MbtiType }`
- 콘텐츠 `MBTI_DAILY`
  - `headlines: Record<MbtiType, string[]>`: 유형마다 14개 이상
  - `axis: Record<'work'|'love'|'relation', Record<'E'|'I'|'S'|'N'|'T'|'F'|'J'|'P', string[]>>`: 방향마다 12개 이상
  - `lucky: { colors: string[]; times: string[]; actions: string[] }`

**규칙:**
- `day` = 날짜의 일 번호(UTC 자정 기준 `Date.parse(date)/86400000`)
- headline: `headlines[type][(day + typeIndex) % n]`. n ≥ 14라서 다시 나오는 간격은 n일이다.
- 세 줄 각각:
  - 축 번호 = `(day + typeIndex + k) % 4`. k는 work 0, love 1, relation 2.
  - 그 축에서 그 유형이 가진 글자의 풀을 쓴다.
  - 문장 번호 = `fnv1a(date + type + 칸이름) % 풀 길이`
- lucky: `fnv1a` 시드로 각 목록에서 고른다.
- match: 다른 15유형을 `compatSummary(type, b).total` 내림차순(동점은 이름순)으로 정렬해 상위 3개를 뽑고, `day % 3`번째를 쓴다.

**테스트:**
- 결정성: 같은 입력은 두 번 불러도 같다.
- 날짜:
  - `kstDate(new Date('2026-10-27T14:59:00Z'))` → `'2026-10-27'`
  - `kstDate(new Date('2026-10-27T15:00:00Z'))` → `'2026-10-28'`
- 2026-11-01부터 365일, 16유형:
  - 한마디가 14일 안에 다시 나오지 않는다.
  - 같은 날 두 유형의 (work, love, relation)이 모두 같은 경우가 0번이다.
  - match ≠ 자기 자신이고, 위 정렬의 상위 3 안에 있다.
- 풀 개수가 최소 기준 이상이다.
- 모든 문장에 부정어 목록과 이모지(`\p{Extended_Pictographic}`)가 없다.
- 순서: RED → 구현 → GREEN → 커밋

### 작업 2: MBTI 기억 · 공유 링크 · 미리보기 · GA
**파일:**
- `src/lib/mbtiMemory.ts`(생성)
- `src/lib/shareLinks.ts`
- `src/lib/ogQuery.ts`
- `src/app/api/og/result/route.tsx`
- `src/lib/analytics.ts`
- 테스트: `tests/mbti/dailyLinks.test.ts`, `tests/review-0a67370.test.ts`(og 허용 목록 사례 추가)

**만드는 것:**
- `loadMbti(store?)`, `saveMbti(t, store?)`: 키 `unse-mbti`, `genderMemory.ts`와 같은 모양. 이상한 값은 null.
- `mbtiDailyUrl(t: MbtiType): string`
  - 형식: `${SITE}/fortune/mbti/r/${t.toLowerCase()}?utm_source=share&utm_medium=friend_link&utm_campaign=mbti_daily`
- `parseMbtiDailyKey(key: string): MbtiType | null`
  - 소문자 4글자만 받는다. 대문자는 null이고, 페이지에서 소문자로 보낸다.
- `mbtiDailyPhrase(t, headline)`: `오늘 ${t} 운세는 '${headline}'래. 너는 무슨 유형이야?`
- ogQuery: `'mbti-daily': ['type']`. og 라우트 kind `mbti-daily` 화면:
  - 큰 글씨 `${T} 오늘의 운세`
  - 아래 줄 `${nickname}`
  - 문구 "너는 무슨 유형이야?"
  - label "오늘의 MBTI 운세"
- `TestName`에 `'mbti_daily'`를 추가한다.

**테스트:**
- 메모리:
  - 저장 → 불러오기
  - `'xxxx'`, `'infp'`(소문자 저장값), 예외를 던지는 저장소는 null
- 링크:
  - 정확한 URL 형식
  - 날짜·숫자 4자리가 없다.
  - `parseMbtiDailyKey`: `'infp'` → `'INFP'`. `'INFP'`, `'xxxx'`, `'constructor'`, `''`는 null.
- ogQuery:
  - `kind=mbti-daily&type=infp`은 통과
  - `&date=2026-10-27`이 붙으면 거부
  - 커밋

### 작업 3: `/fortune/mbti` 화면 · 착지 · SEO
**파일:**
- 생성:
  - `src/app/fortune/mbti/layout.tsx`: 메타, JSON-LD, PageGuide
  - `src/app/fortune/mbti/page.tsx`
  - `src/components/mbti/MbtiDailyClient.tsx`
  - `src/components/mbti/MbtiDailyCard.tsx`
  - `src/app/fortune/mbti/r/[type]/page.tsx`
  - `src/components/mbti/MbtiDailyShared.tsx`: 클라이언트. 친구 유형의 오늘 운세를 마운트 뒤에 그린다.
- 수정:
  - `src/app/sitemap.ts`
  - `src/content/pageGuides.ts`: `GuideRoute`에 `/fortune/mbti`를 추가한다. 라벨은 "오늘의 MBTI 운세"다.
  - `tests/seo-snippets.test.tsx`: 페이지 목록에 추가한다.
  - `tests/coupangSeason.test.tsx`: 시즌 카드 위치 목록에 `MbtiDailyClient`를 추가한다.
- E2E: `e2e/mbti-daily.spec.ts`

**화면 (설계 그대로):**
- 시작:
  - TestHeader "오늘의 MBTI 운세"
  - 날짜 줄
  - 4×4 유형 버튼(`MatchCalculator`의 `TypeGroup` 모양)
  - "내 MBTI를 모르면" → `/mbti`
- 기억한 유형이 있으면 바로 결과를 보여 준다.
- 결과 카드(`MbtiDailyCard`, ref로 캡처):
  - 유형·별명, 날짜, 한마디(큰 글씨), 일·연애·관계 세 줄, 행운(색·시간·행동)
  - 오늘 잘 맞는 유형 → `/mbti/match?a=&b=`
  - 워터마크 "운명을 읽다 · unse-ai.com"
- ResultActions:
  - 공유하기: `useResultShare`. 문구는 `mbtiDailyPhrase`, 이미지는 `ogImageUrl` 대신 `${SITE}/api/og/result?kind=mbti-daily&type=`
  - 이미지 저장: `useScreenshot`
  - 다시하기: "다른 유형 보기"는 고르기 화면으로 돌아가고, 기억은 유지한다.
- 결과 아래:
  - `/mbti/[type]` 링크
  - "생년월일로 보는 오늘의 운세" → `/fortune/daily`
  - `<SeasonPicks slot="mbti_daily" />`
- 착지 `/fortune/mbti/r/[type]`(서버):
  - 유형이 대문자면 소문자 주소로 redirect한다. 잘못된 유형이면 `/fortune/mbti`로 보낸다.
  - 메타:
    - noindex, follow
    - canonical `${SITE}/fortune/mbti`
    - og:title `친구의 오늘 ${T} 운세가 도착했어요. 너는 무슨 유형이야?`(날짜 없음)
    - 이미지는 위 og
  - 본문:
    - "친구가 보낸 오늘의 운세" → 친구 카드(마운트 뒤)
    - "내 MBTI로 보기": 기억한 유형이 있으면 `/fortune/mbti?t=infp`로, 없으면 `/fortune/mbti`로 간다.
    - `SharedLandingTracker test="mbti_daily"`
- `/fortune/mbti?t=infp`: 그 유형 결과를 바로 연다(허용 목록 검사). 기억도 갱신한다.
- SEO:
  - 제목 `오늘의 MBTI 운세 | 16유형 오늘 하루 무료 – 운명을 읽다`
  - 설명 80~110자. "가입 없이", "MBTI만 고르면" 포함
  - 사이트맵 changeFrequency daily
- GA:
  - 결과가 보일 때 `result_view(mbti_daily, INFP)`
  - 공유는 `useResultShare` 기본 동작

**테스트:**
- 단위: 착지 메타
  - noindex, canonical
  - og:title에 날짜·숫자 4자리가 없다.
- 단위: pageGuides 기존 규칙과 seo-snippets 통과
- E2E (`page.clock.setFixedTime`로 시각 고정):
  - 2026-10-27 10:00 KST에 INFP를 고르면 카드에 "10월 27일"과 `mbtiDaily('INFP','2026-10-27').headline`이 보인다. 문장은 테스트에서 직접 불러와 비교한다.
  - 새로 열면(기억) 고르기 없이 INFP 결과가 나온다.
  - 날짜를 2026-10-28로 바꾸면 한마디가 바뀐다.
  - 공유하기(가짜 navigator.share): url이 `/fortune/mbti/r/infp?utm_source=share`이고, 문구가 `오늘 INFP 운세는`으로 시작한다.
  - 카카오 인앱(가짜 SDK): 카드 링크와 이미지가 `kind=mbti-daily&type=infp`
  - 착지:
    - `/fortune/mbti/r/entj` → "친구가 보낸 오늘의 운세"와 ENTJ 한마디
    - 기억한 INFP가 있으면 "내 MBTI로 보기"가 INFP 결과로 간다.
    - `/fortune/mbti/r/INFP` → `/fortune/mbti/r/infp`
    - `/fortune/mbti/r/xxxx` → `/fortune/mbti`
  - 오류 없음, 이모지 없음(chrome-emoji 목록에 경로 추가)
- 커밋

### 작업 4: 운세 메뉴 두 갈래
**파일:**
- `src/content/navigation.ts`
- `src/components/CategoryList.tsx`
- `src/app/unse/page.tsx`
- `src/components/home/CategoryTabs.tsx`
- 테스트: `tests/navigation.test.ts`

**만드는 것:**
- `CategoryItem`에 `group?: string`을 추가한다.
- 운세 묶음 항목의 group:
  - '생년월일로 보는 운세': 2027 신년운세, 2027 띠별 운세, 오늘의 운세
  - 'MBTI로 보는 운세': 오늘의 MBTI 운세(`/fortune/mbti`, chip "생년월일 없이")
- 운세 묶음 intro에 MBTI 운세를 한 줄 더한다.
- `CategoryList`는 연속된 같은 group 앞에 소제목(h3, `text-[13px] text-muted`)을 그린다. group이 없는 묶음은 지금과 같다.
- 궁합 묶음(`/mbti`)에도 "오늘의 MBTI 운세" 항목을 넣는다(group 없음).
- 푸터는 items를 그대로 나열하므로 바꾸지 않는다.

**테스트:**
- 운세 묶음 항목의 group 순서: 생년월일 3개 → MBTI 1개
- 렌더 HTML에서 소제목 두 개가 순서대로 나온다.
- 얼굴 묶음에는 소제목이 없다.
- `tabForPath('/fortune/mbti')`는 'unse'
- 커밋

### 작업 5: 검증
- 전체 단위·E2E를 돌린다.
- 375px 화면을 확인한다.
- 최종 리뷰(opus)를 받고 지적을 고친다.
- CLAUDE.md "MBTI" 절을 갱신한다.
- main에 합치고 배포 승인을 요청한다.
