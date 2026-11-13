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
