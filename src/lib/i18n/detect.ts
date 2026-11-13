import { LOCALES, type Locale } from '@/lib/i18n/locales';
import { counterpart, localeOfPath } from '@/lib/i18n/alternates';

export interface DetectInput {
  path: string;
  /** 사용자가 직접 고른 언어(쿠키 `lang`) */
  langCookie: string | undefined;
  /** 접속 국가(x-vercel-ip-country) */
  country: string | undefined;
  acceptLanguage: string | undefined;
  /** 안내 띠 쿠키(`lang_suggest`)가 이미 있나 */
  hasSuggestCookie: boolean;
}

export interface DetectResult {
  redirect?: string;
  setSuggest?: boolean;
}

function chosen(v: string | undefined): Locale | null {
  return v && (LOCALES as readonly string[]).includes(v) ? (v as Locale) : null;
}

/**
 * 언어 때문에 길을 바꿀지 정한다(순수 함수).
 * 규칙: `lang` 쿠키(사용자가 고른 언어)가 없으면 절대 redirect를 내지 않는다. 검색 로봇은 쿠키가 없고
 * 주로 미국 IP로 오므로, IP·브라우저 언어만 보고 보내면 한국어 페이지가 검색에서 사라진다.
 * 국가·브라우저 언어는 "영어로 보기" 안내 띠 쿠키를 심는 데만 쓴다.
 */
export function decide(i: DetectInput): DetectResult {
  const lang = chosen(i.langCookie);
  if (lang) {
    if (localeOfPath(i.path) === lang) return {};
    const to = counterpart(i.path, lang);
    return to ? { redirect: to } : {};
  }
  if (i.hasSuggestCookie) return {};
  // 영어판을 보고 있는 사람에겐 안내가 필요 없다
  if (localeOfPath(i.path) !== 'ko') return {};
  const first = (i.acceptLanguage ?? '').split(',')[0]?.trim().toLowerCase() ?? '';
  const notKorea = !!i.country && i.country.toUpperCase() !== 'KR';
  const notKoreanBrowser = !first.startsWith('ko');
  // 국가를 알 수 없는 요청(헤더 없음)은 안내하지 않는다
  if (notKorea && notKoreanBrowser && first !== '') return { setSuggest: true };
  return {};
}
