import { NextResponse, type NextRequest } from "next/server";
import { decide } from "@/lib/i18n/detect";

// Next 16의 미들웨어 이름은 proxy.ts. 언어 때문에 길을 바꾸는 일은 사용자가 고른 `lang` 쿠키가 있을 때만 한다.
// 쿠키 없는 요청(검색 로봇)은 어떤 주소에서도 리디렉션하지 않는다. 국가·브라우저 언어는 안내 띠 쿠키를 심는 데만 쓴다.
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const result = decide({
    path: pathname,
    langCookie: request.cookies.get("lang")?.value,
    country: request.headers.get("x-vercel-ip-country") ?? undefined,
    acceptLanguage: request.headers.get("accept-language") ?? undefined,
    hasSuggestCookie: request.cookies.has("lang_suggest"),
  });
  if (result.redirect) {
    return NextResponse.redirect(new URL(result.redirect + search, request.url), 307);
  }
  const res = NextResponse.next();
  if (result.setSuggest) {
    res.cookies.set("lang_suggest", "en", { maxAge: 60 * 60 * 24 * 365, sameSite: "lax", path: "/" });
  }
  return res;
}

// /api, /_next, 정적 폴더, 파일 확장자가 있는 경로(아이콘·sw.js·robots.txt·sitemap.xml 등)는 건너뛴다
export const config = {
  matcher: ["/((?!api|_next|images|icons|models|.*\\..*).*)"],
};
