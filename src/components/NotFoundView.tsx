import Link from "next/link";
import type { Locale } from "@/lib/i18n/locales";

// 없는 주소·잘못된 링크로 온 사람을 홈과 전체 테스트로 보낸다(두 언어 공용). 해태가 고개를 갸웃한다.
const TEXT = {
  ko: { title: "페이지를 찾을 수 없어요", body: "주소가 바뀌었거나 잘못된 링크예요. 아래에서 다시 골라 주세요.", home: "홈으로", all: "전체 테스트 보기", homeHref: "/", allHref: "/all" },
  en: { title: "Page not found", body: "The link may be old or mistyped. Pick a test below.", home: "Go home", all: "See all tests", homeHref: "/en", allHref: "/en/all" },
} as const;

export default function NotFoundView({ locale }: { locale: Locale }) {
  const t = TEXT[locale === "en" ? "en" : "ko"];
  return (
    <div className="max-w-lg mx-auto px-4 pt-14 pb-10 flex flex-col items-center text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/cast/haetae-face.webp" alt="" width={120} height={120} className="rounded-[28px]" />
      <h1 className="mt-6 text-[22px] font-bold">{t.title}</h1>
      <p className="mt-2 text-sm text-muted break-keep">{t.body}</p>
      <div className="mt-6 flex gap-2">
        <Link href={t.homeHref} className="h-12 px-6 rounded-full bg-accent text-white font-medium grid place-items-center">{t.home}</Link>
        <Link href={t.allHref} className="h-12 px-6 rounded-full border border-line bg-card font-medium grid place-items-center">{t.all}</Link>
      </div>
    </div>
  );
}
