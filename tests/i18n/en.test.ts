import { describe, it, expect } from 'vitest';
import * as koGuansang from '@/content/guansang';
import * as enGuansang from '@/content/en/guansang';
import * as koAnimal from '@/lib/animalTypeDB';
import * as enAnimal from '@/content/en/animal';
import * as koFaceMatch from '@/lib/faceMatch/compat';
import * as enFaceMatch from '@/content/en/faceMatch';
import { CAST } from '@/content/cast';
import * as enCast from '@/content/en/cast';
import { HOME_FAQS as koFaq } from '@/content/homeFaq';
import { HOME_FAQS as enFaq } from '@/content/en/homeFaq';
import { pageGuides as koGuides } from '@/content/pageGuides';
import * as enGuides from '@/content/en/pageGuides';
import * as enUi from '@/content/en/ui';
import { localePath, LOCALES, LOCALE_LABEL, LOCALE_HTML_LANG, DEFAULT_LOCALE } from '@/lib/i18n/locales';

const HANGUL = /[가-힣]/;
const EMOJI = /[\p{Extended_Pictographic}]/u;

// 같은 모양인지: 객체는 키 집합, 배열은 길이와 각 칸, 문자열은 문자열
function sameShape(ko: unknown, en: unknown, path: string): void {
  if (Array.isArray(ko)) {
    expect(Array.isArray(en), `${path} should be array`).toBe(true);
    expect((en as unknown[]).length, `${path} length`).toBe(ko.length);
    ko.forEach((v, i) => sameShape(v, (en as unknown[])[i], `${path}[${i}]`));
    return;
  }
  if (ko && typeof ko === 'object') {
    expect(en && typeof en === 'object' && !Array.isArray(en), `${path} should be object`).toBe(true);
    expect(Object.keys(en as object).sort(), `${path} keys`).toEqual(Object.keys(ko).sort());
    for (const k of Object.keys(ko)) sameShape((ko as Record<string, unknown>)[k], (en as Record<string, unknown>)[k], `${path}.${k}`);
    return;
  }
  expect(typeof en, `${path} type`).toBe(typeof ko);
}

function strings(v: unknown, out: { path: string; s: string }[] = [], path = ''): { path: string; s: string }[] {
  if (typeof v === 'string') out.push({ path, s: v });
  else if (Array.isArray(v)) v.forEach((x, i) => strings(x, out, `${path}[${i}]`));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) strings(x, out, `${path}.${k}`);
  return out;
}

function sampleFns(): string[] {
  const out: string[] = [];
  const f = enFaceMatch;
  out.push(f.HEADLINE.crush(88), f.HEADLINE.other('friend', 90), f.HEADLINE.other('lover', 70));
  out.push(f.FIRST_LINE.same('Puppy Face', 'Friendly'), f.FIRST_LINE.different('Puppy Face', 'Friendly', 'Cat Face', 'Mysterious'));
  out.push(enGuansang.evidenceText('wood', 'up'));
  return out;
}

// 각 en 모듈의 값(함수는 제외)
const COLLECTIONS: Record<string, Record<string, unknown>> = {
  guansang: enGuansang,
  animal: enAnimal,
  faceMatch: enFaceMatch,
  cast: enCast,
  homeFaq: { HOME_FAQS: enFaq },
  pageGuides: { pageGuides: enGuides.pageGuides, TEST_LINKS_EN: enGuides.TEST_LINKS_EN },
  ui: enUi,
};

describe('en 문구는 한국어와 같은 모양이다', () => {
  it('guansang: 내보내는 이름과 키 집합이 같다', () => {
    for (const name of Object.keys(koGuansang)) {
      expect(Object.keys(enGuansang), name).toContain(name);
      if (typeof (koGuansang as Record<string, unknown>)[name] === 'function') continue;
      sameShape((koGuansang as Record<string, unknown>)[name], (enGuansang as Record<string, unknown>)[name], name);
    }
  });

  it('animal: 8종과 키 집합이 같다', () => {
    expect(Object.keys(enAnimal)).toEqual(expect.arrayContaining(Object.keys(koAnimal)));
    sameShape(koAnimal.animalTypeDB, enAnimal.animalTypeDB, 'animalTypeDB');
    expect(enAnimal.animalTypeList).toEqual(koAnimal.animalTypeList);
  });

  it('animal: 잘 맞는/맞춰 가는 동물상이 모두 실제 이름이다', () => {
    const names = Object.values(enAnimal.animalTypeDB).map((a) => a.name);
    for (const a of Object.values(enAnimal.animalTypeDB)) for (const n of [...a.compatibility.best, ...a.compatibility.worst]) expect(names).toContain(n);
    expect(new Set(names).size).toBe(names.length);
  });

  it('animal: 잘 맞는 쌍이 한국어와 같은 동물이다', () => {
    const keyByName = (db: typeof enAnimal.animalTypeDB, n: string) => Object.keys(db).find((k) => db[k].name === n);
    for (const k of Object.keys(koAnimal.animalTypeDB)) {
      for (const side of ['best', 'worst'] as const) {
        const ko = koAnimal.animalTypeDB[k].compatibility[side].map((n) => keyByName(koAnimal.animalTypeDB, n));
        const en = enAnimal.animalTypeDB[k].compatibility[side].map((n) => keyByName(enAnimal.animalTypeDB, n));
        expect(en, `${k} ${side}`).toEqual(ko);
      }
    }
  });

  it('faceMatch: 관계 이름 키가 같고 문구 틀이 갖춰져 있다', () => {
    sameShape(koFaceMatch.REL_NAME, enFaceMatch.REL_NAME, 'REL_NAME');
    for (const rel of koFaceMatch.REL) {
      expect(enFaceMatch.LABELS[rel]).toHaveLength(5);
      expect(enFaceMatch.CLOSING[rel]).toHaveLength(3);
    }
  });

  it('cast: 여섯 캐릭터 키가 같고 이름이 소리대로다', () => {
    sameShape(Object.fromEntries(Object.keys(CAST).map((k) => [k, 1])), Object.fromEntries(Object.keys(enCast.CAST_COPY).map((k) => [k, 1])), 'CAST');
    for (const k of Object.keys(CAST) as (keyof typeof CAST)[]) {
      expect(enCast.CAST_COPY[k].name).toBe(CAST[k].en);
      expect(enCast.CAST_COPY[k].intro.length).toBeGreaterThan(30);
    }
  });

  it('homeFaq: 같은 모양', () => sameShape(koFaq, enFaq, 'HOME_FAQS'));

  it('pageGuides: /face2·/animal은 한국어와 같은 모양, 네 쪽 모두 같은 틀', () => {
    for (const r of ['/face2', '/animal'] as const) {
      const ko = koGuides[r];
      const en = enGuides.pageGuides[r];
      expect(Object.keys(en).sort(), r).toEqual(Object.keys(ko).sort());
      expect(en.intro).toHaveLength(ko.intro.length);
      expect(en.highlights).toHaveLength(ko.highlights.length);
      expect(en.faqs).toHaveLength(ko.faqs.length);
      expect(en.related).toEqual(ko.related);
      expect(en.sections!.map((s) => s.items.length)).toEqual(ko.sections!.map((s) => s.items.length));
    }
    for (const r of ['/', '/face2', '/animal', '/face-match'] as const) {
      const g = enGuides.pageGuides[r];
      expect(g.heading.length).toBeGreaterThan(5);
      expect(g.summary.length).toBeGreaterThan(30);
      expect(g.intro.length).toBeGreaterThan(0);
      expect(g.highlights.length).toBeGreaterThan(0);
      expect(g.faqs.length).toBeGreaterThan(0);
      for (const rel of g.related) expect(rel.startsWith('/')).toBe(true);
    }
  });

  it('guansang: 15유형 별명이 서로 다르다', () => {
    const names = Object.values(enGuansang.GUANSANG_TYPES).map((t) => t.nickname);
    expect(new Set(names).size).toBe(15);
  });
});

describe('en 문구에 한글이 없다', () => {
  it('모든 문자열 값', () => {
    for (const [mod, vals] of Object.entries(COLLECTIONS)) {
      for (const { path, s } of strings(vals)) expect(HANGUL.test(s), `${mod}${path}: ${s}`).toBe(false);
    }
    for (const s of sampleFns()) expect(HANGUL.test(s), s).toBe(false);
  });
});

function allCopy(): { path: string; s: string }[] {
  const out: { path: string; s: string }[] = [];
  for (const [mod, vals] of Object.entries(COLLECTIONS)) for (const x of strings(vals)) out.push({ path: `${mod}${x.path}`, s: x.s });
  for (const s of sampleFns()) out.push({ path: 'fn', s });
  return out;
}

describe('영어 문구도 같은 금지 규칙을 따른다', () => {
  const CERTAINTY = [/guarantee/i, /\b100\s?%/, /definitely will/i, /will definitely/i, /for certain/i, /without a doubt/i, /\bcertainly will\b/i, /\bnever fails\b/i, /\bis destined\b/i];
  // 외모 비하·불길한 단정
  const PUT_DOWN = [/\bugly\b/i, /\bhomely\b/i, /unattractive/i, /\bplain\b/i, /\bfat\b/i, /\bbad luck\b/i, /\bdoomed\b/i, /\bcursed\b/i, /unlucky/i, /\bfate is sealed\b/i, /\bsinister\b/i, /\bvulgar\b/i, /\bfrail\b/i, /\bstingy\b/i, /\bcheap\b/i, /\bpromiscuous\b/i, /\bwidow/i, /\binfertile\b/i, /\bshort-lived\b/i, /looks? old/i, /\baged\b/i];

  it('단정 표현이 없다', () => {
    for (const { path, s } of allCopy()) for (const re of CERTAINTY) expect(re.test(s), `${path}: ${s}`).toBe(false);
  });

  it('외모 비하·불길한 단정이 없다', () => {
    for (const { path, s } of allCopy()) for (const re of PUT_DOWN) expect(re.test(s), `${path}: ${s}`).toBe(false);
  });

  it('이모지가 없다 (동물 데이터의 emoji 값만 한국어 원본과 같게 둔다)', () => {
    for (const { path, s } of allCopy()) {
      if (/animal\.animalTypeDB\.\w+\.emoji$/.test(path)) continue;
      expect(EMOJI.test(s), `${path}: ${s}`).toBe(false);
    }
    for (const k of Object.keys(koAnimal.animalTypeDB)) expect(enAnimal.animalTypeDB[k].emoji).toBe(koAnimal.animalTypeDB[k].emoji);
  });

  // 관상 문구는 한국어 copy.test.ts와 같은 뜻으로 더 엄격하게
  const GUANSANG_BAN = [/\bugly\b/i, /unattractive/i, /\bbad luck\b/i, /\bdoomed\b/i, /\barrogant\b/i, /\bstingy\b/i, /\bdivorce/i, /\bwidow/i, /\binfertil/i, /\bfrail\b/i, /\bvulgar\b/i, /\bsinister\b/i, /\bshort[- ]lived\b/i, /\bold[- ]looking\b/i, /\bpromiscuous\b/i];
  const GUANSANG_EVAL = [/\bsmall\b/i, /\bshort\b/i, /\bnarrow\b/i, /\blow\b/i, /\blacking\b/i, /\bplain\b/i, /\bflat\b/i, /\baverage\b/i, /below average/i];
  const FORECAST = [/lifespan/i, /\bhealth\b/i, /\bchildren\b/i, /\bmarriage\b/i, /\billness\b/i];

  function guansangStrings(): string[] {
    const out: string[] = [];
    const { GUANSANG_TYPES, SHAPE_COPY, ZONE_COPY, PALACE_COPY, LABEL_COPY, BALANCED_CHIP, FOREHEAD_NOTE, DISCLAIMER, SCHOOL_NOTE } = enGuansang;
    for (const t of Object.values(GUANSANG_TYPES)) out.push(t.nickname, t.oneLiner, t.caution.situation, t.caution.action, t.partnerLine);
    for (const c of [...Object.values(SHAPE_COPY), ...Object.values(ZONE_COPY)]) out.push(c.easy, c.traditional, c.evidence);
    for (const p of Object.values(PALACE_COPY)) out.push(p.easy, p.part, p.traditional, p.grow, ...Object.values(p.lines));
    out.push(...Object.values(LABEL_COPY), BALANCED_CHIP, FOREHEAD_NOTE, DISCLAIMER, SCHOOL_NOTE);
    return out;
  }

  it('관상 문구: 비하·평가어·예언어가 없다', () => {
    for (const s of guansangStrings()) {
      expect(s.length).toBeGreaterThan(0);
      for (const re of [...GUANSANG_BAN, ...GUANSANG_EVAL, ...FORECAST]) expect(re.test(s), `${re}: ${s}`).toBe(false);
    }
  });

  it('관상 문구: 조심할 점은 상황형이고 행동은 한 문장이다', () => {
    for (const t of Object.values(enGuansang.GUANSANG_TYPES)) {
      expect(/easy to/i.test(t.caution.situation), t.caution.situation).toBe(true);
      expect(t.caution.action.trim().match(/[.!?]/g)?.length ?? 0, t.caution.action).toBe(1);
      expect(t.caution.action.trim().endsWith('.')).toBe(true);
    }
  });

  it('관상 문구: 한 줄 뜻 길이와 잘 맞는 상 규칙이 한국어와 같다', () => {
    for (const k of Object.keys(koGuansang.GUANSANG_TYPES) as (keyof typeof koGuansang.GUANSANG_TYPES)[]) {
      const en = enGuansang.GUANSANG_TYPES[k];
      expect(en.key).toBe(k);
      expect(en.partner).toBe(koGuansang.GUANSANG_TYPES[k].partner);
      expect(en.oneLiner.length).toBeGreaterThanOrEqual(50);
      expect(en.oneLiner.length).toBeLessThanOrEqual(160);
    }
    expect(enGuansang.LEGACY_FACE_KEYS).toBe(koGuansang.LEGACY_FACE_KEYS);
  });
});

describe('ui 사전', () => {
  it('필요한 문구가 있다', () => {
    const U = enUi.UI;
    expect(U['tab.home']).toBe('Home');
    expect(U['privacy.line']).toBe('Your photo never leaves your phone');
    expect(U['result.disclaimer']).toBe('Just for fun. Not scientific.');
    expect(U['lang.viewInEnglish']).toBe('View this page in English');
    expect(U['lang.readInEnglish']).toBe('Read in English');
    expect(U['lang.koreanOnly']).toBe('This page is only in Korean');
    expect(Object.keys(U).filter((k) => k.startsWith('analyzing.'))).toHaveLength(3);
    expect(Object.keys(U).filter((k) => k.startsWith('chip.'))).toHaveLength(5);
  });

  it('값이 모두 비어 있지 않은 문자열이다', () => {
    for (const [k, v] of Object.entries(enUi.UI)) expect(typeof v === 'string' && v.length > 0, k).toBe(true);
  });
});

describe('localePath', () => {
  it('영어는 /en을 붙이고 한국어는 그대로', () => {
    expect(localePath('en', '/')).toBe('/en');
    expect(localePath('en', '/face2')).toBe('/en/face2');
    expect(localePath('ko', '/face2')).toBe('/face2');
    expect(localePath('ko', '/')).toBe('/');
  });
  it('언어 목록', () => {
    expect([...LOCALES]).toEqual(['ko', 'en']);
    expect(DEFAULT_LOCALE).toBe('ko');
    for (const l of LOCALES) { expect(LOCALE_LABEL[l]).toBeTruthy(); expect(LOCALE_HTML_LANG[l]).toBeTruthy(); }
  });
});
