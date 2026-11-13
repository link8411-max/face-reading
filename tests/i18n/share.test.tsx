import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { faceMatchUrl, ogImageUrl, shareUrl } from '@/lib/shareLinks';
import { ogQueryOk } from '@/lib/ogQuery';
import sitemap, { SITEMAP_ROUTES, LAST_MODIFIED } from '@/app/sitemap';
import { languageAlternates } from '@/lib/i18n/alternates';
import { LocaleProvider } from '@/lib/i18n/LocaleProvider';
import { generateMetadata as animalMeta, default as AnimalLanding } from '@/app/en/animal/r/[type]/page';
import { generateMetadata as faceMeta, default as FaceLanding } from '@/app/en/face2/r/[key]/page';
import { generateMetadata as matchMeta, default as MatchLanding } from '@/app/en/face-match/r/[pair]/page';

const HANGUL = /[가-힣]/;
const q = (s: string) => new URLSearchParams(s);

describe('영어 공유 링크', () => {
  it('shareLinks가 en에서 /en 접두어를 붙인다', () => {
    expect(shareUrl('animal', 'cat', 88, 'en')).toBe('https://unse-ai.com/en/animal/r/cat?s=88&utm_source=share&utm_medium=friend_link&utm_campaign=animal');
    expect(shareUrl('face', 'earth-mid', undefined, 'en')).toContain('https://unse-ai.com/en/face2/r/earth-mid?utm_source=share');
    expect(faceMatchUrl('cat', 'dog', 'lover', 'en')).toContain('https://unse-ai.com/en/face-match/r/cat-dog?rel=lover');
  });
  it('한국어 링크는 그대로다', () => {
    expect(shareUrl('animal', 'cat', 88)).toBe('https://unse-ai.com/animal/r/cat?s=88&utm_source=share&utm_medium=friend_link&utm_campaign=animal');
    expect(ogImageUrl('animal', 'cat', 88)).toBe('https://unse-ai.com/api/og/result?kind=animal&key=cat&s=88');
  });
  it('영어 미리보기 이미지 주소에 lang=en', () => {
    expect(ogImageUrl('animal', 'cat', 88, undefined, 'en')).toBe('https://unse-ai.com/api/og/result?kind=animal&key=cat&s=88&lang=en');
  });
});

describe('ogQuery lang', () => {
  it('lang은 en만 허용한다', () => {
    expect(ogQueryOk(q('kind=animal&key=cat&s=88&lang=en'))).toBe(true);
    expect(ogQueryOk(q('kind=face&key=earth-mid&lang=en'))).toBe(true);
    expect(ogQueryOk(q('kind=face-match&a=cat&b=dog&rel=lover&lang=en'))).toBe(true);
    expect(ogQueryOk(q('kind=animal&key=cat&s=88&lang=ja'))).toBe(false);
    expect(ogQueryOk(q('kind=animal&key=cat&s=88&lang='))).toBe(false);
    expect(ogQueryOk(q('kind=animal&key=cat&s=88&lang=en&lang=en'))).toBe(false);
  });
  it('영어판이 없는 종류에는 lang을 받지 않는다', () => {
    expect(ogQueryOk(q('kind=samguk&key=guanyu&s=88&lang=en'))).toBe(false);
    expect(ogQueryOk(q('kind=mbti&a=INFP&b=ENTJ&lang=en'))).toBe(false);
  });
  it('lang 없는 기존 요청은 그대로', () => {
    expect(ogQueryOk(q('kind=animal&key=cat&s=88'))).toBe(true);
  });
});

describe('사이트맵', () => {
  it('영어 주소 5개가 있다', () => {
    for (const r of ['/en', '/en/all', '/en/face2', '/en/animal', '/en/face-match']) {
      expect(SITEMAP_ROUTES).toContain(r);
      expect(LAST_MODIFIED[r]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
  it('영어 항목과 그 한국어 짝에 서로의 alternates.languages가 있다', () => {
    const entries = sitemap();
    const en = entries.find((e) => e.url === 'https://unse-ai.com/en/face2')!;
    expect(en.alternates?.languages).toMatchObject({ ko: 'https://unse-ai.com/face2', en: 'https://unse-ai.com/en/face2' });
    const ko = entries.find((e) => e.url === 'https://unse-ai.com/face2')!;
    expect(ko.alternates?.languages).toMatchObject({ ko: 'https://unse-ai.com/face2', en: 'https://unse-ai.com/en/face2' });
    const home = entries.find((e) => e.url === 'https://unse-ai.com')!;
    expect(home.alternates?.languages?.en).toBe('https://unse-ai.com/en');
    // 영어판이 없는 주소에는 없다
    expect(entries.find((e) => e.url === 'https://unse-ai.com/saju')!.alternates).toBeUndefined();
    expect(languageAlternates('/saju')).toBeUndefined();
  });
  it('공유 착지는 사이트맵에 없다', () => {
    expect(sitemap().some((e) => e.url.includes('/r/') && e.url.includes('/en/'))).toBe(false);
  });
});

describe('영어 결과 착지', () => {
  const one = <T,>(v: T) => Promise.resolve(v);
  it('noindex이고 canonical은 /en/<테스트>, 제목·미리보기는 영어', async () => {
    const a = await animalMeta({ params: one({ type: 'cat' }), searchParams: one({ s: '88' }) });
    expect(a.robots).toMatchObject({ index: false });
    expect((a.alternates as { canonical: string }).canonical).toBe('https://unse-ai.com/en/animal');
    expect(String(a.title)).not.toMatch(HANGUL);
    expect(JSON.stringify(a.openGraph)).toContain('lang=en');
    expect(JSON.stringify(a.openGraph)).not.toMatch(HANGUL);

    const f = await faceMeta({ params: one({ key: 'earth-mid' }), searchParams: one({}) });
    expect(f.robots).toMatchObject({ index: false });
    expect((f.alternates as { canonical: string }).canonical).toBe('https://unse-ai.com/en/face2');
    expect(JSON.stringify(f)).not.toMatch(HANGUL);

    const m = await matchMeta({ params: one({ pair: 'cat-dog' }), searchParams: one({ rel: 'lover' }) });
    expect(m.robots).toMatchObject({ index: false });
    expect((m.alternates as { canonical: string }).canonical).toBe('https://unse-ai.com/en/face-match');
    expect(JSON.stringify(m)).not.toMatch(HANGUL);
  });
  it('잘못된 키는 메타가 비고(착지는 테스트 시작 화면으로 보낸다)', async () => {
    expect(await animalMeta({ params: one({ type: 'nope' }), searchParams: one({ s: '88' }) })).toEqual({});
    expect(await animalMeta({ params: one({ type: 'cat' }), searchParams: one({ s: 'x' }) })).toEqual({});
  });
  it('착지 화면에 한글·카카오·쿠팡이 없다', async () => {
    // 페이지는 비동기 컴포넌트(EnSharePage)를 돌려주므로 한 겹 풀어서 그린다
    const unwrap = async (el: React.ReactElement) => (el.type as (p: unknown) => Promise<React.ReactElement>)(el.props);
    const a = renderToStaticMarkup(<LocaleProvider locale="en">{await unwrap(AnimalLanding({ params: one({ type: 'cat' }), searchParams: one({ s: '88' }) }))}</LocaleProvider>);
    const f = renderToStaticMarkup(<LocaleProvider locale="en">{await unwrap(FaceLanding({ params: one({ key: 'earth-mid' }), searchParams: one({}) }))}</LocaleProvider>);
    const m = renderToStaticMarkup(<LocaleProvider locale="en">{await MatchLanding({ params: one({ pair: 'cat-dog' }), searchParams: one({ rel: 'lover' }) })}</LocaleProvider>);
    for (const html of [a, f, m]) {
      expect(html).not.toMatch(HANGUL);
      expect(html).not.toContain('coupang');
    }
    expect(a).toContain('href="/en/animal"');
    expect(f).toContain('href="/en/face2"');
    expect(m).toContain('href="/en/face-match"');
  });
});
