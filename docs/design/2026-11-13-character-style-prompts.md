# 캐릭터 그림체 시안: 지시문과 제미나이 사용법 (2026-11-13)

민화풍 캐릭터(해태·저승사자·무당)를 그림체 세 가지로 뽑아 비교했어요.

- 결과 비교: `2026-11-13-style-compare.jpg` (낱장은 같은 폴더의 `style-A/B/C`)
- 뽑은 곳: 제미나이 앱(gemini.google.com, Pro 요금제). 낱장 그림은 화면 캡처라 작아요(606×452). 원본은 제미나이 대화 목록의 "Korean Folklore Mascot …" 세 개에 있어요.
- 레포의 `GEMINI_API_KEY`는 무료 등급이라 이미지 모델 한도가 0이에요(429). 스크립트로 돌리려면 AI Studio에서 결제를 켜야 해요.

## 제미나이 이미지 지시문 요령

구글 공식 문서 두 곳에서 확인한 내용이에요.

1. **키워드 나열 말고 장면을 문장으로 써요.** "4k, masterpiece" 같은 꼬리표는 효과가 없어요.
2. **순서는 주제 → 행동 → 장소·맥락 → 구도 → 화풍.** 첫 문장은 "Create …"처럼 동사로 시작해요.
3. **무엇에 쓸 그림인지 적어요.** "20대가 쓰는 테스트 사이트의 마스코트"처럼 용도를 주면 분위기를 맞춰 줘요.
4. **재료와 질감을 구체적으로.** "robe" 말고 "white-collared black dopo robe", "paper" 말고 "aged hanji with mulberry fibers".
5. **원하는 것만 긍정문으로.** "no text" 대신 "the image contains only these three characters on a plain background".
6. **한 번에 인물을 적게.** 여섯을 한 줄에 세우는 것보다 셋씩, 확정 뒤에는 한 명씩 뽑는 게 잘 나와요.
7. **고칠 때는 대화로 한 가지씩.** "다른 건 그대로 두고 해태 몸만 청록으로"처럼 유지할 것을 꼭 말해요.
8. **화풍을 맞추려면 참고 이미지를 넣고 역할을 말해요.** "첨부한 그림의 화풍 그대로, 같은 캐릭터가 손을 흔드는 모습". 캐릭터 참고는 모델에 따라 4~5장까지예요.
9. **글자를 넣을 때는 따옴표 안에 정확한 문구와 글꼴 느낌을 적어요.** 나온 글자는 꼭 읽어서 확인해요.
10. **일러스트·스티커 틀**: "A [화풍] of a [주제와 소품] doing [행동]. The design features [선·명암 특징] and [색·배경]."

출처: [Gemini API 이미지 생성 문서](https://aistudio.google.com/docs/image-generation), [Ultimate prompting guide for Nano Banana](https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-nano-banana)

## 실제로 쓴 지시문

제미나이 입력창은 엔터를 치면 바로 전송돼서, 줄바꿈 없이 한 문단으로 넣었어요. **공통 묘사 + 그림체 하나**를 이어 붙여요.

### 공통 묘사

```
Create a character design illustration, landscape 4:3, of three original mascot friends from Korean folklore, standing together as a group and smiling at the viewer, for a playful Korean personality-test website loved by people in their twenties. On the left sits Haetae, a small guardian lion-dog beast with one short horn, a fluffy mane made of round cloud curls, a body covered in fish-scale patterns, a brass bell on a red collar, and a wide toothy grin with crossed, goofy round eyes. In the middle stands Jeoseung-saja, the Korean grim reaper imagined as a deadpan young office clerk. He has a pale face, sleepy half-lidded eyes, a wide-brimmed black horsehair gat hat with a string of amber beads under the chin, and a plain black dopo robe with a white collar. He holds a small paper ledger and an ink brush. On the right stands Mudang, a cheerful young shaman woman in a vermilion ritual robe worn over a cobalt blue vest with rainbow-striped saekdong sleeves. She waves an open paper fan in one hand and shakes a cluster of brass bells in the other, and her hair is tied in a neat low bun with a jade hairpin. All three have chibi proportions, about two and a half heads tall, with big readable faces. They are shown full body, centered, with generous empty space around them. The image contains only these three newly invented characters on a plain background.
```

### 그림체 A: 민화 그대로, 귀엽게

```
Paint it as a late-Joseon Korean minhwa folk painting that happens to be adorable: slightly wobbly ink-brush outlines, flat mineral pigments in ochre yellow, vermilion, malachite green, indigo and chalk white, and naive hand-painted shapes full of humor. The background is warm, aged hanji paper with visible mulberry fibers.
```

### 그림체 B: 요즘 애니메이션 캐릭터

```
Draw it as a character sheet for a modern 2D animated feature film: clean, confident linework that varies in weight, simple two-tone cel shading, very expressive faces and strong, appealing silhouettes. Their costumes and fur carry patterns borrowed from minhwa folk painting, such as cloud curls, scale patterns and stylized stripes. The palette is saturated but harmonious: cobalt blue, lime green, vermilion, ochre and ink black. The background is a plain, soft off-white.
```

### 그림체 C: 그림책·스티커

```
Paint it as a contemporary picture-book sticker illustration: bold, simple shapes in opaque gouache with visible dry-brush texture and a light risograph grain. Shapes are separated by color alone, with a limited palette of cobalt blue, lime green, warm ochre, vermilion, cream and near-black. The mood is graphic, trendy and friendly. The background is plain cream.
```

## 그림체를 정한 뒤 순서

1. 고른 그림을 참고 이미지로 넣고, 캐릭터를 **한 명씩** 따로 뽑아요(정면·투명에 가까운 단색 배경).
2. 같은 방법으로 호랑이·까치·도깨비를 추가해요. 지시문에 "첨부한 그림과 같은 화풍"을 넣어요.
3. 표정 2~3종(기본·놀람·졸림)은 "다른 건 그대로, 표정만"으로 고쳐 뽑아요.
4. 영화·애니메이션·게임 캐릭터 이름은 지시문에 넣지 않아요. 나온 그림이 기존 캐릭터와 닮았는지 눈으로 확인해요.

## 2차 (같은 날): 표정·동작, 덜 귀엽게, 영화 화면 느낌

사용자가 A를 고른 뒤 "움직이고 표정 다양하게", "너무 귀엽기만 하다", "케데헌 느낌이 아니다"라고 해서 세 장을 더 뽑았어요. 비교 그림은 `2026-11-13-v2-compare.jpg`.

- **① 해태 표정·동작 시트** (`v2-1`): A 대화에 이어서 "같은 화풍·같은 캐릭터 그대로"라고 먼저 말하고 여섯 동작을 순서대로 적었어요. 화풍과 생김새가 그대로 유지됐어요.
- **② 민화풍, 등신 키우기** (`v2-2`): 같은 대화에서 "20~30대용, 어린이 같지 않게, 4.5등신, 팔다리 길게"와 캐릭터별 태도(해태는 송곳니 보이는 자신만만한 웃음, 저승사자는 차갑고 우아하게, 무당은 굿 중간의 눈빛)를 적었어요.
- **③ 극장판 애니메이션 화면** (`v2-3`): 새 대화에서 화풍을 "modern stylized 3D animated feature film: sculpted, slightly angular models, anime-influenced faces, painterly texture, 2D line accents and halftone highlights, rim lighting, shallow depth of field"로 적고, 배경을 밤의 서울 옥상(남색에 파랑·라임·금빛 조명)으로 줬어요. 영화 제목이나 캐릭터 이름은 넣지 않았어요.

대화에서 이어 뽑을 때 배운 점:
- 이미지 보기 화면은 Esc로 닫아요. 왼쪽 위를 누르면 홈으로 나가요.
- 긴 대화에서는 새 그림 위치가 달라져서, 화면 좌표 대신 그림 요소를 찾아 눌러야 해요.
