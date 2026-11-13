import type { ReactNode } from "react";

// <head> 안쪽 공통 요소(PWA 메타, 애드센스, 구조화 데이터, 서비스 워커 등록). 한국어·영어 루트 레이아웃이 함께 쓴다.
export default function SiteHead({ appName, jsonLd }: { appName: string; jsonLd: Record<string, unknown> }): ReactNode {
  return (
    <>
        {/* PWA 메타 태그 */}
        <meta name="application-name" content={appName} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={appName} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#F7F8FC" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png" />
        {/* 애드센스: 태그 위치는 그대로(심사 중). adsbygoogle.js가 하이드레이션 전에 이 태그 바로 뒤에 show_ads_impl 스크립트를 끼워 넣어
            React가 아래 <script> 두 개를 한 칸씩 밀린 노드와 비교하며 하이드레이션 경고를 낸다(개발 서버 "1 Issue").
            이 태그와 뒤따르는 <script> 두 개에 suppressHydrationWarning을 달아 경고만 끈다(DOM 내용은 서버 HTML 그대로) */}
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9670928093323234"
          crossOrigin="anonymous" suppressHydrationWarning></script>

        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* 서비스 워커 등록 */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('SW registered: ', registration);
                    },
                    function(err) {
                      console.log('SW registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
    </>
  );
}
