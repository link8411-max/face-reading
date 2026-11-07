import { describe, it, expect } from 'vitest';
import {
  DAY_MASTER_COPY, TEN_GOD_COPY, ELEMENT_COPY, RELATION_COPY, DAEUN_TEMPLATE, SEUN_TEMPLATE,
  cautionFor, BASIS_COPY, SOURCE_LINE, DISCLAIMER, evidenceTail,
} from '@/content/saju';
import { STEMS, TEN_GODS, ELEMENTS, type Element, type RelationKind } from '@/lib/saju/keys';

const BANNED = '못생·추하·추해·비호감·팔자·박복·고집불통·사납·드세·음흉·천박·허약·단명·요절·인색·쪼잔·바람기·색기·이혼·과부·불임·흉상·악상·살기·거만·오만·노안·늙어'.split('·');
const SAJU_BANNED = '백호·괴강·고란·원진·귀문·공망·양인·천라지망·관살혼잡·상관견관·재다신약·칠살·흉운·액운·재앙·신약·신강·용신'.split('·');
const EVAL = '부족·모자라·평범·밋밋·평균보다'.split('·');
const FORECAST = '수명·사망·죽·질병·암·이혼·불임·결혼운'.split('·');
const NEGATIVE = /안 돼요|못해요|나빠요/;
const EMOJI = /[\p{Extended_Pictographic}‍️]/u;
const RELATIONS: RelationKind[] = ['합', '충', '형', '파', '해', '반합', '같음', '없음'];

function zero(): Record<Element, number> {
  return { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
}
function sentences(s: string): number {
  return s.trim().match(/[.!?]/g)?.length ?? 0;
}

function allStrings(): string[] {
  const out: string[] = [];
  for (const c of Object.values(DAY_MASTER_COPY)) out.push(c.title, c.line);
  for (const c of Object.values(TEN_GOD_COPY)) out.push(c.easy, c.meaning, c.many, c.none);
  for (const c of Object.values(ELEMENT_COPY)) out.push(c.easy, c.strong, c.weak);
  out.push(...Object.values(RELATION_COPY));
  out.push(DAEUN_TEMPLATE({ countingAge: 23, korean: '정미', tenGodEasy: '꼼꼼한 살림' }));
  out.push(SEUN_TEMPLATE({ dayMasterTitle: '나는 큰 나무예요', tenGodEasy: '즐기는 재주', relationLine: RELATION_COPY['합'] }));
  for (const e of ELEMENTS) {
    const many = zero(); many[e] = 5;
    const none = { 목: 2, 화: 2, 토: 2, 금: 2, 수: 2 }; none[e] = 0;
    for (const c of [cautionFor(many, 8), cautionFor(none, 8)]) out.push(c.situation, c.action, c.basis);
  }
  const bal = cautionFor({ 목: 2, 화: 1, 토: 2, 금: 1, 수: 2 }, 8);
  out.push(bal.situation, bal.action, bal.basis);
  out.push(...Object.values(BASIS_COPY).filter((v): v is string => typeof v === 'string'));
  out.push(BASIS_COPY.boundaryJeolip('10:46', '병오년·신축월'));
  out.push(SOURCE_LINE, DISCLAIMER, evidenceTail('정재', 2));
  return out;
}

describe('사주 문구', () => {
  it('일간 10종·십신 10종·오행 5종·관계 8종이 전부 있다', () => {
    expect(Object.keys(DAY_MASTER_COPY).sort()).toEqual([...STEMS].sort());
    expect(Object.keys(TEN_GOD_COPY).sort()).toEqual([...TEN_GODS].sort());
    expect(Object.keys(ELEMENT_COPY).sort()).toEqual([...ELEMENTS].sort());
    expect(Object.keys(RELATION_COPY).sort()).toEqual([...RELATIONS].sort());
    for (const s of STEMS) {
      expect(DAY_MASTER_COPY[s].title.endsWith('예요') || DAY_MASTER_COPY[s].title.endsWith('이에요')).toBe(true);
      expect(DAY_MASTER_COPY[s].line.length).toBeGreaterThan(10);
    }
    const titles = STEMS.map((s) => DAY_MASTER_COPY[s].title);
    expect(new Set(titles).size).toBe(10);
    for (const g of TEN_GODS) {
      const c = TEN_GOD_COPY[g];
      for (const v of [c.easy, c.meaning, c.many, c.none]) expect(v.length).toBeGreaterThan(2);
    }
  });

  it('금지어·평가어·예언어·이모지가 없다', () => {
    for (const raw of allStrings()) {
      expect(raw.length).toBeGreaterThan(0);
      for (const w of [...BANNED, ...SAJU_BANNED]) expect(raw, `금지어 ${w}: ${raw}`).not.toContain(w);
      for (const w of EVAL) expect(raw, `평가어 ${w}: ${raw}`).not.toContain(w);
      for (const w of FORECAST) expect(raw, `예언어 ${w}: ${raw}`).not.toContain(w);
      expect(EMOJI.test(raw), `이모지: ${raw}`).toBe(false);
    }
  });

  it('십신 많을 때·없을 때 문구는 긍정형이다', () => {
    for (const g of TEN_GODS) {
      expect(TEN_GOD_COPY[g].many).not.toMatch(NEGATIVE);
      expect(TEN_GOD_COPY[g].none).not.toMatch(NEGATIVE);
    }
    expect(TEN_GOD_COPY['정재'].easy).toBe('꼼꼼한 살림');
    expect(TEN_GOD_COPY['비견'].easy).toBe('나란히');
  });

  it('조심할 점: 화 4/8이면 불꽃 과다 상황형이고 행동은 한 문장이다', () => {
    const c = cautionFor({ 목: 1, 화: 4, 토: 1, 금: 1, 수: 1 }, 8);
    expect(c.basis).toBe('불꽃(화)이 넷이라');
    expect(c.situation).toContain('하기 쉬운');
    expect(sentences(c.action)).toBe(1);
    expect(c.action.trim().endsWith('.')).toBe(true);
  });

  it('조심할 점: 모든 오행 과다·부재 문구가 상황형 + 행동 한 문장이다', () => {
    for (const e of ELEMENTS) {
      const many = zero(); many[e] = 5; many.목 = e === '목' ? 5 : 1;
      const c = cautionFor(many, 8);
      expect(c.situation, e).toMatch(/기 쉬운|기 쉬워요/);
      expect(sentences(c.action), c.action).toBe(1);
      const none = { 목: 2, 화: 2, 토: 2, 금: 2, 수: 2 }; none[e] = 0;
      const n = cautionFor(none, 8);
      expect(n.situation, e).toMatch(/기 쉬운|기 쉬워요/);
      expect(sentences(n.action), n.action).toBe(1);
      expect(n.basis).toContain(ELEMENT_COPY[e].easy);
    }
  });

  it('조심할 점: 균형이면 균형형, 토 0이면 토 부재 문구', () => {
    const bal = cautionFor({ 목: 2, 화: 1, 토: 2, 금: 1, 수: 2 }, 8);
    expect(bal.basis).toContain('고르게');
    expect(sentences(bal.action)).toBe(1);
    const t = cautionFor({ 목: 2, 화: 2, 토: 0, 금: 2, 수: 2 }, 8);
    expect(t.situation).toContain('대지(토)');
    expect(t.situation).toContain('중심을 잡아 주는');
    expect(t.basis).toContain('대지(토)');
    // 같은 입력이면 같은 출력
    expect(cautionFor({ 목: 2, 화: 2, 토: 0, 금: 2, 수: 2 }, 8)).toEqual(t);
    // 6글자(시간 모름)에서는 3개가 기준
    expect(cautionFor({ 목: 1, 화: 3, 토: 1, 금: 0, 수: 1 }, 6).basis).toBe('불꽃(화)이 셋이라');
  });

  it('근거 꼬리가 글자 수와 받침에 맞게 나온다', () => {
    expect(evidenceTail('정재', 2)).toBe('정재가 둘이라');
    expect(evidenceTail('비견', 1)).toBe('비견이 하나라');
    expect(evidenceTail('식신', 3)).toBe('식신이 셋이라');
    expect(evidenceTail('편재', 4)).toBe('편재가 넷이라');
  });

  it('대운·세운 문장은 단정하지 않는 표현을 넣는다', () => {
    const d = DAEUN_TEMPLATE({ countingAge: 23, korean: '정미', tenGodEasy: '꼼꼼한 살림' });
    expect(d).toContain('23');
    expect(d).toContain('정미');
    expect(d).toContain('꼼꼼한 살림');
    expect(/참고|몫/.test(d)).toBe(true);
    const s = SEUN_TEMPLATE({ dayMasterTitle: '나는 큰 나무예요', tenGodEasy: '즐기는 재주', relationLine: RELATION_COPY['합'] });
    expect(s).toContain('나는 큰 나무예요');
    expect(s).toContain('즐기는 재주');
    expect(s).toContain(RELATION_COPY['합']);
    expect(/참고|몫/.test(s)).toBe(true);
  });

  it('계산 기준 4줄과 시간 모름·경계 안내가 있다', () => {
    expect(BASIS_COPY.jeolgi).toContain('절기');
    expect(BASIS_COPY.dayBoundary).toContain('밤 11시');
    expect(BASIS_COPY.dst).toContain('서머타임');
    expect(BASIS_COPY.trueSolar).toContain('진태양시');
    expect(BASIS_COPY.hourUnknown).toBe('태어난 시간을 몰라 세 기둥으로 봤어요. 시간을 알면 시주까지 볼 수 있어요');
    const j = BASIS_COPY.boundaryJeolip('10:46', '병오년·신축월');
    expect(j).toContain('10:46');
    expect(j).toContain('병오년·신축월');
    expect(BASIS_COPY.boundaryMidnight).toContain('밤 11~12시');
    expect(SOURCE_LINE).toContain('한국천문연구원');
    expect(DISCLAIMER).toContain('재미');
  });

  it('쉬운 이름·관계 문구가 설계대로다', () => {
    expect(ELEMENT_COPY.목.easy).toBe('새싹(목)');
    expect(ELEMENT_COPY.화.easy).toBe('불꽃(화)');
    expect(ELEMENT_COPY.토.easy).toBe('대지(토)');
    expect(ELEMENT_COPY.금.easy).toBe('칼날(금)');
    expect(ELEMENT_COPY.수.easy).toBe('물결(수)');
    expect(RELATION_COPY['합']).toContain('어우러져요');
    expect(RELATION_COPY['충']).toContain('변화');
    expect(RELATION_COPY['같음']).toBe('같은 글자라 익숙한 흐름이에요');
    expect(RELATION_COPY['없음']).toBe('특별한 합·충 없이 담담한 해예요');
  });
});
