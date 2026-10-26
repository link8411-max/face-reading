# Stage 2b: gender-specific face baselines + moving 동물상 to MediaPipe — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:**
- Split the face baselines (mean/std) by gender, so that each user's z-scores are computed against their own gender's baseline.
- Run the bias-correction simulation and the regression tests per gender as well.
- Move 동물상 from face-api to MediaPipe, using the same per-gender baselines.

**Architecture:**
- `toZ(f, gender)` uses `FEATURE_STATS_BY_GENDER[gender]`.
- The simulation follows the real pipeline: it draws raw feature vectors from the gender's distribution, then runs them through `toZ(f, gender)`.
- 동물상 matching works like 삼국지:
  - It matches on a z-vector with per-animal z-profiles and weighted distance, plus a simulation-corrected bias.
  - The feature description sentences are generated from the same z-vector, so they can't contradict each other.

**Spec:** `docs/superpowers/specs/2026-10-26-unse-ai-revival-design.md` (section "2b단계: 성별별 얼굴 기준값 + 동물상 MediaPipe 이전")

## Global Constraints
- **Measurement data:**
  - Source: the dev AI faces `public/dev-faces/person1~30.jpg` (not real people).
  - Gender labels were judged visually, recorded in `scripts/dev-face-genders.json`:
    - Female 12: 1,2,5,9,12,14,19,20,23,26,27,28
    - Male 13: 3,4,6,7,8,11,13,15,16,17,18,24,29
  - Excluded: children (10,22,30), ambiguous (21), sunglasses (25).
- **Estimation rule:**
  - Gender mean = pooled mean + w·(gender sample mean − pooled mean), with w = t²/(1+t²) (shrinkage by the t-statistic for the gender difference).
  - std = pooled within-gender std, the same for both genders.
  - `STD_INFLATION` stays at 1.5.
  - Features with |t|<1 get a comment saying "estimate (sample difference is small)". Features where the direction matches the literature but the sample shows no difference (lip thickness, jaw width) also get a comment.
- **Distribution criteria (unchanged):**
  - Every character/animal appears at least once.
  - Each stays within 3× uniform for its gender.
  - Checked under both the calibration seed and a different seed.
- **동물상 copy:**
  - Use only positive or impression wording; no appearance-critical phrasing.
  - Feature sentences must not use opposite descriptions together (for example "큰" and "가는").
- **Out of scope:** 관상 (`/face2`) stays on face-api. Only its gender selection is kept, for a later move.

## Review Focus
1. **Contradictory descriptions:** the eye description must never contain words from both opposing sets ("큰"/"동그란" vs "가는"/"가늘고"). This is pinned by a full-enumeration unit test (Task 3).
2. **Mixed-up gender baseline:** a female average face must give z≈0 under the female baseline (Task 1).
3. **Concentration on one animal:** all 8 animals within 3× uniform in the simulation (Task 3).
4. **face-api residue:** the animal page must not import `faceDetection` (Task 3).
5. **Non-frontal / no-face photos:** the animal page uses the same guidance as 삼국지 (`checkFrontal`) (Task 3 E2E).

---

### Task 1: Per-gender baselines + measurement script
**Files:**
- Create: `scripts/dev-face-genders.json`, `scripts/measure-face-stats.mjs` (reads the dev-server face-lab and prints a TS snippet)
- Modify: `src/lib/face/featureStats.ts`
  - `export type Gender = '남' | '여'`
  - `FEATURE_STATS_BY_GENDER`
  - `toZ(f, gender)`
- Re-export `Gender` from `matcher.ts`
- Tests: `tests/face/featureStats*.test.ts`

- [ ] Tests:
  - Under its own gender baseline, each gender's average face has |z|<0.01 for every feature
  - Female-average face under the male baseline: chinLength z<0, midfaceRatio z>0 (direction matches the literature)
  - Every std>0, and both genders share the same std
  - Inflation test (3σ → about 2, ±3 limit) runs for both genders
- [ ] RED → implement → GREEN → commit

### Task 2: Per-gender simulation + 삼국지 recalibration
**Files:**
- Modify: `src/lib/samguk/simulate.ts`: `sampleFeatures(rng, gender)` draws from the gender distribution, then `toZ(f, gender)`
- Modify: `scripts/calibrate-samguk.ts`
- Update: `src/lib/samguk/calibration.json`
- Modify: `src/app/samguk/page.tsx`, `src/app/dev/face-lab/FaceLab.tsx`: `toZ(features, gender)`

- [ ] Test: the existing distribution tests pass after recalibration, under both the calibration seed and seed 777
- [ ] Commit

### Task 3: Move 동물상 to MediaPipe
**Files:**
- Create: `src/lib/animal/profiles.ts`: z-profiles and weights for the 8 animals, with rationale comments
- Create: `src/lib/animal/matcher.ts`:
  - `matchAnimal(z, bias)`: `{ type, data, matchScore 70~98, secondaryType, features: {눈, 얼굴형, 턱, 코} }`
  - `describe(z)`
- Create: `src/lib/animal/simulate.ts`
- Create: `scripts/calibrate-animal.ts`
- Create: `src/lib/animal/calibration.json`
- Modify: `src/app/animal/page.tsx`
  - MediaPipe `detectLandmarks` → `checkFrontal` → `extractFeatures` → `toZ(f, gender)` → `matchAnimal`
  - Remove face-api model loading
- Delete: `src/lib/animalTypeAnalyzer.ts` (its `AnimalTypeResult` type moves to the matcher)
- Tests:
  - `tests/animal/matcher.test.ts`
  - `tests/animal/distribution.test.ts`
  - E2E: real-face flow and the no-face guidance (reuse the existing flow)

- [ ] Tests:
  - Every animal can be the result for at least one z-vector
  - Determinism
  - matchScore 70–98
  - Full enumeration over eyeAspect/eyeTilt in -2..2 at 0.5 steps (81 combinations): the eye description never mixes opposing words
  - No negative wording
  - Distribution: per gender, all 8 animals appear at least once and stay within 3× uniform (calibration seed and seed 777)
  - `src/app/animal/page.tsx` does not import `faceDetection`
- [ ] RED → implement → calibrate → GREEN → commit

### Task 4: Verification and docs
- [ ] `npm test && npm run test:e2e`
- [ ] Take 375px screenshots of the 동물상 results for a female and a male dev face
- [ ] Update CLAUDE.md:
  - Tech stack: 동물상 now on MediaPipe
  - How to regenerate the baselines
  - Animal calibration
- [ ] Final reviewer (opus), fix pass, merge to main, ask the user for push approval
