# 도구 페이지 본문 보강 계획 (2026-11-07)

배경: `docs/audit/2026-11-07-유입점검.md`. /face2·/animal·/samguk는 업로드 UI + 접힌 설명뿐이라 검색엔진·애드센스("가치가 별로 없는 콘텍츠")가 볼 텍스트가 적다. 사용자 결정: **결과 유형을 미리 보여 주되 "짧은 소개"(어떤 얼굴 특징·어떤 인상, 2줄)까지만**, 결과 화면의 풀이 본문(성격·연애·궁합 전문)은 결과에만 남긴다.

## 결정 사항
- 위치: 업로드 UI 아래 `PageGuide` 안. 시작 버튼 위에는 아무것도 추가하지 않는다.
- 기존 `summary`(펼침) / `intro`+`highlights`("자세히 보기"로 접힘) 구조는 **그대로 둔다**(예전 "하단 설명 길다" 피드백, `tests/pageGuideShort.test.tsx`).
- 새로 넣는 것은 `sections`: 제목 + 짧은 카드 목록. **접지 않고 보인다**(컴팩트 격자라 벽글이 아님). 순서: heading → summary → sections → 자세히 보기(details) → FAQ → 다른 테스트.
- 글 규칙: 해요체. 이모지 금지. 실존 연예인·실명 비유 금지. 참여자 수 같은 숫자 금지. `summary/intro/highlights`에 금지된 기술 단어(천문연구원·근사·윤달·저장되지·서버로 전송)는 sections에도 쓰지 않는다. 카드 body는 40~140자, 사실은 코드(판정 규칙·DB)와 어긋나지 않게.
- 한글 글꼴은 KS X 1001 2350자 서브셋이라, 새 문구에 2350 밖 글자를 쓰면 `node scripts/font-subset.mjs`를 다시 돌린다(테스트가 잡으면).

## 데이터 모델 (`src/content/pageGuides.ts`)
```ts
export interface GuideSectionItem { title: string; body: string; href?: string }
export interface GuideSection { heading: string; items: GuideSectionItem[] }
export interface PageGuideData {
  // 기존 필드 유지
  sections?: GuideSection[]
}
```
`href`는 사이트 안 경로만(`/`로 시작).

## 페이지별 내용

### /face2 (관상) — sections 2개
1. **"관상 결과 유형 6가지"**: `src/lib/shareLinks.ts` `FACE_TYPES`의 6유형(재물상·복덕상·리더상·귀인상·학자상·예술가상). 각 카드 body는 "어떤 이목구비 특징이 두드러질 때 나오는지 + 어떤 인상인지" 2줄. **판정 규칙은 face2 결과 코드(유형을 고르는 함수. `src/app/face2` 또는 `src/lib/faceAnalyzer.ts`/`faceReadingDB.ts`에서 찾아 읽기)와 일치해야 한다.** 코드에서 못 확인한 특징은 쓰지 않는다. href 없음.
2. **"부위별로 보는 관상"**: 눈·코·입·이마·턱(5개). 전통 관상 관점(눈=마음·지혜, 코=재물·자존심, 입=말·애정, 이마=초년, 턱=말년)을 각 2줄로. 기존 highlights '이목구비별 풀이'와 겹치는 문장은 피하되 뜻은 같아야 한다.

### /animal (동물상) — sections 1개
**"동물상 8가지, 나는 어느 쪽일까"**: `animalTypeDB`의 8종(강아지·고양이·여우·곰·토끼·사슴·호랑이·독수리). body는 DB `description`의 **얼굴 특징(큰 눈·둥근 얼굴형, 날카로운 눈매·갸름한 얼굴형 등)과 첫인상**만 3인칭·설명문으로 다시 쓴다("당신!" 같은 2인칭 결과 문체 금지, DB 문장을 그대로 복사하지 않는다). 성격·연애·궁합 풀이는 쓰지 않는다. 동물 이름은 `animalTypeDB[key].name`을 쓰고 8종 전부 포함(테스트로 고정). href 없음.

### /samguk (삼국지 닮은꼴) — sections 2개
1. **"이런 얼굴이면 이 장수"**: 대표 장수 8명(조조 caocao·유비 liubei·관우 guanyu·장비 zhangfei·제갈량 zhugeliang·조운 zhaoyun·여포 lvbu·주유 zhouyu; 여성 1명 추가 가능: 초선 diaochan). body는 `samgukDB` `appearance`(얼굴 묘사)와 `src/lib/samguk/vibes.ts` `characterVibes`(인상)를 바탕으로 "이런 특징의 얼굴이면 이 장수와 가깝게 나와요 + 인상 한 줄". `appearance`의 비하 표현('못생김' 등)은 쓰지 않는다. **href는 `/samguk/people/<id>`**(열전 내부 링크). id는 `src/content/samgukPeople/ids.ts`의 `PEOPLE_IDS`에 있고 `PENDING_PORTRAIT_IDS`에 없는 것만(테스트로 고정).
2. **"닮은 장수는 이렇게 찾아요"**: 3카드 — 얼굴 기준점 478개 측정(눈·코·입·얼굴형 비율), 고른 성별 기준으로 비교, 장수마다 초상화에서 잰 얼굴 프로필과 거리 계산 → 가까운 장수. `src/lib/samguk/matcher.ts`·`profiles.ts` 머리말을 읽고 사실만. "Gemini"·"AI가 판단" 같은 표현 금지(규칙 계산임).

### 그 밖의 라우트(/samguk/duel, /fortune, /fortune/daily, /fortune/mbti)
sections 없음. 건드리지 않는다.

## 렌더 (`src/components/PageGuide.tsx`)
summary `<p>` 바로 아래, `<details>` 위에:
```tsx
{guide.sections?.map((s) => (
  <div key={s.heading}>
    <h3 className="font-serif font-bold text-lg mb-3">{s.heading}</h3>
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {s.items.map((it) => (
        <li key={it.title} className="bg-white rounded-[18px] border border-line px-4 py-3">
          {it.href ? <Link href={it.href} className="font-bold hover:text-accent">{it.title}</Link> : <p className="font-bold">{it.title}</p>}
          <p className="mt-1 text-[14px] leading-relaxed text-muted">{it.body}</p>
        </li>
      ))}
    </ul>
  </div>
))}
```
디자인 토큰(bg-paper·bg-card·border-line·text-ink·text-muted·text-accent)만 쓴다. `<h3>`는 FAQ 제목과 같은 급.

## 테스트 (`tests/pageGuides.test.ts`에 추가, `tests/PageGuide.test.tsx`에 렌더 1건)
- `/face2`: sections 2개, 첫 섹션 items 6개이고 title 집합 = `FACE_TYPES` 값 집합. 둘째 섹션 5개.
- `/animal`: sections 1개, items 8개, title 집합 = `animalTypeList.map(k => animalTypeDB[k].name)`.
- `/samguk`: 첫 섹션 items ≥ 8, 모든 href가 `/samguk/people/<id>` 형식이고 id ∈ PEOPLE_IDS, ∉ PENDING_PORTRAIT_IDS. 둘째 섹션 3개.
- 공통: 모든 item body 길이 40~140, title에 이모지 없음, body에 금지 단어(천문연구원·근사·윤달·저장되지·서버로 전송·Gemini·당신) 없음.
- 렌더: `/animal` HTML에 섹션 heading과 8종 이름이 `<details` **앞에** 나오고, intro[0]는 뒤에 있음(기존 pageGuideShort 테스트와 양립).

## 완료 조건
1. `npm test` 전부 통과(기존 1480+ 포함).
2. `npm run build` 성공.
3. `npx next dev -p 3311`(또는 build 결과)로 `/face2`·`/animal`·`/samguk` 모바일 폭(390px) 스크린샷을 찍어 시작 버튼 위에 변화가 없고 아래에 카드가 보이는지 확인.
4. `src/app/sitemap.ts`의 `LAST_MODIFIED`에서 `/face2`·`/animal`·`/samguk` 날짜를 2026-11-07로.
5. 커밋하지 않는다(컨트롤러가 검토 후 커밋).
