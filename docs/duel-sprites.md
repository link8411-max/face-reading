# 일기토 장수 스프라이트 생성 기록

생성일: 2026-10-28 · 도구: PixelLab Creator → Create image → **Pixen** (1 generation/장)

## 공통 설정

- 128×128, Transparent background, Direction = East (facing right), View = Side (Sidescroller), Detail = Highly detailed, Outline = Black outline
- Init Image = `docs/duel-sprite-tests/guanyu_test_128.png` (관우)
- Init Image Strength = 100 (기본값 150에서 낮춤). 예외: 마초·조운 최종본은 60 (아래 참고)
- 설명문 = `<장수별 설명>` + 공통 꼬리:
  `, riding a horse. Same art style, same pixel size and same pose as the init image. Side view facing right, 16-bit SNES pixel art, Romance of the Three Kingdoms III style.`

계정 사용량: 생성 전 8/40, 생성 후 24/40 (16회 사용 = 12장 + 재시도 4회)

## 장수별 기록

| id | 시도 | 강도 | 장수별 설명 | 결과 |
|---|---|---|---|---|
| guanyu | — | — | (테스트 그림 `guanyu_test_128.png` 그대로 사용) | 채택 |
| zhangfei | 1 | 100 | Zhang Fei, dark swarthy face, bristling black tiger beard, big round glaring eyes, black iron armor with red cloth, long serpent spear with wavy blade, BLACK horse (not brown) | 채택 (말이 검정이 아니라 짙은 갈색) |
| zhaoyun | 1 | 100 | Zhao Yun, young clean handsome face, silver white armor with blue cloth, white cape, silver helmet with white plume, long silver spear, WHITE horse | 재시도 (말이 갈색) |
| zhaoyun | 2 | 100 | Zhao Yun on a pure WHITE horse with white mane and white coat (the horse is white, not brown), young clean handsome face, silver white armor with blue cloth, white cape, silver helmet with white plume, long silver spear | 버림 (말이 여전히 갈색, 갑옷이 어두워짐) |
| zhaoyun | 3 | 60 | Zhao Yun on a pure WHITE horse (white coat, white mane, not brown), young clean handsome face, silver white armor with blue cloth, white cape, silver helmet with white plume, long silver spear | **채택** (흰 말. 말 전신이 보이는 작은 구도라 관우보다 인물이 작음) |
| machao | 1 | 100 | Ma Chao, young handsome face, silver armor with white cloth, silver helmet with a lion crest, long spear, WHITE horse | 재시도 (말이 회갈색) |
| machao | 2 | 60 | Ma Chao on a pure WHITE horse (white coat, white mane, not brown), young handsome face, silver armor with white cloth, silver helmet with a lion crest, long spear | **채택** (흰 말. 조운 3차와 같은 작은 구도) |
| huangzhong | 1 | 100 | Huang Zhong, old general with long WHITE beard, bronze armor with yellow cloth, holding a bow with an arrow quiver, brown horse | 채택 (활은 있으나 수염이 흰색이 아닌 짙은 회색, 관우와 닮음) |
| xuchu | 1 | 100 | Xu Chu, huge bare muscular arms, shaven head, simple leather armor, huge iron mace, brown horse | 채택 (철퇴 대신 망치 모양) |
| xiaohoudun | 1 | 100 | Xiahou Dun, black EYEPATCH over left eye, dark blue armor, long sword, dark horse | 채택 (안대가 작아 안경처럼 보일 수 있음) |
| zhouyu | 1 | 100 | Zhou Yu, elegant young scholar-general, no helmet, long black hair tied up, RED robe over light armor, straight sword, white horse | 재시도 (말이 거의 화면 밖으로 잘림) |
| zhouyu | 2 | 100 | Zhou Yu mounted on a white horse, whole horse and rider fully visible inside the frame, elegant young scholar-general, no helmet, long black hair tied up, RED robe over light armor, straight sword | **채택** (말은 회백색) |
| jiangwei | 1 | 100 | Jiang Wei, young general, BLUE robe and blue armor, white headband, long spear, grey horse | 채택 |
| zhangjiao | 1 | 100 | Zhang Jiao, YELLOW turban headscarf, yellow robe, no armor, long wooden staff, old thin face with goatee, brown horse | 채택 (지팡이보다 칼에 가깝고 갑옷 조각이 보임) |
| dongzhuo | 1 | 100 | Dong Zhuo, very FAT, purple robe with gold trim, black beard, black horse | 채택 |
| lvbu | 1 | 100 | Lu Bu, golden crown with two long pheasant tail feathers, fierce face with thin mustache, golden beast-face armor, red cape, sky piercer halberd with crescent blades, deep RED horse with black mane | 채택 |
| mob | 1 | 100 | yellow turban rebel soldier, plain brown clothes, yellow headscarf, simple spear, small brown horse, no armor | 채택 (가벼운 갑옷처럼 보임) |

## 메모

- 강도 100에서는 init 이미지(관우의 갈색 말)의 색이 강하게 남아, 설명문을 강하게 써도 흰 말이 나오지 않았다. 강도 60으로 낮추니 흰 말이 나왔지만, 구도가 말 전신이 보이는 작은 크기로 바뀌어 다른 장수(근접 구도)와 인물 크기가 다르다.
- 버린 시도 파일은 저장소에 넣지 않았다.
