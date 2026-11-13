import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';

describe('루트 레이아웃 둘', () => {
  it('src/app/layout.tsx는 없고 (ko)와 en에 있다', () => {
    expect(existsSync('src/app/layout.tsx')).toBe(false);
    expect(existsSync('src/app/(ko)/layout.tsx')).toBe(true);
    expect(existsSync('src/app/en/layout.tsx')).toBe(true);
  });
  it('둘 다 SiteShell·LocaleProvider를 쓴다', () => {
    for (const f of ['src/app/(ko)/layout.tsx', 'src/app/en/layout.tsx']) {
      const s = readFileSync(f, 'utf8');
      expect(s, f).toContain('SiteShell');
      expect(s, f).toContain('LocaleProvider');
    }
  });
  it('html lang이 언어마다 다르다', () => {
    expect(readFileSync('src/app/(ko)/layout.tsx', 'utf8')).toContain('<html lang="ko">');
    expect(readFileSync('src/app/en/layout.tsx', 'utf8')).toContain('LOCALE_HTML_LANG.en');
  });
});

test('없는 주소 404: 전역(한국어 틀)과 두 언어 트리 모두 있다', () => {
  const { existsSync, readFileSync: read } = require('node:fs')
  expect(existsSync('src/app/global-not-found.tsx')).toBe(true)
  expect(existsSync('src/app/(ko)/not-found.tsx')).toBe(true)
  expect(existsSync('src/app/en/not-found.tsx')).toBe(true)
  expect(read('src/app/global-not-found.tsx', 'utf8')).toMatch(/<html lang="ko">[\s\S]*SiteShell/)
  expect(read('next.config.ts', 'utf8')).toMatch(/globalNotFound: true/)
})

test('안내 띠 닫기는 언어를 고르지 않는다(영어 공유 링크가 한국어로 넘어가지 않게)', () => {
  const src = require('node:fs').readFileSync('src/components/i18n/LanguageBanner.tsx', 'utf8')
  expect(src).not.toMatch(/writeLangCookie\("ko"\)/)
  expect(src).toMatch(/dismissed/)
})
