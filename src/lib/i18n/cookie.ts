// 언어 쿠키(브라우저 전용). `lang`은 사용자가 고른 언어, `lang_suggest`는 proxy가 심는 "영어로 보기" 안내 표시.
import type { Locale } from '@/lib/i18n/locales';

export const LANG_COOKIE = 'lang';
export const SUGGEST_COOKIE = 'lang_suggest';
export const ONE_YEAR = 60 * 60 * 24 * 365;

export function readCookie(name: string): string | undefined {
  try {
    const m = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`));
    return m ? decodeURIComponent(m.slice(name.length + 1)) : undefined;
  } catch {
    return undefined;
  }
}

/** 사용자가 고른 언어를 1년 기억한다 */
export function writeLangCookie(locale: Locale): void {
  try {
    document.cookie = `${LANG_COOKIE}=${locale}; path=/; max-age=${ONE_YEAR}; SameSite=Lax`;
  } catch {
    /* 쿠키를 못 써도 이동은 한다 */
  }
}
