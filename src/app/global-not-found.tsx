import type { Metadata } from "next";
import SiteHead from "@/components/SiteHead";
import SiteShell from "@/components/SiteShell";
import NotFoundView from "@/components/NotFoundView";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import { FONT_CLASS } from "@/lib/siteFonts";
import "./globals.css";

// 루트 레이아웃이 (ko)·en 둘이라, 어느 쪽에도 맞지 않는 없는 주소는 여기서 한국어 틀(탭바·푸터·GA 포함)로 404를 그린다.
export const metadata: Metadata = { title: "페이지를 찾을 수 없어요 – 운명을 읽다", robots: { index: false, follow: true } };

export default function GlobalNotFound() {
  return (
    <html lang="ko">
      <head>
        <SiteHead appName="운명을읽다" />
      </head>
      <body className={`${FONT_CLASS} font-sans antialiased bg-paper text-ink`}>
        <LocaleProvider locale="ko">
          <SiteShell locale="ko">
            <NotFoundView locale="ko" />
          </SiteShell>
        </LocaleProvider>
      </body>
    </html>
  );
}
