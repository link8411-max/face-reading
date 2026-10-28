# 삼국지 새 장수 49명 초상화 생성 지침 (Antigravity용)

이 문서 그대로 진행해 주세요. 기존 52장(`public/images/samguk/*.jpg`, 2025-12-18 Antigravity로 생성)과 **똑같은 화풍**이어야 합니다.

## 1. 화풍 기준 (가장 중요)
- 먼저 아래 기존 초상화 3장을 열어 보고, 그 화풍을 기준으로 삼으세요. 이미지를 만들 때도 이 3장을 참고 이미지로 같이 넣으세요.
  - `public/images/samguk/사마의.jpg` (문관·책사형)
  - `public/images/samguk/동탁.jpg` (거구·악역형)
  - `public/images/samguk/여포.jpg` (갑옷 무장형)
- 기존 그림의 특징:
  - 1990년대 코에이 『삼국지』 시리즈 얼굴 그림 같은 **셀 채색 극화체 일러스트**: 굵은 검은 외곽선, 평평하게 칠한 면, 2~3단계 음영
  - **도트와 디더링 질감**이 보이는 저해상도 게임 그림 느낌. 윤곽선에 계단 모양 픽셀이 보임
  - 따뜻한 **황토·주황빛 피부**, 채도는 너무 높지 않게
  - 얼굴이 화면을 꽉 채우는 **가슴 위 정면 구도**, 1:1 정사각형, 단색 또는 단순한 배경
- 하지 말 것:
  - 실사, 사진, 3D 렌더
  - 매끈한 현대 디지털 그림, 미국 만화 망점, 펜화나 동판화 같은 빗금 그림
  - 글자, 이름, 테두리, 로고, 워터마크
  - 하얗고 매끈한 피부

## 2. 공통 프롬프트 (모든 인물 앞에 붙이기)
```
Create ONE portrait in EXACTLY the same art style as the attached reference portraits from my game (Sima Yi, Dong Zhuo, Lu Bu). Match their rendering precisely: 1990s KOEI Romance of the Three Kingdoms character portrait, cel-shaded gekiga illustration with bold black outlines, flat color areas with 2-3 step shading, visible low-resolution pixels and dithering texture with stair-stepped edges, warm ochre-tan skin, moderately muted colors. Close head-and-shoulders bust, face fills most of the frame, square 1:1, simple plain background like the references. No text, no name, no border, no logo, no watermark. Not photorealistic, not modern smooth digital art, not comic halftone, not pen etching.
SUBJECT:
```

## 3. 인물 목록 (SUBJECT 자리에 넣을 묘사)
파일 이름은 기존과 같이 **한글 이름.jpg**로 저장해요(예: `황호.jpg`).

### 간신배 19명
| 파일 | 묘사 (SUBJECT) |
|---|---|
| 황호.jpg | Huang Hao, scheming eunuch of late Shu Han. Beardless plump face, narrow sly sideways eyes, thin lips with an ingratiating smile, black eunuch court cap, crimson palace robe with green collar. The flatterer who whispers lies to the emperor. |
| 장양.jpg | Zhang Rang, leader of the Ten Eunuchs of the Han court. Elderly beardless face, heavy-lidded cunning eyes, thin cruel smile, tall black gauze eunuch hat, rich dark purple court robe with gold embroidery. Corrupt palace power behind the throne. |
| 채모.jpg | Cai Mao, Liu Biao's brother-in-law and Jingzhou naval commander who betrayed to Cao Cao. Middle-aged, sharp mustache and short goatee, suspicious narrow eyes, smug expression, lamellar armor with dark blue robe. A treacherous schemer. |
| 미방.jpg | Mi Fang, Liu Bei's brother-in-law who surrendered to Wu and abandoned Guan Yu. Soft round face, small worried eyes avoiding the viewer, thin mustache, nervous guilty expression, green Shu officer robe with light armor. |
| 맹달.jpg | Meng Da, the turncoat general who switched sides repeatedly. Lean face, shifty side-glancing eyes, neat mustache, half-smile of calculation, armor mixing Shu green and Wei blue colors. |
| 조충.jpg | Zhao Zhong, one of the Ten Eunuchs. Beardless round face, fake gentle smile hiding greed, small glittering eyes, black eunuch court cap, dark green palace robe with gold trim. |
| 건석.jpg | Jian Shuo, eunuch commander of the Western Garden army. Beardless long sly face, raised brows, scheming smirk, eunuch cap with a small military badge, dark red robe over light armor. |
| 단규.jpg | Duan Gui, Ten Eunuchs member who killed He Jin. Beardless gaunt face, cold cruel narrow eyes, thin pressed lips, black eunuch cap, black-purple robe. |
| 장윤.jpg | Zhang Yun, Cai Mao's partner, Jingzhou naval officer who defected to Cao Cao. Smooth smug face, thin mustache, eyes glancing sideways, lamellar armor with dark teal robe. |
| 부사인.jpg | Fu Shiren, Shu officer who surrendered Gongan to Wu alongside Mi Fang. Nervous sweaty face, short sparse beard, eyes darting, green Shu armor slightly askew. |
| 양송.jpg | Yang Song, greedy advisor of Zhang Lu who sold out his lord for bribes. Plump greedy face, curled mustache, grin showing teeth, gold coin ornament on cap, rich brown silk robe. |
| 곽도.jpg | Guo Tu, Yuan Shao's scheming advisor who slandered rivals. Lean face, pointed goatee, smug half-closed eyes, black scholar cap, gold-brown robe. |
| 봉기.jpg | Feng Ji, Yuan Shao's proud advisor. Stern haughty face, long neat beard, raised chin, disdainful eyes, black scholar cap, dark gold robe. |
| 허유.jpg | Xu You, arrogant advisor who defected from Yuan Shao to Cao Cao and bragged too much. Grinning boastful face, unkempt beard, one eyebrow raised, loose scholar cap, gray-brown robe. |
| 잠혼.jpg | Cen Hun, corrupt favorite eunuch of the last Wu emperor. Beardless pale-ochre puffy face, oily ingratiating smile, narrow eyes, black eunuch cap, crimson Wu palace robe. |
| 손침.jpg | Sun Chen, arrogant Wu regent who deposed an emperor. Young cocky face, thin mustache, contemptuous sneer, ornate red-gold crown, red Wu armor with robe. |
| 가충.jpg | Jia Chong, cunning Wei/Jin court official, Sima Zhao's flatterer. Smooth well-fed face, neat thin beard, sly polite smile, tall black official hat, dark blue court robe. |
| 양의.jpg | Yang Yi, talented but petty Shu official who feuded with Wei Yan. Narrow irritable face, thin mustache, resentful frown, black scholar cap, green robe. |
| 이엄.jpg | Li Yan, Shu regent who lied about supplies and was demoted. Middle-aged fleshy face, neat beard, evasive smiling eyes, black official cap, green-and-gold robe. |

### 위 10명
| 파일 | 묘사 |
|---|---|
| 조비.jpg | Cao Pi, first emperor of Wei. Young, pale-ochre handsome cold face, thin mustache, haughty eyes, imperial crown with beaded tassels, dark blue imperial robe. |
| 조인.jpg | Cao Ren, steadfast Wei general. Broad stern face, thick beard, determined eyes, heavy blue Wei armor and helmet. |
| 하후연.jpg | Xiahou Yuan, swift Wei general famed for lightning raids. Lean fierce face, short beard, sharp eyes, light blue armor, bow on shoulder. |
| 서황.jpg | Xu Huang, Wei general wielding a great axe. Rugged square jaw, short beard, calm disciplined eyes, blue armor, axe head visible. |
| 우금.jpg | Yu Jin, strict Wei general who later surrendered to Guan Yu. Stern older face, neat beard, tired ashamed eyes, blue armor. |
| 방덕.jpg | Pang De, loyal and fearless general who brought his own coffin to battle. Fierce scarred face, wild beard, intense eyes, dark armor. |
| 등애.jpg | Deng Ai, Wei general who conquered Shu through a mountain path. Weathered determined face, short beard, stammering-scholar look with strategist eyes, blue armor. |
| 종회.jpg | Zhong Hui, brilliant but ambitious Wei strategist who rebelled. Young arrogant handsome face, thin mustache, cold calculating eyes, scholar hat and dark blue robe. |
| 정욱.jpg | Cheng Yu, ruthless Wei strategist. Tall gaunt older face, long thin beard, severe narrow eyes, black scholar cap, dark robe. |
| 순유.jpg | Xun You, quiet Wei strategist, Xun Yu's nephew. Mild scholarly face, neat beard, thoughtful gentle eyes, black scholar cap, blue-gray robe. |

### 촉 8명
| 파일 | 묘사 |
|---|---|
| 마속.jpg | Ma Su, overconfident Shu strategist who lost Jieting. Young proud face, thin mustache, bookish arrogant eyes, scholar cap, green robe. |
| 법정.jpg | Fa Zheng, sharp-tongued Shu strategist. Lean clever face, thin goatee, piercing eyes, black scholar cap, green robe. |
| 관평.jpg | Guan Ping, Guan Yu's adopted son. Young earnest face, reddish-tan complexion like his father, small beard starting, green headscarf and armor. |
| 관흥.jpg | Guan Xing, Guan Yu's son. Young brave face, reddish-tan complexion, beardless, green headband, green armor, crescent blade glimpse. |
| 장포.jpg | Zhang Bao, Zhang Fei's son. Young fierce face with big round eyes like his father, short bristly beard starting, dark armor, snake spear tip. |
| 마대.jpg | Ma Dai, Ma Chao's cousin, loyal Shu general. Western Liang features, sharp nose, short beard, steady eyes, white-and-silver armor. |
| 왕평.jpg | Wang Ping, cautious and loyal Shu general. Plain sturdy face, short beard, careful sensible eyes, green Shu armor. |
| 유선.jpg | Liu Shan, last emperor of Shu, easily misled. Soft round plump face, sleepy innocent eyes, small mustache, imperial crown with tassels, green-gold imperial robe. |

### 오 6명
| 파일 | 묘사 |
|---|---|
| 황개.jpg | Huang Gai, veteran Wu general of the fire attack at Red Cliffs. Old weathered face, gray beard, battle-hardened eyes, red Wu armor. |
| 정보.jpg | Cheng Pu, senior Wu general. Older dignified face, long beard, steady eyes, red armor with gold trim. |
| 손견.jpg | Sun Jian, the Tiger of Jiangdong, founder of Wu's power. Bold heroic face, strong beard, fiery eyes, red headscarf, red armor. |
| 제갈근.jpg | Zhuge Jin, Wu diplomat and Zhuge Liang's elder brother. Long gentle face, long chin beard, kind diplomatic eyes, scholar cap, red-brown robe. |
| 주태.jpg | Zhou Tai, Wu bodyguard general covered in battle scars. Rugged scarred face, short beard, unflinching eyes, red armor. |
| 장소.jpg | Zhang Zhao, stern senior minister of Wu. Elderly strict face, long white beard, disapproving eyes, black scholar cap, dark red robe. |

### 기타 6명
| 파일 | 묘사 |
|---|---|
| 화웅.jpg | Hua Xiong, Dong Zhuo's giant vanguard general. Huge brutish face, thick black beard, menacing eyes, dark heavy armor. |
| 안량.jpg | Yan Liang, Yuan Shao's fierce general. Proud brawny face, thick beard, aggressive eyes, gold-and-brown armor. |
| 문추.jpg | Wen Chou, Yuan Shao's other great general. Rough angular face, wild beard, scowling eyes, gold-and-brown armor. |
| 진궁.jpg | Chen Gong, principled strategist who served Lu Bu. Lean upright face, neat beard, stern righteous eyes, scholar cap, gray robe. |
| 고순.jpg | Gao Shun, Lu Bu's loyal and incorruptible commander. Stoic plain face, short beard, silent resolute eyes, dark armor. |
| 이유.jpg | Li Ru, Dong Zhuo's cunning advisor. Thin pale-ochre face, narrow scheming eyes, thin mustache, sly smile, black scholar cap, dark purple robe. A villainous schemer. |

### 이름난 악역 10명 (2026-10-29 추가)
| 파일 | 묘사 |
|---|---|
| 왕랑.jpg | Wang Lang, elderly Wei minister famous for losing a debate to Zhuge Liang. Old proud face, long flowing white beard, stiff haughty posture, strict lecturing eyes, black official cap, dark navy court robe. |
| 화흠.jpg | Hua Xin, cold-hearted Wei minister who dragged the empress out of hiding. Lean cold face, narrow slit eyes, neat mustache and chin beard, expressionless mouth, black official cap, dark green court robe. |
| 사마소.jpg | Sima Zhao, ambitious regent of Wei, son of Sima Yi. Long sharp face, half-lidded calculating eyes hiding his ambition, trimmed mustache and short beard, faint confident smirk, ornate black-and-gold cap, dark navy silk robe. |
| 조상.jpg | Cao Shuang, idle pampered Wei regent overthrown by Sima Yi. Plump soft round face, relaxed naive eyes, short beard, carefree content expression, gold-ornamented cap, luxurious crimson silk robe. |
| 장송.jpg | Zhang Song, brilliant but famously ugly official who betrayed Yi province. Small bony face with bulging forehead, pointed chin, snub upturned nose, protruding buck teeth, sharp intelligent glinting eyes, plain black cap and gray robe. Clearly homely, not handsome. |
| 이각.jpg | Li Jue, brutal warlord who seized Chang'an after Dong Zhuo. Thuggish square face, wide glaring bulging eyes, rough sideburns and stubble beard, sneering mouth, dark red armor and helmet. |
| 곽사.jpg | Guo Si, Li Jue's paranoid partner in crime. Face covered in thick shaggy beard, heavy furrowed eyebrows knitted in suspicion, thick broad nose, scowling eyes, worn iron armor and helmet. |
| 손호.jpg | Sun Hao, tyrannical last emperor of Wu. Pale nervous face, sharp upward-slanting cruel eyes, thin tight lips, short beard, arrogant sneer, golden imperial crown with hanging beads, red imperial robe. |
| 순우경.jpg | Chunyu Qiong, drunk general who lost the grain depot at Wuchao. Flushed red-cheeked tipsy face, droopy half-closed sleepy eyes, bushy gray-streaked beard, loose grin, worn brown armor. |
| 이숙.jpg | Li Su, smooth-talking envoy who bribed Lu Bu with the Red Hare horse. Smooth friendly face, persuasive salesman smile, clever twinkling eyes, thin mustache, black headscarf, light leather armor. |

### 바둑판으로 여러 명 만들기 (할당량 절약)
- 정사각형 한 장을 같은 크기 4칸(2×2)으로 나눠 4명을 한 번에 만들고, 칸 사이는 굵은 검은 선, 각 칸은 위와 같은 구도로 요청해요. 머리 위에 여백을 조금 두라고 해야 관이 잘리지 않아요.
- 원본은 `새장수/gridN.jpg`로 저장하고 `/usr/bin/python3 scripts/split-grid.py <grid.jpg> 왼위 오위 왼아래 오아래`로 잘라요(각 칸을 1024로 키워 한글이름.jpg로 저장).
- 3×3은 칸이 너무 작아 얼굴이 뭉개져서 쓰지 않아요.

## 4. 저장 규칙
- 1024×1024 JPEG로 `public/images/samguk/새장수/` 폴더에 한글 이름으로 저장해요. 기존 폴더와 섞이지 않게 따로 둬요.
- 한 장씩 만들어서 기존 3장과 나란히 놓고 비교해요. 화풍이 다르면(실사 느낌, 매끈함, 하얀 피부) 다시 만들어요.
- 장수 데이터와 코드 연결은 하지 않아요. Claude Code가 따로 해요.
