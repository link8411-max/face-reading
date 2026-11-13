import type { Locale } from '@/lib/i18n/locales';
import { UI as EN, type UiKey } from '@/content/en/ui';
import { UI as KO } from '@/content/ko/ui';

export type { UiKey };

// 언어를 더하려면 src/content/<언어>/ui.ts를 만들고 여기에 한 줄.
const DICT: Record<Locale, Record<UiKey, string>> = { ko: KO, en: EN };

export function t(locale: Locale, key: UiKey): string {
  return DICT[locale][key];
}
