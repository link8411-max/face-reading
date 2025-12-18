---
description: 삼국지 캐릭터별 고유의 '킥(Kick)'을 살린 16비트 코에이 스타일 픽셀 아트 생성 프로세스
---

# ⚔️ 삼국지 캐릭터 픽셀 아트 생성 워크플로우

이 워크플로우는 `CLAUDE.md`의 '삼국지 캐릭터 아트 원칙'을 바탕으로 실제 이미지를 생성하고 관리하는 절차를 규정합니다.

## 1. 사전 준비 (Context Awareness)
- `src/lib/samgukDB.ts`에서 생성할 캐릭터의 `appearance`, `role`, `traits` 데이터를 읽는다.
- 해당 인물의 세력(`faction`)에 따른 주 색상(위-청, 촉-녹, 오-적)을 확인한다.

## 2. 프롬프트 엔지니어링 (The Koei Formula)
프롬프트 생성 시 아래의 **[KOEI 16-bit 테크니컬 스택]**을 반드시 포함한다.

- **Dithering**: `Use checkered pixel dithering for gradients and shading.`
- **Palette**: `Muted 16-bit indexed color palette, no neon or modern glows.`
- **Texture**: `1990s PC-9801 simulation game aesthetic, hand-dotted pixel look.`
- **Kick**: 캐릭터 고유의 특징(예: 관우의 긴 수염, 여포의 꿩 깃털)을 강조하여 묘사한다.

## 3. 실행 및 검증 (Execution)
- `node --env-file=.env.local pixel2_gen.mjs` (또는 통합된 배치 스크립트)를 사용하여 생성한다.
- 생성된 이미지가 다음 기준을 만족하는지 검토한다:
    - [ ] 도트가 뭉개지지 않고 선명한가?
    - [ ] 디더링 패턴이 피부나 배경에 잘 드러나는가?
    - [ ] 캐릭터의 '킥'이 즉각적으로 인지되는가?

## 4. 자산 관리 (Asset Management)
- 확정된 이미지는 `public/images/characters/[id].png` 경로로 저장한다.
- 이미지 생성 시 사용한 최종 프롬프트는 기록하여 일관성을 유지한다.

---
*Vibe Check: 단순히 그림을 그리는 것이 아니라, 90년대 게이머의 가슴을 뛰게 했던 그 전략 게임의 얼굴을 재현한다.*
