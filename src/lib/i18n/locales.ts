// 언어 목록 한 곳. 언어를 더하려면 여기에 한 줄 + src/content/<언어>/ 문구 파일.
export const LOCALES = ['ko', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'ko';
export const LOCALE_LABEL: Record<Locale, string> = { ko: '한국어', en: 'English' };
export const LOCALE_HTML_LANG: Record<Locale, string> = { ko: 'ko', en: 'en' };

/** 기본 언어는 주소 그대로, 그 밖의 언어는 앞에 /<언어>를 붙인다. '/' → '/en'. */
export function localePath(locale: Locale, path: string): string {
  if (locale === DEFAULT_LOCALE) return path;
  return path === '/' ? `/${locale}` : `/${locale}${path.startsWith('/') ? path : `/${path}`}`;
}
