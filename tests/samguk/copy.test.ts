import { readFileSync } from 'node:fs'
import { matchCharacter, PHRASES } from '@/lib/samguk/matcher'
import { characterProfiles } from '@/lib/samguk/profiles'
import { FEATURE_KEYS } from '@/lib/face/landmarkFeatures'
import type { ZVector } from '@/lib/face/featureStats'

const zeros = () => Object.fromEntries(FEATURE_KEYS.map((k) => [k, 0])) as ZVector

// 외모 지적처럼 들릴 수 있는 표현
const HURTFUL = ['넓적', '내려간', '바짝 붙은', '짧은', '얼굴이 긴', '가운데가 긴', '미간이 넓은', '미간이 좁은', '작고', '얇은', '처진', '편이에요']

test('특징 표현은 양쪽 방향 모두 칭찬·인상 표현이다', () => {
  for (const k of FEATURE_KEYS) for (const p of PHRASES[k]) for (const w of HURTFUL) expect(p, `${k}: ${p}`).not.toContain(w)
})

test('닮은 이유는 장수와 엮어 "~처럼 … 닮았어요"로 말한다', () => {
  const z = { ...zeros(), ...characterProfiles.guanyu.z } as ZVector
  for (const k of FEATURE_KEYS) z[k] = Math.max(-1.5, Math.min(1.5, z[k]))
  const r = matchCharacter(z, '남')
  expect(r.matchReason).toMatch(new RegExp(`^${r.name}처럼 .+ 닮았어요`))
})

test('한쪽 끝에 많이 치우친(|z|>2) 특징은 닮은 이유·인상 풀이에 쓰지 않는다', () => {
  const z = { ...zeros(), faceAspect: -2.8, noseWidth: 2.9, eyeTilt: 1.2 } as ZVector
  const r = matchCharacter(z, '남')
  const text = [r.matchReason, ...Object.values(r.faceAnalysis)].join(' ')
  for (const p of [...PHRASES.faceAspect, ...PHRASES.noseWidth]) expect(text, p).not.toContain(p)
})

test('인상 풀이에도 외모 지적 표현이 없다', () => {
  for (const v of [-1.5, -0.8, 0, 0.8, 1.5]) {
    const z = Object.fromEntries(FEATURE_KEYS.map((k) => [k, v])) as ZVector
    for (const g of ['남', '여'] as const) {
      const r = matchCharacter(z, g)
      for (const t of Object.values(r.faceAnalysis)) for (const w of HURTFUL) expect(t, t).not.toContain(w)
    }
  }
})

test('삼국지 결과 화면에 영어 라벨이 없다', () => {
  const src = readFileSync('src/app/samguk/(match)/page.tsx', 'utf8')
  for (const w of ['Visual Features', 'Neural Impression', 'Eye/Nose/Mouth', 'Overall Impression', 'Lifestyle Index']) expect(src).not.toContain(w)
})

import { characterVibes } from '@/lib/samguk/vibes'
import { samgukCharacters } from '@/lib/samgukDB'

const NEGATIVE_LOOKS = ['못생', '기름진', '평범', '탐욕', '험상', '비대', '반골', '한쪽 눈', '잔인', '비만', '흉터', '우락부락', '수척', '창백']

test('모든 장수에 좋은 기질 한 줄이 있고 부정적 표현이 없다', () => {
  for (const c of samgukCharacters) {
    const v = characterVibes[c.id]
    expect(v, c.id).toBeTruthy()
    for (const w of NEGATIVE_LOOKS) expect(v, `${c.id}: ${v}`).not.toContain(w)
  }
})

test('닮은 이유에 인물 외모 묘사(부정적 표현 포함)를 그대로 쓰지 않고 기질 문장을 쓴다', () => {
  for (const c of samgukCharacters) {
    const z = { ...zeros(), ...characterProfiles[c.id].z } as ZVector
    for (const k of FEATURE_KEYS) z[k] = Math.max(-1.5, Math.min(1.5, z[k]))
    const r = matchCharacter(z, c.gender)
    expect(r.matchReason).toContain(characterVibes[r.character.id])
    for (const w of NEGATIVE_LOOKS) expect(r.matchReason, `${r.character.id}: ${r.matchReason}`).not.toContain(w)
  }
})

const HURTFUL_TRAITS = ['못생김', '탐욕', '비만', '잔인', '폭군', '독한 여자', '외눈', '배신', '반골', '오만', '몰락', '우유부단', '술꾼', '요절', '독사', '늑대', '미친 호랑이', '질투', '해적', '고집', '오랑캐', '우물', '사치', '참칭']

test('결과 화면에 태그로 보이는 인물 특성에 비하·부정 표현이 없다', () => {
  for (const c of samgukCharacters) for (const t of c.traits) for (const w of HURTFUL_TRAITS) expect(t, `${c.id}: ${t}`).not.toContain(w)
})
