# 부적 예시 그림(서버 HTML) + /bujeok 미리보기 이미지 — 구현 계획 (쉬운 화면 작업 다음)

> 사용자 말(2026-11-11): "그럼 예시 사진을 넣어두면 되려나" → "그러게 og 태그에도 그런게 있음 좋겠는데". 소원별 페이지(/bujeok/pass 등)는 이번 범위 밖.
> 앞 계획 둘(`2026-11-11-bujeok-jeoman.md`, `2026-11-11-bujeok-simple.md`)이 끝난 코드 위에서 한다. 그 계획들의 "지켜야 할 것"이 그대로 적용된다.

## 1. 예시 그림 뽑기 스크립트

**만들 파일:** `scripts/bujeok-examples.mjs`(또는 .ts, 레포 관례), 결과 `public/bujeok/examples/*.webp`, `public/bujeok/og-bujeok.png`

- 새로 그리지 않는다: 실제 `BujeokSvg`(crop, 기본 획, 도장 있음, 이름 없음, variant 0)를 `renderToStaticMarkup`으로 뽑아, 붓 글꼴·Gowun Batang을 `@font-face`로 붙인 HTML에 넣고 Playwright로 찍는다. (`npx tsx`로 TSX를 불러올 수 있으면 그 길, 안 되면 빌드된 앱의 페이지를 찍는 길 — 고른 길을 스크립트 머리 주석에 적는다.)
- 소원 11 × 마감 2(paper, gold). holo는 정지 그림이 금박과 거의 같아 뽑지 않는다(Claude 판단).
- 크기: 카드 영역 그대로 480×1016(CARD_BOX 240×508의 2배), WebP 품질 82 정도(sharp가 있으면 sharp, 없으면 Playwright PNG → 가능한 변환기. 새 의존성을 들이지 말 것; 변환기가 없으면 PNG로 두고 보고).
- 파일 이름 = 검색어 로마자 + 마감: `hapgyeok-bujeok-gold.webp` 식. 소원 로마자: money jaemul, pass hapgyeok, health geongang, love yeonae, guard aengmagi, allgood mansahyeongtong, career chwieop-seungjin, business saeop-gaeeop, family gajok-pyeongan, samjae samjae-magi, wish sowon-seongchwi. 이 표는 `src/content/bujeok.ts` 옆(또는 같은 파일)에 `WISH_SLUG`로 두고 스크립트와 페이지가 같이 쓴다.
- alt 문구 함수 `exampleAlt(wish, finish)`: `"<label> 부적 <hanja> <금박|종이> 잠금화면"` (예: "합격 부적 金榜題名 금박 잠금화면"). 테스트로 11개 모두 확인.
- 미리보기 이미지 `public/bujeok/og-bujeok.png` 1200×630: 먹빛 바탕(시안 A와 같은 radial), 금박 부적 셋(가운데 합격 크게, 좌우 재물·만사형통 조금 작게 살짝 기울여), 왼쪽 또는 아래에 "나만의 부적"(Gowun Batang 700, #F3D88C)·"마지막 한 획을 직접 그어 완성해요"(작게). 붉은 바탕 금지, 이모지 금지.
- 결과 파일은 커밋한다(빌드 때 다시 만들지 않음). 전체 용량을 보고에 적는다.

## 2. 서버 HTML에 예시 그림

**고칠 파일:** `src/app/bujeok/page.tsx`(서버), 필요하면 새 서버 컴포넌트 `src/components/bujeok/ExampleGallery.tsx`, 테스트 `tests/bujeok/`에 하나

- 첫 화면(클라이언트 앱) 아래, 가이드 글 위에 "소원별 부적" 칸: 금박 예시 11장을 4열 격자(시안 A 타일과 같은 느낌, 먹빛 바탕)로 `<img src="/bujeok/examples/…-gold.webp" alt={exampleAlt} width height loading="lazy">`. 각 그림을 누르면 그 소원이 골라진 만들기 화면으로(`/bujeok?wish=<wish>&style=trad&finish=gold`, 위로 스크롤).
- 서버에서 렌더되어 HTML 소스에 `<img>`가 나와야 한다(테스트: page를 서버 렌더한 문자열에 11개 img·alt가 있음, 또는 e2e에서 JS 끄고 확인).
- 클라이언트 첫 화면의 큰 그림이 그려지기 전(하이드레이션 전) 자리에 합격/시기 기본값 금박 webp를 깔아 두면 첫인상이 빨라진다 — 깜빡임 없이 할 수 있으면 하고, 어려우면 건너뛰고 보고.

## 3. /bujeok 미리보기 이미지와 설명

**고칠 파일:** `src/app/bujeok/layout.tsx`, `tests/seo-snippets.test.tsx`

- `IMAGE`를 `/bujeok/og-bujeok.png`(1200×630)로. openGraph·twitter 둘 다.
- `DESCRIPTION`을 `tests/seo-snippets.test.tsx`의 다른 페이지 기준(길이·끝맺음 규칙은 그 테스트를 읽고 그대로)에 맞게 다시 쓰고, /bujeok를 그 테스트 목록에 넣는다. 소원이 11개이므로 "재물·합격·건강·연애·액막이 중" 같은 옛 문구는 뺀다. 효험 단정 없음. 예 방향: "합격·재물·건강 등 소원 11가지 중 하나를 고르고 마지막 한 획을 직접 그어 완성하는 부적 카드. 잠금화면 저장·선물까지 무료".
- TITLE도 테스트 기준에 맞는지 확인(지금 것이 맞으면 그대로).

## 확인

`npx tsc --noEmit`, 건드린 파일 lint, `npm test`, `npm run build` 뒤 부적 e2e 둘. 작업 단위 커밋(한국어 한 줄 + `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`), 푸시 금지, 남의 변경 파일 건드리지 않기.

## 4. 함께 고칠 것

- /bujeok·선물 착지(`.bj-dark` 쓰는 화면)에서 사이트 공용 푸터와 아래 탭 막대가 밝은 색이라 먹빛 화면 아래가 뚝 끊긴다. 공용 컴포넌트 모양은 그대로 두고, 그 화면에서만 바탕·글씨 색이 먹빛을 따르게(예: `body:has(.bj-dark)` 또는 레이아웃에서 경로 기준 클래스). 다른 페이지 푸터는 바뀌지 않음을 확인.
