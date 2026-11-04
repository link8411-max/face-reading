# 삼국지 쇼츠 ↔ 사이트 연결 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 유튜브 채널 쇼츠를 사이트에 자동으로 불러와 열전(영상·상관도·관계 인물 영상), 닮은꼴 결과, `/samguk/videos` 격자·피드, 허브 띠에 보여 준다.

**Architecture:** 서버 전용 모듈 `src/lib/videos/`에서 YouTube Data API를 1시간 ISR로 부른다. 실패하면 RSS로, 그것도 실패하면 빈 목록으로 넘어간다. 순수 함수(파싱·인물 연결·상관도 묶음)와 화면 컴포넌트를 나누고, 플레이어만 클라이언트 컴포넌트로 둔다. 클라이언트 페이지인 닮은꼴 결과는 캐시된 API 라우트로 데이터를 받는다.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind 4, vitest(`tests/**`, node 환경, `renderToStaticMarkup`), Playwright E2E.

**Spec:** `docs/superpowers/specs/2026-11-04-samguk-videos-design.md`. 시안은 https://claude.ai/artifact/Uf5VH9i5XoMMxCTRJyAyQz (보드 ①~④). 둘이 다르면 spec을 따른다.

## Global Constraints

- 채널 `UCQvI9qIC3pIq_24_x5XE_3g`, 업로드 재생목록 `UUQvI9qIC3pIq_24_x5XE_3g`, 핸들 `@unse_ai`. 구독 링크 `https://www.youtube.com/@unse_ai?sub_confirmation=1`.
- 키는 `process.env.YOUTUBE_API_KEY`이고 서버 코드에서만 읽는다. `"use client"` 파일과 API 응답 본문에 키를 넣지 않는다.
- 모든 외부 fetch는 `{ next: { revalidate: 3600 } }`로 한다. 어떤 실패도 throw하지 않고 빈 목록을 반환한다(빌드가 깨지면 안 됨).
- RSS 대체 주소는 `https://www.youtube.com/feeds/videos.xml?channel_id=UCQvI9qIC3pIq_24_x5XE_3g`다. RSS로 받은 영상은 `isShort=true`, `durationSec=null`로 둔다.
- 플레이어는 `https://www.youtube-nocookie.com/embed/<id>?autoplay=1&playsinline=1`이다. 영상 id는 `/^[A-Za-z0-9_-]{11}$/`를 통과한 것만 쓴다.
- 첫 화면에는 iframe을 두지 않는다. 누른 뒤에만 iframe을 만들고, 한 화면에서 재생 중인 iframe은 하나만 둔다.
- 조회수: `publishedAt` 뒤 24시간 안이면 `NEW` 배지만 달고, 그 뒤에는 `조회수 1,008회`(천 단위 쉼표)를 쓴다.
- 해시태그는 `allSamgukCharacters`의 `name`과 정확히 일치할 때만 인물 id로 바꾼다. 이름 127개는 모두 고유하다(11/5 확인). `src/content/videoOverrides.ts`가 해시태그보다 우선한다.
- 롱폼(`isShort=false`, 181초 이상)은 이번 범위에서 어떤 화면에도 내지 않는다.
- GA 값 규칙: `-`를 `_`로 바꾼 영상 id를 `result_id`에 넣는다. `SAFE_VALUE` 정규식은 바꾸지 않는다. 새 이벤트는 `video_play {slot,result_id}`·`video_subscribe_click {slot}`·`video_test_click {slot}`이고, slot은 `people`·`result`·`videos`·`hub`다.
- 디자인 토큰은 CLAUDE.md "디자인 시스템 (4b 뉴트럴)"만 쓴다. 이모지 금지, 아이콘은 `Icon` 또는 인라인 선 SVG.
- 결과 화면(`/samguk` 결과)에 넣는 영상 카드와 엮인 장수 칸에는 `no-screenshot`을 붙인다.
- `/samguk/videos`에는 `PageGuide`를 두지 않는다. `GuideRoute`는 사진 테스트 전용이고 월드컵도 없다. spec의 pageGuides 줄은 이 계획이 대신한다. 대신 서버 HTML에 제목과 소개 문단을 둔다.

## Review Focus

1. 영상이 0편이거나 API·RSS가 모두 실패한 경우: 열전·결과·허브의 영상 칸이 통째로 사라지고 나머지는 그대로 보여야 한다. `/samguk/videos`는 "아직 올라온 영상이 없어요"를 보여야 한다. → Task 2, 5, 6에 테스트.
2. 관계 인물에게 초상화나 열전이 없는 경우(조성처럼 `otherId` null, 또는 `PENDING_PORTRAIT_IDS`): 점선 칸에 첫 글자를 넣고, 링크 없이 보여야 한다. → Task 3, 5.
3. 제목이 해시태그뿐이거나, 해시태그를 빼면 비는 경우: 원래 제목을 써야 한다. → Task 1.
4. 결과 이미지 저장·공유 캡처에 영상 썸네일이나 엮인 장수 얼굴이 섞이면 안 된다. → Task 7(`no-screenshot` 단언).
5. 잘못된 `?v=` 값(없는 id, 스크립트 문자열): 피드를 열지 않고 격자만 보여야 한다. → Task 6.

---

## File Structure

| 파일 | 책임 |
|---|---|
| `src/lib/videos/types.ts` | `Video`, `VideoSlot` 타입 |
| `src/lib/videos/parse.ts` | 순수 함수: 재생 시간, 해시태그, 인물 연결, API·RSS 응답 → `Video[]`, 표시 문구 |
| `src/lib/videos/fetch.ts` | 서버 전용 `getChannelVideos()`: API → RSS → [] |
| `src/content/videoOverrides.ts` | 수동 보정 |
| `src/lib/videos/forPerson.ts` | 순수 함수: 인물별 영상(첫 줄·관계 줄), 상관도 묶음, 엮인 장수 5칸 |
| `src/lib/videos/jsonld.ts` | `VideoObject`·`ItemList` JSON-LD |
| `src/components/videos/VideoPlayer.tsx` | 클라이언트: 썸네일 → iframe, GA |
| `src/components/videos/PersonVideos.tsx` | 열전 첫 줄 영상 칸(서버) |
| `src/components/videos/Sanggwando.tsx` | 상관도(서버) |
| `src/components/videos/RelatedVideosRow.tsx` | 관계 인물 영상 줄(서버) |
| `src/components/videos/ResultVideoBlock.tsx` | 결과용 영상 카드 + 엮인 장수 5칸(표시 전용) |
| `src/components/videos/ResultVideos.tsx` | 클라이언트: API에서 받아 `ResultVideoBlock` 렌더 |
| `src/components/videos/VideosBrowser.tsx` | 클라이언트: 격자·인물 필터·`?v=`·피드 열기 |
| `src/components/videos/VideoFeed.tsx` | 클라이언트: 전체 화면 세로 피드 |
| `src/components/videos/VideoStrip.tsx` | 허브 띠(서버) |
| `src/app/samguk/videos/{layout,page}.tsx` | 영상 페이지 |
| `src/app/api/samguk/videos/[id]/route.ts` | 결과 화면용 GET |

---

### Task 1: 영상 데이터 파싱 (순수 함수)

**Files:**
- Create: `src/lib/videos/types.ts`, `src/lib/videos/parse.ts`, `src/content/videoOverrides.ts`
- Test: `tests/videos/parse.test.ts`, fixtures `tests/videos/fixtures/api-videos.json`, `tests/videos/fixtures/feed.xml`

**Interfaces:**
- Produces:
  - `type Video = { id: string; title: string; description: string; publishedAt: string; durationSec: number | null; views: number | null; thumbnail: string; people: string[]; isShort: boolean; event: string | null }`
  - `type VideoSlot = 'people' | 'result' | 'videos' | 'hub'`
  - `parseIsoDuration(s: string): number | null`
  - `stripHashtags(title: string): string`
  - `peopleFromText(text: string): string[]`: 해시태그 순서대로, 중복 제거, 인물 id
  - `applyOverride(v: Video, o?: VideoOverride): Video | null`(`hide`면 null)
  - `fromApi(items: unknown[]): Video[]`, `fromRss(xml: string): Video[]`: 둘 다 overrides 적용, 숨김 제외, `publishedAt` 내림차순
  - `isNew(publishedAt: string, now: Date): boolean`, `viewsLabel(v: Video, now: Date): string | null`(NEW면 null), `gaVideoId(id: string): string`, `isVideoId(s: unknown): s is string`, `thumbUrl(id: string): string` = `https://i.ytimg.com/vi/<id>/oar2.jpg`
  - `type VideoOverride = { people?: string[]; hide?: boolean; event?: string }`, `export const VIDEO_OVERRIDES: Record<string, VideoOverride> = {}`

- [ ] **Step 1: fixtures 만들기.** `api-videos.json`은 11/4에 실제 `videos.list(part=snippet,statistics,contentDetails)`가 준 3편의 형태다(id·title·description·publishedAt·duration·viewCount). description에는 현재 해시태그(`#하후돈 #조조` 등)를 넣는다. `feed.xml`은 같은 3편의 RSS(`yt:videoId`, `media:title`, `media:description`, `published`, `media:statistics views`)다.
- [ ] **Step 2: 실패하는 테스트 작성** `tests/videos/parse.test.ts`:
  - `parseIsoDuration('PT1M3S')===63`, `('PT2M1S')===121`, `('P1D')===null`, `('')===null`
  - `stripHashtags('하후돈은 정말 눈알을 삼켰을까? #삼국지 #shorts')==='하후돈은 정말 눈알을 삼켰을까?'`, `stripHashtags('#삼국지 #shorts')==='#삼국지 #shorts'`(비면 원문)
  - `peopleFromText('… #삼국지 #도원결의 #유비 #관우 #장비 #역사')` → `['liubei','guanyu','zhangfei']`. `'#조조 #조조'` → `['caocao']`
  - `fromApi(fixture)`: 3편, 순서 `['2U3ZFgCdnzU','R-lrShfZU7s','NejqojdriBg']`, `R-lrShfZU7s`의 people `['xiaohoudun','caocao']`, durationSec 63, views 1008, isShort true. `NejqojdriBg` people에 `zhugeliang`·`caocao`·`zhouyu`가 포함되는지
  - `fromRss(feed)`: 같은 id 3편, durationSec null, isShort true, views 숫자
  - 보정: `applyOverride(v,{hide:true})===null`, `{people:['caoren']}`이면 people이 `['caoren']`
  - `isNew('2026-11-04T09:08:14Z', new Date('2026-11-05T09:08:13Z'))===true`, 1초 뒤 false. `viewsLabel`: NEW면 null, 아니면 `'조회수 1,008회'`. views null이면 null
  - `gaVideoId('R-lrShfZU7s')==='R_lrShfZU7s'`이고 `isSafeValue`를 통과. `isVideoId('<script>')===false`, `isVideoId('R-lrShfZU7s')===true`
- [ ] **Step 3: 실행해서 실패 확인.** `npx vitest run tests/videos/parse.test.ts` → FAIL (모듈 없음)
- [ ] **Step 4: 구현.** RSS는 정규식으로 `<entry>` 단위로 자른다(의존성 추가 금지). `&amp;` 등 XML 엔티티 5개를 디코드한다. API 썸네일은 응답 값 대신 `thumbUrl(id)`(세로 1080×1920)를 쓴다. `isShort`는 `durationSec===null || durationSec<=180`이다.
- [ ] **Step 5: 통과 확인.** 같은 명령 → PASS
- [ ] **Step 6: 커밋** `feat(videos): 쇼츠 데이터 파싱·인물 연결`

### Task 2: 채널 영상 불러오기 (서버)

**Files:**
- Create: `src/lib/videos/fetch.ts`
- Test: `tests/videos/fetch.test.ts`

**Interfaces:**
- Consumes: `fromApi`, `fromRss` (Task 1)
- Produces: `getChannelVideos(): Promise<Video[]>`(롱폼 제외, 쇼츠만, 최신순)

- [ ] **Step 1: 실패하는 테스트.** `vi.stubGlobal('fetch', …)`와 `vi.stubEnv('YOUTUBE_API_KEY', …)`를 쓴다.
  - 키가 있으면 `playlistItems`(maxResults=50, nextPageToken 따라 반복) → `videos`(50개씩 끊어 호출) 순서로 부르고, 결과는 fixture 3편
  - 첫 호출 URL에 `playlistId=UUQvI9qIC3pIq_24_x5XE_3g`가 있고, 모든 호출 옵션에 `next.revalidate===3600`
  - 키가 없으면 API를 부르지 않고 RSS를 부름 → 3편, durationSec null
  - API가 403이면 RSS로 대신 부름
  - API·RSS가 모두 throw·500이면 `[]`이고 예외가 밖으로 나가지 않음
  - 롱폼(duration `PT10M`)은 결과에서 빠짐
- [ ] **Step 2: 실패 확인** `npx vitest run tests/videos/fetch.test.ts`
- [ ] **Step 3: 구현.** 파일 맨 위에 `import 'server-only'`를 쓰지 않는다(vitest node에서 깨짐). 대신 파일 첫 줄 주석으로 서버 전용임을 밝히고, Task 9의 테스트가 `"use client"` 파일에서 이 모듈을 import하지 않는지 확인한다.
- [ ] **Step 4: 통과 확인**
- [ ] **Step 5: 커밋** `feat(videos): 채널 영상 불러오기(API→RSS→빈 목록)`

### Task 3: 인물별 영상·상관도 묶음 (순수 함수)

**Files:**
- Create: `src/lib/videos/forPerson.ts`
- Test: `tests/videos/forPerson.test.ts`

**Interfaces:**
- Consumes: `Video`, `relationsOf(id): RelationView[]`(`src/lib/people/relations.ts`), `portraitSrc`, `characterById`, `KIN_TYPES`
- Produces:
  - `type RelatedVideo = { video: Video; personId: string; personName: string; label: string }`
  - `videosForPerson(videos: Video[], id: string): { own: Video[]; related: RelatedVideo[] }`
    - own: people에 id가 있는 영상. 정렬은 people[0]===id인 것 먼저, 그다음 최신순
    - related: `relationsOf(id)` 순서로 돌며(otherId 있고 hasPage), 그 인물이 people에 든 영상 중 own과 이미 넣은 것을 뺀다. 최대 6
  - `type SgTile = { id: string | null; name: string; label: string; portrait: string | null; href: string | null; hasVideo: boolean }`
  - `type SgGroup = { key: '혈연' | '의형제' | '군신' | '동료' | '라이벌' | '원수'; tiles: SgTile[] }`
  - `sanggwando(id: string, videos: Video[]): SgGroup[]`: 빈 묶음 제외, 위 순서
  - `relatedFaces(id: string, n = 5): SgTile[]`: portrait와 href가 둘 다 있는 앞에서부터 n명

- [ ] **Step 1: 실패하는 테스트**(Task 1 fixture를 `fromApi`로 읽어 씀):
  - `videosForPerson(v,'xiaohoudun').own.map(x=>x.id)` → `['R-lrShfZU7s']`
  - `videosForPerson(v,'caocao').own`: 2편(하후돈·적벽). 둘 다 people[0]이 caocao가 아니므로 최신순 `['R-lrShfZU7s','NejqojdriBg']`
  - `videosForPerson(v,'xiaohoudun').related`: `NejqojdriBg`(personId caocao)와 `2U3ZFgCdnzU`(guanyu 또는 liubei 중 relationsOf에서 먼저 나오는 쪽)를 포함하고, `R-lrShfZU7s`는 넣지 않음
  - `videosForPerson([], 'xiaohoudun')` → `{own:[],related:[]}`
  - `sanggwando('xiaohoudun', v)`: 묶음 키 순서가 `['혈연','군신','라이벌','원수']`의 부분 순서. caocao 칸 `hasVideo===true`, xiahouyuan 칸 `hasVideo===false`. 조성 칸(id null): portrait null, href null
  - 초상화 대기 인물(`PENDING_PORTRAIT_IDS`의 아무 id)을 관계로 가진 인물 하나를 골라, 그 칸의 portrait가 null인지
  - `relatedFaces('xiaohoudun')`: 길이 ≤5, 모든 칸에 portrait와 href가 있음
- [ ] **Step 2: 실패 확인** `npx vitest run tests/videos/forPerson.test.ts`
- [ ] **Step 3: 구현.** 묶음 매핑: `KIN_TYPES` → 혈연, 나머지는 type 이름 그대로. `href = hasPage ? '/samguk/people/'+otherId : null`
- [ ] **Step 4: 통과 확인**
- [ ] **Step 5: 커밋** `feat(videos): 인물별 영상·상관도 묶음`

### Task 4: GA 이벤트와 플레이어

**Files:**
- Modify: `src/lib/analytics.ts` (Events에 3개 추가)
- Create: `src/components/videos/VideoPlayer.tsx`, `src/lib/videos/jsonld.ts`
- Test: `tests/videos/player.test.tsx`, `tests/analytics.test.ts`(추가)

**Interfaces:**
- Produces:
  - `<VideoPlayer video={Video} slot={VideoSlot} className? />`: 기본은 썸네일 `<button aria-label="{제목} 재생">` + 가운데 재생 표시 + (조회수 띠 또는 NEW). 누르면 iframe(`allow="autoplay; encrypted-media; picture-in-picture"`, `allowFullScreen`, title=제목)으로 바뀌고 `track('video_play',{slot,result_id:gaVideoId(id)})`. 다른 플레이어가 열리면 `window` 이벤트 `samguk-video-play`(detail=id)로 자신을 닫는다
  - `videoObjectJsonLd(v: Video): Record<string, unknown>`(name, description, thumbnailUrl, uploadDate, embedUrl, contentUrl `https://www.youtube.com/shorts/<id>`, durationSec가 있으면 `duration` ISO, views가 있으면 interactionStatistic WatchAction), `itemListJsonLd(vs: Video[]): Record<string, unknown>`
- [ ] **Step 1: 실패하는 테스트**
  - `renderToStaticMarkup(<VideoPlayer video={v} slot="people"/>)`에 `<iframe`이 없고 `oar2.jpg`와 `재생`이 있음
  - NEW 영상이면 `NEW`가 있고 `조회수`가 없음
  - `videoObjectJsonLd(rss영상)`에 `duration` 키가 없음. API 영상이면 `'PT1M3S'`
  - analytics: `track('video_play',{slot:'people',result_id:'R_lrShfZU7s'})`가 dataLayer에 그대로 들어감(기존 테스트 방식 따름)
- [ ] **Step 2: 실패 확인** `npx vitest run tests/videos/player.test.tsx tests/analytics.test.ts`
- [ ] **Step 3: 구현**
- [ ] **Step 4: 통과 확인**
- [ ] **Step 5: 커밋** `feat(videos): 플레이어·GA·영상 구조화 데이터`

### Task 5: 열전 페이지에 영상·상관도·관계 인물 영상

**Files:**
- Create: `src/components/videos/PersonVideos.tsx`, `src/components/videos/Sanggwando.tsx`, `src/components/videos/RelatedVideosRow.tsx`
- Modify: `src/app/samguk/people/[id]/page.tsx` (요약 section 뒤, `<CoupangBanner>` 앞), `export const revalidate = 3600` 추가
- Test: `tests/videos/peopleVideos.test.tsx`, 기존 `tests/peoplePage.test.tsx`의 순서 테스트 갱신

**Interfaces:**
- Consumes: `getChannelVideos`, `videosForPerson`, `sanggwando`, `VideoPlayer`, `videoObjectJsonLd`, `eulReul`
- Produces: `<PersonVideos name={string} videos={Video[]} />`, `<Sanggwando id name groups={SgGroup[]} portrait={string|null} />`, `<RelatedVideosRow items={RelatedVideo[]} />`. 각각 비면 `null`을 렌더

- [ ] **Step 1: 실패하는 테스트.** `vi.mock('@/lib/videos/fetch', …)`로 fixture 3편을 돌려준다.
  - 하후돈 페이지 HTML 순서: `하후돈 이야기, 1분 영상` < `상관도` < `관계 인물 영상` < 쿠팡 배너 iframe 주소(`ads-partners.coupang.com`)
  - 상관도: `하후돈을 둘러싼`, 묶음 머리 `혈연 1명`, 조조 칸이 `href="/samguk/people/caocao"`, 재생 표시 `data-has-video`가 조조 칸에 있음
  - 관계 인물 영상 줄에 `NejqojdriBg`가 있고 `R-lrShfZU7s`는 둘째 줄에 없음
  - 첫 줄 카드: `함께 나오는 인물` 다음에 `조조 열전` 링크가 있음. 하후돈 자신은 칩에 없음
  - `application/ld+json`에 `"@type":"VideoObject"`
  - mock이 `[]`를 돌려주면: `1분 영상`·`관계 인물 영상`이 없고, 상관도는 그대로 있으며(재생 표시만 없음) `VideoObject`도 없음
  - 관계가 없는 인물(데이터에서 relationsOf 길이 0인 인물이 있으면 그 인물, 없으면 이 단언은 생략하고 주석으로 남김)
- [ ] **Step 2: 실패 확인** `npx vitest run tests/videos/peopleVideos.test.tsx tests/peoplePage.test.tsx`
- [ ] **Step 3: 구현.** 크기·색·글씨는 시안 보드 ①과 spec ⓪·①을 따른다. 초상화 `<img>`에 `[image-rendering:pixelated]`(결과 화면과 같음)를 넣는다. 상관도 칸은 `<a>`(href 있을 때) 또는 `<div>`. 묶음 테두리는 라이벌 `border-blush`, 원수 `border-accent`, 나머지 `border-line`. 구독·영상 더 보기 링크 클릭 시 `video_subscribe_click`은 VideoPlayer 쪽 작은 클라이언트 링크 컴포넌트(`SubscribeLink`, 같은 파일에서 export)로 보낸다.
- [ ] **Step 4: 통과 확인** + `npm test` 전체 통과
- [ ] **Step 5: 커밋** `feat(people): 열전에 쇼츠·상관도·관계 인물 영상`

### Task 6: `/samguk/videos` 격자와 세로 피드

**Files:**
- Create: `src/app/samguk/videos/layout.tsx`(metadata: title `삼국지 쇼츠 모음 | 1분 삼국지 한 장면 – 운명을 읽다`, canonical `https://unse-ai.com/samguk/videos`, OG `/api/og?title=쇼츠로 보는 삼국지`), `src/app/samguk/videos/page.tsx`(`revalidate=3600`), `src/components/videos/VideosBrowser.tsx`, `src/components/videos/VideoFeed.tsx`
- Modify: `src/app/sitemap.ts`(`'/samguk/videos'` 추가, `LAST_MODIFIED` `'2026-11-05'`)
- Test: `tests/videos/videosPage.test.tsx`, `e2e/videos.spec.ts`

**Interfaces:**
- Consumes: `getChannelVideos`, `VideoPlayer`, `itemListJsonLd`, `portraitSrc`, `characterById`, `CoupangBanner`
- Produces: `<VideosBrowser videos={Video[]} faces={Record<string,{name:string;portrait:string|null}>} />`. 서버 page가 `faces`를 만들어 넘기므로 클라이언트 번들에 열전 본문이 들어가지 않는다. `<VideoFeed videos startIndex onClose />`

- [ ] **Step 1: 실패하는 테스트**(서버 HTML):
  - 제목 `쇼츠로 보는 삼국지`, `/samguk`으로 가는 `내 얼굴은 어떤 장수?` 링크
  - 카드 3개(`data-video-id` 3개)이고 첫 카드가 `2U3ZFgCdnzU`
  - 인물 칩: `조조 2`, `전체 3`
  - `"@type":"ItemList"`, 쿠팡 subId `videos-hub`
  - 빈 목록이면 `아직 올라온 영상이 없어요`가 있고 카드는 0개
  - sitemap: `SITEMAP_ROUTES`에 `/samguk/videos`(기존 sitemap 테스트가 날짜를 검사)
- [ ] **Step 2: 실패 확인** `npx vitest run tests/videos/videosPage.test.tsx tests/sitemap.test.ts`
- [ ] **Step 3: 구현**
  - 격자·필터·NEW 배지는 시안 ②와 spec ③을 따른다. 필터는 URL을 바꾸지 않는 클라이언트 상태다.
  - 카드를 누르면 `VideoFeed`가 열린다. 전체 화면 고정 레이어(`fixed inset-0 z-50`, 바디 스크롤 잠금)이고, 세로 `scroll-snap-type: y mandatory`다. `IntersectionObserver`로 60% 이상 보이는 칸만 `VideoPlayer`를 열고 나머지는 썸네일이다. 닫기(×, `aria-label="목록으로"`)와 Esc로 닫는다.
  - 피드가 열리면 `history.replaceState`로 `?v=<id>`를 붙이고, 닫으면 뗀다.
  - 처음 들어올 때 `?v=`가 `isVideoId`이고 목록에 있으면 그 칸부터 피드를 연다. 아니면 무시한다.
  - 피드 겉 영역의 "나는 누구 닮았을까?"는 `video_test_click {slot:'videos'}`, "구독"은 `video_subscribe_click`을 보낸다.
- [ ] **Step 4: E2E 작성** `e2e/videos.spec.ts`(모바일 390x844):
  - 격자 첫 카드를 누르면 `role=dialog`가 보이고 URL에 `?v=2U3ZFgCdnzU`
  - 아래로 넘기면 2번째 칸에 iframe이 1개뿐인지
  - 닫기 버튼으로 격자로 돌아옴
  - `/samguk/videos?v=<script>`면 dialog 없음
  - E2E는 키 없이 빌드하므로 RSS 경로를 탄다. 네트워크가 없으면 빈 목록 문구만 확인하고 나머지는 `test.skip`
- [ ] **Step 5: 통과 확인** `npm test` 후 `npm run test:e2e -- e2e/videos.spec.ts`
- [ ] **Step 6: 커밋** `feat(videos): 쇼츠 모음 페이지·세로 피드`

### Task 7: 닮은꼴 결과·공유 착지에 영상 카드와 엮인 장수

**Files:**
- Create: `src/app/api/samguk/videos/[id]/route.ts`, `src/components/videos/ResultVideoBlock.tsx`, `src/components/videos/ResultVideos.tsx`
- Modify: `src/app/samguk/(match)/page.tsx`(`<CoupangBanner subId="samguk" />` div 바로 뒤, `NextTests` 앞), `src/components/share/SharePage.tsx`(kind가 `samguk`일 때 `CoupangBanner` 뒤)
- Test: `tests/videos/resultVideos.test.tsx`

**Interfaces:**
- Consumes: `getChannelVideos`, `videosForPerson`, `relatedFaces`
- Produces:
  - `GET /api/samguk/videos/<id>` → `{ video: Video | null, faces: SgTile[] }`. 헤더 `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`. 모르는 id는 404 `{video:null,faces:[]}`
  - `<ResultVideoBlock name video faces />`: 루트 `no-screenshot`. video가 있으면 "내 장수 이야기, 1분 영상" 카드(썸네일 112×199, `영상 보기` → `/samguk/videos?v=<id>`, 클릭 시 `video_play {slot:'result'}`). faces가 있으면 "내 장수와 엮인 장수들" 5칸과 `상관도 전체` → `/samguk/people/<id>`. 둘 다 비면 null
  - `<ResultVideos id name />`: 마운트 시 fetch, 받기 전에는 아무것도 그리지 않음(자리 흔들림 없음)
- [ ] **Step 1: 실패하는 테스트**
  - route GET(`xiaohoudun`) → video.id `R-lrShfZU7s`, faces 길이 ≤5, Cache-Control 헤더
  - route GET(`nope`) → 404
  - `ResultVideoBlock` HTML 루트에 `no-screenshot`, `/samguk/videos?v=R-lrShfZU7s`, `<iframe` 없음
  - 영상 없는 인물(video null, faces 있음): 카드 없음, 엮인 장수만
  - `SharePage` samguk(`xiaohoudun`) HTML에 `내 장수와 엮인 장수들`(서버에서 직접 `getChannelVideos` mock)
- [ ] **Step 2: 실패 확인** `npx vitest run tests/videos/resultVideos.test.tsx`
- [ ] **Step 3: 구현.** 공유 착지는 서버 컴포넌트라 API를 거치지 않고 직접 `ResultVideoBlock`을 그린다. 카드 문구 "내 장수"는 공유 착지에서는 "친구 장수"로 바꾼다(prop `who: '내' | '친구'`).
- [ ] **Step 4: 통과 확인** + `npm test`
- [ ] **Step 5: 커밋** `feat(samguk): 결과·공유 착지에 영상 카드·엮인 장수`

### Task 8: 허브 띠

**Files:**
- Create: `src/components/videos/VideoStrip.tsx`
- Modify: `src/app/samguk/people/page.tsx`(허브 첫 화면 지도 아래), `src/app/samguk/(match)/layout.tsx`(`{children}`와 `<PageGuide>` 사이)
- Test: `tests/videos/strip.test.tsx`

**Interfaces:**
- Consumes: `getChannelVideos`
- Produces: `<VideoStrip videos={Video[]} />`: 제목 "쇼츠로 보는 삼국지", 최신 4편 세로 썸네일(110×196)을 가로로 넘긴다. 링크 `/samguk/videos?v=<id>`, 끝에 "전체 보기" → `/samguk/videos`, 루트 `no-screenshot`. 비면 null
- 참고: (match) 레이아웃에 넣으면 결과 화면 아래에도 보인다. spec의 "결과 전" 조건은 이것으로 대신한다. 결과 화면에서는 페이지 맨 아래 안내문 위에 있게 되어 Task 7 카드와 겹치지 않는다.
- [ ] **Step 1: 실패하는 테스트.** 4편 이하, 링크 형식, 빈 목록 null, 열전 허브 HTML에 `쇼츠로 보는 삼국지`
- [ ] **Step 2: 실패 확인** `npx vitest run tests/videos/strip.test.tsx tests/peopleHub.test.tsx`
- [ ] **Step 3: 구현**
- [ ] **Step 4: 통과 확인**
- [ ] **Step 5: 커밋** `feat(videos): 허브 쇼츠 띠`

### Task 9: 마무리 검증과 문서

**Files:**
- Modify: `CLAUDE.md`(새 절 "삼국지 쇼츠 연결 (/samguk/videos)": 데이터 흐름, 보정 파일, 환경변수, GA 이벤트, 채널 프로필 링크 주소), `tests/videos/boundaries.test.ts`(신규)

- [ ] **Step 1: 경계 테스트.** `src/**`에서 `"use client"`로 시작하는 파일 중 `@/lib/videos/fetch`나 `YOUTUBE_API_KEY`를 담은 파일이 없는지 파일을 읽어 확인
- [ ] **Step 2: 전체 실행** `npm test` → 전부 PASS
- [ ] **Step 3: 빌드** `npx next build` → 성공(로컬은 키가 없으므로 RSS 경로)
- [ ] **Step 4: E2E** `npm run test:e2e` → 기존 + videos 통과
- [ ] **Step 5: CLAUDE.md 갱신** 후 커밋 `docs: 쇼츠 연결 절 추가`
- [ ] **Step 6: 배포는 하지 않는다.** main 머지·푸시는 사용자 확인 뒤에 한다.
