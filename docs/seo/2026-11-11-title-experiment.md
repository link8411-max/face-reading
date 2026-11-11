# 검색 제목 실험 (2026-11-11 배포, 2026-11-25쯤 비교)

네이버 서치어드바이저 최근 30일(11/10 갱신): 노출 1.5만, 클릭 140, 평균 CTR 0.9%. 구글(28일)은 노출 815, CTR 6.6%라 문제는 네이버.
노출은 많은데 안 눌리는 글 10개만 제목(일부는 설명도)을 바꿨다. 나머지는 대조군.

| 글 | 바꾸기 전 노출·CTR | 바꾼 것 |
|---|---|---|
| /samguk/people/dengai | 420 · 0.2% | 제목: 등애 \| 담요 두르고 낭떠러지를 굴러 촉을 무너뜨린 장수 |
| /samguk/people/lvbu | 330 · 0.3% | 제목: 여포 \| 양아버지 둘을 죽인 천하제일 무장의 최후 |
| /samguk/people/guanyu | 285 · 0.4% | 제목: 관우 \| 화웅을 벤 건 정말 관우였을까? 연의와 정사 |
| /samguk/people/zhaoyun | 265 · 0.8% | 제목: 조운 조자룡 \| 아두를 안고 조조 대군을 뚫은 장수 |
| /samguk/people/liubei | 253 · 1.6% | 제목: 유비 \| 돗자리 짜던 소년이 황제가 되기까지 |
| /samguk/duel/generals/xiaohoudun | 474 · 0.2% | 제목: 하후돈 \| 화살 맞은 눈알을 삼킨 맹장, 능력치·필살기 |
| /samguk/duel/generals/lvbu | 473 · 0.4% | 제목: 여포 \| 사람 중엔 여포, 능력치·필살기 방천화극 |
| /mbti/esfp | 841 · 0.8% | 제목 유형 코드 먼저 + 설명에 주변 평 |
| /mbti/isfj | 542 · 2.6% | 같음 |
| /mbti/isfp | 375 · 0.8% | 같음 |

대조군으로 볼 것: /mbti/estj(374·0.8%), /mbti/esfj(351·0.9%), /samguk/people/zhangfei(225·1.3%), /samguk/people(460·1.1%).

비교법: 서치어드바이저 > 리포트 > 콘텐츠 노출/클릭, 바꾼 뒤 2주 구간. 네이버가 제목을 다시 읽어야 하므로 IndexNow로 10개를 알렸다.
코드: `src/lib/people/portrait.ts` HOOK_TITLES, `src/app/samguk/duel/generals/[id]/page.tsx` DUEL_HOOK_TITLES, `src/app/mbti/[type]/page.tsx` MBTI_HOOK_TYPES.
