import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";
import Link from "next/link";
import type { ReactNode } from "react";
import LanguageBanner from "@/components/i18n/LanguageBanner";
import BottomTabBar from "@/components/BottomTabBar";
import { GA_ID, PROD_HOST_SOURCE } from "@/lib/analytics";
import { CATEGORIES, FOOTER_EXTRA } from "@/content/navigation";
import { t } from "@/lib/i18n/dict";
import { localePath, type Locale } from "@/lib/i18n/locales";

// 한국어·영어 루트 레이아웃이 함께 쓰는 <body> 안쪽: 본문 틀, 푸터, 하단 탭바, 방문 통계.
// 한국어 출력은 예전 layout.tsx와 글자 하나 다르지 않다.
export default function SiteShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <>
      {/* 하단 탭바(h-16)에 내용이 가리지 않도록 아래 여백. 탭바를 숨기는 일기토 화면은 duel.css가 app-shell 여백을 줄인다 */}
      <div className="app-shell flex flex-col min-h-screen pb-[calc(4rem+env(safe-area-inset-bottom))]">
        {locale === "ko" && <LanguageBanner />}
        <main className="flex-grow">
          {children}
        </main>

        {locale === "ko" ? <KoFooter /> : <EnFooter locale={locale} />}
      </div>
      <BottomTabBar />
      <Analytics />
      {/* Google 애널리틱스(GA4): 채널별 유입·완료율. 페이지 이동은 GA4 향상된 측정(브라우저 기록 변경)으로 잡힌다.
          운영 주소(unse-ai.com)가 아니면(로컬·E2E·Vercel 미리보기) gtag.js를 받지 않고 config도 하지 않아 실제 통계로 보내지 않는다(이벤트는 dataLayer에만 쌓임) */}
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());
if(new RegExp(${JSON.stringify(PROD_HOST_SOURCE)}).test(location.hostname)){var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id=${GA_ID}';document.head.appendChild(s);gtag('config','${GA_ID}');}`}
      </Script>
    </>
  );
}

function KoFooter() {
  return (
    <footer className="bg-card-2 border-t border-line py-8 px-4 no-screenshot">
      <div className="max-w-lg mx-auto">
        <div className="grid grid-cols-2 gap-6 mb-8">
          {CATEGORIES.filter((c) => c.items.length > 0).map((c) => (
            <div key={c.key} className="space-y-3">
              <p className="text-accent-ink font-bold text-sm"><Link href={c.href}>{c.title}</Link></p>
              <ul className="text-sm space-y-2 text-muted">
                {c.items.filter((i) => i.footer !== false).map((i) => (
                  <li key={i.href}><Link href={i.href} className="hover:text-accent-ink">{i.title}</Link></li>
                ))}
              </ul>
            </div>
          ))}
          <div className="space-y-3">
            <p className="text-accent-ink font-bold text-sm">함께 해봐요</p>
            <ul className="text-sm space-y-2 text-muted">
              {FOOTER_EXTRA.map((i) => (
                <li key={i.href}><Link href={i.href} className="hover:text-accent-ink">{i.title}</Link></li>
              ))}
            </ul>
          </div>
          <div className="space-y-3 col-span-2 border-t pt-6">
            <p className="text-muted font-bold text-sm">정보</p>
            <ul className="text-sm space-y-2 text-muted">
              <li><Link href="/about" className="hover:text-accent-ink">서비스 소개</Link></li>
              <li><Link href="/privacy" className="hover:text-accent-ink">개인정보처리방침</Link></li>
            </ul>
          </div>
        </div>
        <div className="text-center pt-6 border-t border-line">
          <p className="text-xs text-muted">© 2026 운명을 읽다. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

// 영어판 푸터: 영어판이 있는 테스트만 링크한다(문구는 src/content/en/*)
function EnFooter({ locale }: { locale: Locale }) {
  const links: { href: string; key: "tab.home" | "tab.all" }[] = [
    { href: localePath(locale, "/"), key: "tab.home" },
    { href: localePath(locale, "/all"), key: "tab.all" },
  ];
  return (
    <footer className="bg-card-2 border-t border-line py-8 px-4 no-screenshot">
      <div className="max-w-lg mx-auto">
        <ul className="text-sm space-y-2 text-muted mb-8">
          {links.map((l) => (
            <li key={l.href}><Link href={l.href} className="hover:text-accent-ink">{t(locale, l.key)}</Link></li>
          ))}
        </ul>
        <div className="text-center pt-6 border-t border-line">
          <p className="text-xs text-muted">© 2026 unse-ai.com</p>
        </div>
      </div>
    </footer>
  );
}
