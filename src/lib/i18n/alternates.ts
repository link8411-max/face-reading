import { LOCALES, DEFAULT_LOCALE, localePath, type Locale } from '@/lib/i18n/locales';

const SITE = 'https://unse-ai.com';

/** 영어판이 있는 한국어 경로. 끝이 /이면 접두어(그 아래 한 단계 경로). */
export const EN_PATHS: string[] = ['/', '/all', '/face2', '/animal', '/face-match', '/face2/r/', '/animal/r/', '/face-match/r/'];

function splitQuery(path: string): [string, string] {
  const i = path.search(/[?#]/);
  return i < 0 ? [path, ''] : [path.slice(0, i), path.slice(i)];
}

/** 언어 접두어를 뗀 한국어 기준 경로 */
function baseOf(path: string): string {
  for (const l of LOCALES) {
    if (l === DEFAULT_LOCALE) continue;
    if (path === `/${l}`) return '/';
    if (path.startsWith(`/${l}/`)) return path.slice(l.length + 1);
  }
  return path;
}

/** 지금 경로가 속한 언어 */
export function localeOfPath(path: string): Locale {
  const [p] = splitQuery(path);
  for (const l of LOCALES) {
    if (l !== DEFAULT_LOCALE && (p === `/${l}` || p.startsWith(`/${l}/`))) return l;
  }
  return DEFAULT_LOCALE;
}

function hasEnglish(base: string): boolean {
  return EN_PATHS.some((p) => (p.endsWith('/') && p !== '/' ? base.startsWith(p) && base.length > p.length && !base.slice(p.length).includes('/') : base === p));
}

/** 다른 언어판 주소(쿼리 유지). 없으면 null. */
export function counterpart(path: string, to: Locale): string | null {
  const [p, rest] = splitQuery(path);
  if (localeOfPath(p) === to) return path;
  const base = baseOf(p);
  if (to === DEFAULT_LOCALE) {
    // 영어 → 한국어: 영어판이 있는 경로만 짝이 있다
    return hasEnglish(base) ? base + rest : null;
  }
  return hasEnglish(base) ? localePath(to, base) + rest : null;
}

/** Next metadata alternates.languages용. 짝이 없으면 undefined. */
export function languageAlternates(koPath: string): Record<string, string> | undefined {
  const [base] = splitQuery(baseOf(koPath));
  if (!hasEnglish(base)) return undefined;
  const abs = (p: string) => (p === '/' ? SITE : SITE + p);
  const out: Record<string, string> = {};
  for (const l of LOCALES) out[l] = abs(localePath(l, base));
  out['x-default'] = abs(base);
  return out;
}
