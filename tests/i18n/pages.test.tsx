import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import TestStart from '@/components/test/TestStart';
import TestHeader from '@/components/test/TestHeader';
import GenderPills from '@/components/test/GenderPills';
import ResultActions from '@/components/result/ResultActions';
import MoreTests from '@/components/MoreTests';
import BottomTabBar from '@/components/BottomTabBar';
import HomeGrid from '@/components/home/HomeGrid';
import FaceHero from '@/components/home/FaceHero';
import ResultCard from '@/components/result/ResultCard';
import FaceMatchCard from '@/components/faceMatch/FaceMatchCard';
import PhotoSlot from '@/components/faceMatch/PhotoSlot';
import AnalyzingOverlay from '@/components/test/AnalyzingOverlay';
import PageGuide from '@/components/PageGuide';
import NextTests from '@/components/result/NextTests';
import GuansangResultView from '@/components/face/GuansangResultView';
import SiteShell from '@/components/SiteShell';
import { faceMatch } from '@/lib/faceMatch/compat';
import { ALL_ITEMS } from '@/content/navigation';

// 한국어 출력이 영어판 연결 전과 글자 하나 다르지 않다는 증거: 연결 전에 떠 둔 스냅숏과 비교한다(tests/i18n/__snapshots__).
const noop = () => {};
const startProps = { heading: '제목', desc: '설명', tips: ['팁'], analyzeLabel: '분석', image: null, gender: null, onGender: noop, onFile: noop, onAnalyze: noop, onReset: noop, loading: false, error: null } as const;

describe('한국어 공용 컴포넌트 렌더가 그대로다(스냅숏)', () => {
  it('TestStart 빈 화면', () => expect(renderToStaticMarkup(<TestStart {...startProps} />)).toMatchSnapshot());
  it('TestStart 사진+성별', () => expect(renderToStaticMarkup(<TestStart {...startProps} image="data:image/png;base64,AA" gender="여" error="실패" />)).toMatchSnapshot());
  it('TestHeader', () => expect(renderToStaticMarkup(<TestHeader title="제목" onBack={noop} backLabel="돌아가기" />)).toMatchSnapshot());
  it('GenderPills', () => expect(renderToStaticMarkup(<GenderPills value="남" onChange={noop} />)).toMatchSnapshot());
  it('ResultActions', () => expect(renderToStaticMarkup(<ResultActions from="face" onShare={noop} onSave={noop} onRetry={noop} busy={false} notice={null} />)).toMatchSnapshot());
  it('ResultActions companion+busy', () => expect(renderToStaticMarkup(<ResultActions from="animal" companion={{ label: '짝', href: '/face-match' }} onShare={noop} onSave={noop} onRetry={noop} busy notice="공지" />)).toMatchSnapshot());
  it('MoreTests', () => expect(renderToStaticMarkup(<MoreTests current="/face2" />)).toMatchSnapshot());
  it('BottomTabBar', () => expect(renderToStaticMarkup(<BottomTabBar />)).toMatchSnapshot());
  it('HomeGrid + FaceHero', () => expect(renderToStaticMarkup(<HomeGrid items={ALL_ITEMS}><FaceHero /></HomeGrid>)).toMatchSnapshot());
  it('ResultCard', () => expect(renderToStaticMarkup(<ResultCard eyebrow="e" title="t" summary="s" chips={['a']} reasons={[{ label: 'l', text: 'x' }]} cast="haetae" />)).toMatchSnapshot());
  it('FaceMatchCard', () => expect(renderToStaticMarkup(<FaceMatchCard a="cat" b="dog" rel="lover" result={faceMatch('cat', 'dog', 'lover')} />)).toMatchSnapshot());
  it('PhotoSlot', () => expect(renderToStaticMarkup(<PhotoSlot label="나" gender={null} onGender={noop} image={null} onFile={noop} error="오류" />)).toMatchSnapshot());
  it('PhotoSlot fixed', () => expect(renderToStaticMarkup(<PhotoSlot label="나" gender={null} onGender={noop} image={null} onFile={noop} error={null} fixed="cat" />)).toMatchSnapshot());
  it('AnalyzingOverlay', () => expect(renderToStaticMarkup(<AnalyzingOverlay cast="tiger" steps={['가', '나']} step={1} />)).toMatchSnapshot());
  it('PageGuide /face2', () => expect(renderToStaticMarkup(<PageGuide route="/face2" />)).toMatchSnapshot());
  it('NextTests', () => expect(renderToStaticMarkup(<NextTests current="animal" image="x" />)).toMatchSnapshot());
  it('GuansangResultView', () => {
    const result = { type: 'earth-mid', shape: 'earth', zone: 'mid', balanced: false, foreheadUncertain: true, palaces: [{ key: 'money', label: 'strong' }, { key: 'work', label: 'even' }, { key: 'love', label: 'grow' }, { key: 'people', label: 'even' }, { key: 'base', label: 'strong' }] } as never;
    expect(renderToStaticMarkup(<GuansangResultView result={result} />)).toMatchSnapshot();
  });
  it('SiteShell(ko) 푸터·탭바', () => expect(renderToStaticMarkup(<SiteShell locale="ko">본문</SiteShell>)).toMatchSnapshot());
});

// ===== 영어판 =====
import { existsSync, readFileSync } from 'node:fs';
import { LocaleProvider } from '@/lib/i18n/LocaleProvider';
import { switchTarget } from '@/components/i18n/LanguageSwitch';
import { metadata as koFace2Meta } from '@/app/(ko)/face2/layout';
import { metadata as koAnimalMeta } from '@/app/(ko)/animal/layout';
import { metadata as enFace2Meta } from '@/app/en/face2/layout';
import { metadata as enAnimalMeta } from '@/app/en/animal/layout';
import { metadata as enMatchMeta } from '@/app/en/face-match/page';
import { metadata as enHomeMeta } from '@/app/en/page';
import { metadata as enAllMeta } from '@/app/en/all/page';

const HANGUL = /[가-힣]/;
const en = (node: React.ReactNode) => renderToStaticMarkup(<LocaleProvider locale="en">{node}</LocaleProvider>);

describe('영어 페이지', () => {
  it('영어 페이지 파일이 모두 있다', () => {
    for (const f of ['page.tsx', 'all/page.tsx', 'face2/layout.tsx', 'face2/page.tsx', 'animal/layout.tsx', 'animal/page.tsx', 'face-match/page.tsx']) {
      expect(existsSync(`src/app/en/${f}`), f).toBe(true);
    }
  });
  it('영어 canonical은 /en/...', () => {
    const cano = (m: { alternates?: unknown }) => (m.alternates as { canonical: string }).canonical;
    expect(cano(enHomeMeta)).toBe('https://unse-ai.com/en');
    expect(cano(enAllMeta)).toBe('https://unse-ai.com/en/all');
    expect(cano(enFace2Meta)).toBe('https://unse-ai.com/en/face2');
    expect(cano(enAnimalMeta)).toBe('https://unse-ai.com/en/animal');
    expect(cano(enMatchMeta)).toBe('https://unse-ai.com/en/face-match');
  });
  it('한국어 짝 페이지에 hreflang이 더해지고 canonical은 그대로다', () => {
    const a = (m: { alternates?: unknown }) => m.alternates as { canonical: string; languages: Record<string, string> };
    expect(a(koFace2Meta).canonical).toBe('https://unse-ai.com/face2');
    expect(a(koFace2Meta).languages.en).toBe('https://unse-ai.com/en/face2');
    expect(a(koAnimalMeta).languages['x-default']).toBe('https://unse-ai.com/animal');
    expect(a(enFace2Meta).languages.ko).toBe('https://unse-ai.com/face2');
  });
  it('언어 메뉴: 짝이 있으면 같은 페이지, 없으면 영어 홈 + ?only=ko', () => {
    expect(switchTarget('/face2', '', 'en', 'ko')).toBe('/en/face2');
    expect(switchTarget('/animal/r/cat', '?s=88', 'en', 'ko')).toBe('/en/animal/r/cat?s=88');
    expect(switchTarget('/saju', '', 'en', 'ko')).toBe('/en?only=ko');
    expect(switchTarget('/en/face2', '', 'ko', 'en')).toBe('/face2');
  });
  it('영어로 그린 공용 컴포넌트에는 한글이 없다', () => {
    const out = [
      en(<TestStart {...startProps} heading="Title" desc="Desc" tips={['Tip']} analyzeLabel="Go" image="data:image/png;base64,AA" gender="여" />),
      en(<ResultActions from="face" onShare={noop} onSave={noop} onRetry={noop} busy={false} notice={null} companion={{ label: 'Friend', href: '/en/face-match' }} />),
      en(<MoreTests current="/en/face2" locale="en" />),
      en(<BottomTabBar />),
      en(<AnalyzingOverlay cast="tiger" steps={['a']} step={0} />),
      en(<ResultCard eyebrow="e" title="t" reasons={[]} cast="haetae" />),
      en(<GenderPills value="여" onChange={noop} />),
    ];
    for (const html of out) expect(html).not.toMatch(HANGUL);
  });
  it('영어판에는 카카오·쿠팡·부적 선물 줄이 없다', () => {
    const html = en(<ResultActions from="face" onShare={noop} onSave={noop} onRetry={noop} busy={false} notice={null} />);
    expect(html).not.toContain('/bujeok');
    const face2 = readFileSync('src/app/(ko)/face2/page.tsx', 'utf8');
    expect(face2).toContain('!en && <div className="mt-2"><CoupangBanner');
    expect(readFileSync('src/hooks/useResultShare.ts', 'utf8')).toContain('locale === "ko" && isKakaoInApp');
  });
  it('영어 하단 탭은 둘(Home·All)이고 /en으로 간다', () => {
    const html = en(<BottomTabBar />);
    expect(html).toContain('>Home<');
    expect(html).toContain('>All<');
    expect(html).not.toContain('Today');
    expect(html).toContain('href="/en"');
    expect(html).toContain('href="/en/all"');
  });
});
