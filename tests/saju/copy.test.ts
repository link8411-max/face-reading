import {
  DAY_MASTER_COPY, TEN_GOD_COPY, ELEMENT_COPY, RELATION_COPY, daeunCopy, seunCopy, tenGodBasis, tenGodOfStem,
  cautionFor, BASIS_COPY, SOURCE_LINE, DISCLAIMER,
} from '@/content/saju';
import { STEMS, BRANCHES, TEN_GODS, ELEMENTS, type Element, type RelationKind } from '@/lib/saju/keys';
import { stemTenGod } from '@/lib/saju/relations';

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

/** 본문(text)과 꼬리 줄(basis) 쌍을 전부 모은다 */
function allReadings(): { text: string; basis: string }[] {
  const out: { text: string; basis: string }[] = [];
  for (const c of Object.values(DAY_MASTER_COPY)) out.push({ text: `${c.title} ${c.text}`, basis: c.basis });
  for (const g of TEN_GODS) {
    const c = TEN_GOD_COPY[g];
    out.push({ text: `${c.label} ${c.text} ${c.period} ${c.year}`, basis: tenGodBasis(g, 2) });
  }
  for (const e of ELEMENTS) out.push({ text: ELEMENT_COPY[e].easy, basis: ELEMENT_COPY[e].hanja });
  for (const day of STEMS) {
    for (const target of STEMS) {
      const tenGod = tenGodOfStem(day, target);
      out.push(daeunCopy({ countingAge: 37, korean: `${target}유`, tenGod }));
      for (const kind of RELATIONS) out.push(seunCopy({ korean: `${target}미`, tenGod, relation: kind, dayBranch: '진' }));
    }
  }
  for (const e of ELEMENTS) {
    const many = zero(); many[e] = 5;
    const none = { 목: 2, 화: 2, 토: 2, 금: 2, 수: 2 }; none[e] = 0;
    for (const c of [cautionFor(many, 8), cautionFor(none, 8)]) out.push({ text: c.text, basis: c.basis });
  }
  const bal = cautionFor({ 목: 2, 화: 1, 토: 2, 금: 1, 수: 2 }, 8);
  out.push({ text: bal.text, basis: bal.basis });
  for (const r of Object.values(RELATION_COPY)) out.push({ text: r, basis: '관계' });
  return out;
}
/** 일반 문구(계산 기준·고지)도 금지어 검사 대상 */
function plainStrings(): string[] {
  return [
    ...Object.values(BASIS_COPY).filter((v): v is string => typeof v === 'string'),
    BASIS_COPY.boundaryJeolip('10:46', '병오년·신축월'), SOURCE_LINE, DISCLAIMER,
  ];
}

// 쉬운 말 규칙: 본문에 쓰면 안 되는 전통 용어
const TRAD_WORDS = ['대운', '세운', '일간', '일지', '간지', '십신', '오행', '천간', '지지'];
const HANJA_ELEMENTS = ['木', '火', '土', '金', '水'];
const ELEMENT_KO = ['목', '화', '토', '금', '수'];
const STEM_ELEMENT_PAIRS = STEMS.flatMap((s) => ELEMENT_KO.map((e) => s + e)); // 경금·갑목…
const GANJI = STEMS.flatMap((s) => BRANCHES.map((b) => s + b)); // 을유·경오…

describe('쉬운 말 규칙: 본문(text)에는 전통 용어가 없고 꼬리 줄(basis)은 항상 있다', () => {
  it('모든 본문에 십신·간지·오행 한자·전통 용어가 없다', () => {
    const rs = allReadings();
    expect(rs.length).toBeGreaterThan(900);
    for (const { text, basis } of rs) {
      expect(basis.trim().length, `basis 비어 있음: ${text}`).toBeGreaterThan(0);
      for (const w of [...TEN_GODS, ...TRAD_WORDS, ...HANJA_ELEMENTS, ...STEM_ELEMENT_PAIRS, ...GANJI]) {
        expect(text, `본문에 전통 용어 ${w}: ${text}`).not.toContain(w);
      }
      expect(text, `괄호 한자 표기: ${text}`).not.toMatch(/\([목화토금수]\)/);
    }
  });

  it('꼬리 줄에는 전통 용어가 실제로 담긴다', () => {
    expect(DAY_MASTER_COPY.경.basis).toBe('경금 일간 · 칼날(금)');
    expect(tenGodBasis('정재', 2)).toBe('정재 2개');
    const d = daeunCopy({ countingAge: 37, korean: '을유', tenGod: '정재' });
    expect(d.basis).toBe('을유 대운 · 정재');
    expect(d.text).toBe("37세부터 46세까지는 '돈을 꾸준히 모으는 시기'예요. 큰 흐름의 참고일 뿐이고, 어떻게 보낼지는 내 몫이에요.");
    const s = seunCopy({ korean: '정미', tenGod: '정관', relation: '없음', dayBranch: '진' });
    expect(s.basis).toBe('정미년 · 정관 · 일지 진과 특별한 관계 없음');
    expect(seunCopy({ korean: '정미', tenGod: '정관', relation: '충', dayBranch: '축' }).basis).toBe('정미년 · 정관 · 일지 축과 충');
    expect(seunCopy({ korean: '정미', tenGod: '정관', relation: '충', dayBranch: '축' }).text).toContain('부딪히는 기운');
  });

  it('조심할 점 꼬리 줄은 "새싹(목) 0개" 형식이다', () => {
    expect(cautionFor({ 목: 0, 화: 2, 토: 2, 금: 2, 수: 2 }, 8).basis).toBe('새싹(목) 0개');
    expect(cautionFor({ 목: 1, 화: 4, 토: 1, 금: 1, 수: 1 }, 8).basis).toBe('불꽃(화) 4개');
  });

  it('십신 판정이 엔진(만세력)과 100가지 전부 같다', () => {
    for (const d of STEMS) for (const t of STEMS) expect(tenGodOfStem(d, t), `${d}→${t}`).toBe(stemTenGod(d, t));
  });

  it('일간·십신 본문은 두 문장이다', () => {
    for (const s of STEMS) expect(sentences(DAY_MASTER_COPY[s].text), s).toBe(2);
    for (const g of TEN_GODS) expect(sentences(TEN_GOD_COPY[g].text), g).toBe(2);
  });
});

describe('사주 문구', () => {
  it('일간 10종·십신 10종·오행 5종·관계 8종이 전부 있다', () => {
    expect(Object.keys(DAY_MASTER_COPY).sort()).toEqual([...STEMS].sort());
    expect(Object.keys(TEN_GOD_COPY).sort()).toEqual([...TEN_GODS].sort());
    expect(Object.keys(ELEMENT_COPY).sort()).toEqual([...ELEMENTS].sort());
    expect(Object.keys(RELATION_COPY).sort()).toEqual([...RELATIONS].sort());
    for (const s of STEMS) {
      const t = DAY_MASTER_COPY[s].title;
      expect(/^나는 .+ 같은 사람이에요$/.test(t), t).toBe(true);
      expect(DAY_MASTER_COPY[s].text.length).toBeGreaterThan(20);
    }
    expect(DAY_MASTER_COPY.경.title).toBe('나는 바위 같은 사람이에요');
    expect(DAY_MASTER_COPY.경.text.startsWith('한번 정하면 깔끔하게 끊고 가는 편이에요.')).toBe(true);
    expect(new Set(STEMS.map((s) => DAY_MASTER_COPY[s].title)).size).toBe(10);
    for (const g of TEN_GODS) {
      const c = TEN_GOD_COPY[g];
      for (const v of [c.label, c.text, c.period, c.year]) expect(v.length).toBeGreaterThan(2);
    }
    expect(TEN_GOD_COPY['정재'].label).toBe('꼼꼼한 살림');
    expect(TEN_GOD_COPY['정관'].label).toBe('책임감');
  });

  it('금지어·평가어·예언어·이모지가 없다 (본문·꼬리 줄·고지 전부)', () => {
    const all = [...allReadings().flatMap((r) => [r.text, r.basis]), ...plainStrings()];
    for (const raw of all) {
      expect(raw.length).toBeGreaterThan(0);
      for (const w of [...BANNED, ...SAJU_BANNED]) expect(raw, `금지어 ${w}: ${raw}`).not.toContain(w);
      for (const w of EVAL) expect(raw, `평가어 ${w}: ${raw}`).not.toContain(w);
      for (const w of FORECAST) expect(raw, `예언어 ${w}: ${raw}`).not.toContain(w);
      expect(EMOJI.test(raw), `이모지: ${raw}`).toBe(false);
    }
  });

  it('십신 본문은 부정형 단정이 없다', () => {
    for (const g of TEN_GODS) {
      expect(TEN_GOD_COPY[g].text).not.toMatch(NEGATIVE);
      expect(TEN_GOD_COPY[g].year).not.toMatch(NEGATIVE);
    }
  });

  it('조심할 점: 모든 오행 과다·부재 문구가 상황형 + 행동 한 문장이다', () => {
    for (const e of ELEMENTS) {
      const many = zero(); many[e] = 5; many.목 = e === '목' ? 5 : 1;
      const c = cautionFor(many, 8);
      expect(c.situation, e).toMatch(/기 쉬운|기 쉬워요/);
      expect(sentences(c.action), c.action).toBe(1);
      expect(c.action.trim().endsWith('.')).toBe(true);
      const none = { 목: 2, 화: 2, 토: 2, 금: 2, 수: 2 }; none[e] = 0;
      const n = cautionFor(none, 8);
      expect(n.situation, e).toMatch(/기 쉬운|기 쉬워요/);
      expect(sentences(n.action), n.action).toBe(1);
      expect(n.basis).toBe(`${ELEMENT_COPY[e].easy}(${e}) 0개`);
    }
  });

  it('조심할 점: 균형이면 균형형, 토 0이면 토 부재 문구, 같은 입력은 같은 출력', () => {
    const bal = cautionFor({ 목: 2, 화: 1, 토: 2, 금: 1, 수: 2 }, 8);
    expect(bal.basis).toContain('고르게');
    expect(sentences(bal.action)).toBe(1);
    const t = cautionFor({ 목: 2, 화: 2, 토: 0, 금: 2, 수: 2 }, 8);
    expect(t.situation).toContain('중심을 잡아 주는');
    expect(t.basis).toBe('대지(토) 0개');
    expect(cautionFor({ 목: 2, 화: 2, 토: 0, 금: 2, 수: 2 }, 8)).toEqual(t);
    // 6글자(시간 모름)에서는 3개가 기준
    expect(cautionFor({ 목: 1, 화: 3, 토: 1, 금: 0, 수: 1 }, 6).basis).toBe('불꽃(화) 3개');
  });

  it('대운·세운 본문은 단정하지 않는 표현을 넣고 나이 범위를 쓴다', () => {
    const d = daeunCopy({ countingAge: 23, korean: '정미', tenGod: '정재' });
    expect(d.text).toContain("23세부터 32세까지는 '돈을 꾸준히 모으는 시기'예요");
    expect(/참고|몫/.test(d.text)).toBe(true);
    for (const kind of RELATIONS) {
      const s = seunCopy({ korean: '정미', tenGod: '식신', relation: kind, dayBranch: '오' });
      expect(s.text).toContain(TEN_GOD_COPY['식신'].year);
      expect(s.text).toContain(RELATION_COPY[kind]);
      expect(sentences(s.text), s.text).toBe(2);
    }
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

  it('오행 쉬운 이름은 괄호 없이 새싹·불꽃·대지·칼날·물결이다', () => {
    expect(ELEMENTS.map((e) => ELEMENT_COPY[e].easy)).toEqual(['새싹', '불꽃', '대지', '칼날', '물결']);
    expect(ELEMENTS.map((e) => ELEMENT_COPY[e].hanja)).toEqual(['木', '火', '土', '金', '水']);
    expect(RELATION_COPY['충']).toContain('부딪히는 기운');
    expect(RELATION_COPY['없음']).toContain('담담');
  });
});

describe('왜 믿을 수 있나요', () => {
  it('근거 문구가 있고 금지어가 없다', async () => {
    const { TRUST_COPY } = await import('@/content/saju')
    expect(TRUST_COPY.lines.length).toBe(4)
    const all = TRUST_COPY.lines.join(' ')
    expect(all).toContain('한국천문연구원')
    expect(all).toContain('달력 계산')
    for (const w of ['백호', '흉운', '액운', '재앙', '수명']) expect(all).not.toContain(w)
  })
})
