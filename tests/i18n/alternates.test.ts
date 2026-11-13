import { describe, it, expect } from 'vitest';
import { counterpart, languageAlternates, EN_PATHS } from '@/lib/i18n/alternates';
import { t } from '@/lib/i18n/dict';
import { UI as KO } from '@/content/ko/ui';
import { UI as EN } from '@/content/en/ui';

describe('counterpart', () => {
  it('한국어 → 영어', () => {
    expect(counterpart('/face2', 'en')).toBe('/en/face2');
    expect(counterpart('/', 'en')).toBe('/en');
    expect(counterpart('/animal/r/cat?s=88', 'en')).toBe('/en/animal/r/cat?s=88');
  });
  it('영어 → 한국어(쿼리 유지)', () => {
    expect(counterpart('/en/animal/r/cat?s=88', 'ko')).toBe('/animal/r/cat?s=88');
    expect(counterpart('/en', 'ko')).toBe('/');
  });
  it('짝이 없으면 null', () => {
    expect(counterpart('/saju', 'en')).toBeNull();
    expect(counterpart('/en/saju', 'ko')).toBeNull();
    expect(counterpart('/face2x', 'en')).toBeNull();
    expect(counterpart('/face2/r', 'en')).toBeNull();
  });
  it('같은 언어면 그대로', () => {
    expect(counterpart('/face2', 'ko')).toBe('/face2');
  });
});

describe('languageAlternates', () => {
  it('ko·en·x-default', () => {
    expect(languageAlternates('/face2')).toEqual({
      ko: 'https://unse-ai.com/face2',
      en: 'https://unse-ai.com/en/face2',
      'x-default': 'https://unse-ai.com/face2',
    });
    expect(languageAlternates('/')).toEqual({
      ko: 'https://unse-ai.com',
      en: 'https://unse-ai.com/en',
      'x-default': 'https://unse-ai.com',
    });
  });
  it('짝이 없으면 undefined', () => {
    expect(languageAlternates('/saju')).toBeUndefined();
  });
  it('EN_PATHS에 정확 경로와 접두어', () => {
    expect(EN_PATHS).toContain('/face2/r/');
  });
});

describe('dict', () => {
  it('t', () => {
    expect(t('en', 'tab.home')).toBe('Home');
    expect(t('ko', 'tab.home')).toBe('홈');
  });
  it('ko/en 키 집합 같음', () => {
    expect(Object.keys(KO).sort()).toEqual(Object.keys(EN).sort());
  });
});
