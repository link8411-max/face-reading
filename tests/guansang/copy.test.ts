import { describe, it, expect } from 'vitest';
import {
  GUANSANG_TYPES, SHAPE_COPY, ZONE_COPY, PALACE_COPY, LABEL_COPY, BALANCED_CHIP, FOREHEAD_NOTE,
  DISCLAIMER, SCHOOL_NOTE, evidenceText, LEGACY_FACE_KEYS,
} from '@/content/guansang';
import { GUANSANG_TYPE_KEYS, SHAPE_KEYS, ZONE_KEYS, PALACE_KEYS, isGuansangTypeKey, type ShapeKey, type ZoneKey, type PalaceLabel } from '@/lib/face/guansangKeys';

const BANNED = '못생·추하·추해·비호감·팔자·박복·고집불통·사납·드세·음흉·천박·허약·단명·요절·인색·쪼잔·바람기·색기·이혼·과부·불임·흉상·악상·살기·거만·오만·노안·늙어'.split('·');
const EVAL = '작다·짧다·좁다·낮다·부족·모자라·평범·밋밋·평균보다'.split('·');
const FORBID_FORECAST = ['수명', '건강이', '자녀', '결혼', '병이'];
const EMOJI = /[\p{Extended_Pictographic}‍️]/u;
const LABELS: PalaceLabel[] = ['strong', 'even', 'grow'];

function allStrings(): string[] {
  const out: string[] = [];
  for (const t of Object.values(GUANSANG_TYPES)) out.push(t.nickname, t.oneLiner, t.caution.situation, t.caution.action, t.partnerLine);
  for (const c of [...Object.values(SHAPE_COPY), ...Object.values(ZONE_COPY)]) out.push(c.easy, c.traditional, c.evidence);
  for (const p of Object.values(PALACE_COPY)) out.push(p.easy, p.part, p.traditional, p.grow, ...Object.values(p.lines));
  out.push(...Object.values(LABEL_COPY), BALANCED_CHIP, FOREHEAD_NOTE, DISCLAIMER, SCHOOL_NOTE);
  return out;
}

const GENERATOR: Record<ShapeKey, ShapeKey> = { wood: 'water', fire: 'wood', earth: 'fire', metal: 'earth', water: 'metal' };
const ZONE_PAIR: Record<ZoneKey, ZoneKey> = { up: 'down', down: 'up', mid: 'up' };

describe('관상 문구', () => {
  it('15유형이 전부 있고 별명이 상으로 끝나며 중복이 없다', () => {
    expect(Object.keys(GUANSANG_TYPES).sort()).toEqual([...GUANSANG_TYPE_KEYS].sort());
    const names = GUANSANG_TYPE_KEYS.map((k) => GUANSANG_TYPES[k].nickname);
    for (const n of names) expect(n.endsWith('상')).toBe(true);
    expect(new Set(names).size).toBe(15);
    for (const k of GUANSANG_TYPE_KEYS) {
      expect(GUANSANG_TYPES[k].key).toBe(k);
      expect(k.length).toBeLessThanOrEqual(24);
    }
  });

  it('금지어·평가어·예언어·이모지가 없다', () => {
    for (const raw of allStrings()) {
      expect(raw.length).toBeGreaterThan(0);
      for (const w of BANNED) expect(raw, `금지어 ${w}: ${raw}`).not.toContain(w);
      for (const w of EVAL) expect(raw, `평가어 ${w}: ${raw}`).not.toContain(w);
      for (const w of FORBID_FORECAST) expect(raw, `예언어 ${w}: ${raw}`).not.toContain(w);
      expect(EMOJI.test(raw), `이모지: ${raw}`).toBe(false);
    }
  });

  it('조심할 점은 상황형이고 행동은 한 문장이다', () => {
    for (const k of GUANSANG_TYPE_KEYS) {
      const c = GUANSANG_TYPES[k].caution;
      expect(/하기 쉬운|하기 쉬워요/.test(c.situation), c.situation).toBe(true);
      expect(c.action.trim().match(/[.!?]/g)?.length ?? 0, c.action).toBe(1);
      expect(c.action.trim().endsWith('.')).toBe(true);
    }
  });

  it('자리 문구가 5자리 x 3라벨 모두 있고 가꾸는 방법이 있다', () => {
    expect(Object.keys(PALACE_COPY).sort()).toEqual([...PALACE_KEYS].sort());
    for (const k of PALACE_KEYS) {
      for (const l of LABELS) expect(PALACE_COPY[k].lines[l].length).toBeGreaterThan(5);
      expect(PALACE_COPY[k].grow.length).toBeGreaterThan(5);
      expect(PALACE_COPY[k].grow.trim().match(/[.!?]/g)?.length ?? 0).toBe(1);
      expect(PALACE_COPY[k].lines.grow.length).toBeGreaterThan(PALACE_COPY[k].lines.even.length - 40);
    }
  });

  it('잘 맞는 상은 상생 규칙과 같다', () => {
    for (const s of SHAPE_KEYS) for (const z of ZONE_KEYS) {
      const k = `${s}-${z}` as const;
      expect(GUANSANG_TYPES[k].partner).toBe(`${GENERATOR[s]}-${ZONE_PAIR[z]}`);
      expect(isGuansangTypeKey(GUANSANG_TYPES[k].partner)).toBe(true);
      expect(GUANSANG_TYPES[k].partnerLine.length).toBeGreaterThan(10);
    }
  });

  it('근거 문장 조합 안에 모순 단어 쌍이 같이 나오지 않는다', () => {
    const pairs: [string, string][] = [['넉넉', '간결'], ['또렷', '부드러'], ['곧은', '둥글'], ['갸름', '넉넉'], ['각진', '둥글']];
    for (const s of SHAPE_KEYS) for (const z of ZONE_KEYS) {
      const t = evidenceText(s, z);
      expect(t).toBe(`${SHAPE_COPY[s].evidence} ${ZONE_COPY[z].evidence}`);
      for (const [a, b] of pairs) expect(t.includes(a) && t.includes(b), `${s}-${z}: ${a}/${b}`).toBe(false);
    }
  });

  it('한 줄 뜻은 20~60자이고 쉬운 이름·라벨이 규칙대로다', () => {
    for (const k of GUANSANG_TYPE_KEYS) {
      const n = [...GUANSANG_TYPES[k].oneLiner].length;
      expect(n, GUANSANG_TYPES[k].oneLiner).toBeGreaterThanOrEqual(20);
      expect(n, GUANSANG_TYPES[k].oneLiner).toBeLessThanOrEqual(60);
    }
    expect(LABEL_COPY).toEqual({ strong: '두드러진 자리', even: '고른 자리', grow: '가꿀수록 자라는 자리' });
    expect(BALANCED_CHIP).toBe('고르게 짜인 얼굴');
    expect(SHAPE_COPY.earth.easy).toBe('둥글고 넉넉한 얼굴');
  });

  it('옛 공유 키가 유효한 새 키로 이어진다', () => {
    expect(Object.keys(LEGACY_FACE_KEYS).sort()).toEqual(['artist', 'blessing', 'leader', 'noble', 'scholar', 'wealth']);
    for (const v of Object.values(LEGACY_FACE_KEYS)) expect(isGuansangTypeKey(v)).toBe(true);
  });
});
