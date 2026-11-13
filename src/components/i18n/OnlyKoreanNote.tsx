"use client";

import { useEffect, useState } from "react";
import { t } from "@/lib/i18n/dict";
import { useLocale } from "@/lib/i18n/LocaleProvider";

// 언어 메뉴에서 영어판이 없는 한국어 페이지에서 넘어오면(?only=ko) 영어 홈 위에 한 줄 안내. 마운트 뒤에만 보인다.
export default function OnlyKoreanNote() {
  const locale = useLocale();
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(new URLSearchParams(window.location.search).get("only") === "ko");
  }, []);
  if (!show) return null;
  return <p role="status" className="rounded-[18px] bg-card-2 px-4 py-3 text-sm text-ink">{t(locale, "lang.koreanOnly")}</p>;
}
