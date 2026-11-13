import localFont from "next/font/local";

// 글꼴은 자체 호스팅(src/fonts, SIL OFL). Google Fonts를 빌드 때 내려받지 않으므로 Vercel 빌드가 네트워크에 기대지 않는다.
// 제목·본문은 Pretendard 가변 글꼴 한 파일(400~800). scripts/font-subset.mjs로 KS X 1001 완성형 2350자 + 라틴·기호 + 코드에 나오는 글자만 남겼다.
// Gowun Batang은 전통 부적 그림 글씨 전용이라 미리 받지 않는다. 삼국지 카드는 Silkscreen.
const pretendard = localFont({
  variable: "--font-pretendard",
  src: [{ path: "../fonts/PretendardVariable.woff2", weight: "400 800", style: "normal" }],
  display: "swap",
});

// 전통 부적 그림 글씨 전용 (부적을 열 때만 받는다)
const gowunBatang = localFont({
  variable: "--font-gowun-batang",
  src: [
    { path: "../fonts/GowunBatang-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/GowunBatang-Bold.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  preload: false,
});

// 삼국지 결과 카드의 픽셀 글씨 (영문·숫자만)
const silkscreen = localFont({
  variable: "--font-silkscreen",
  src: [{ path: "../fonts/Silkscreen-Regular.woff2", weight: "400", style: "normal" }],
  display: "swap",
  preload: false,
});

// 전통 부적 그림 속 한자(霞鹜文楷 TC 46자, scripts/font-subset-brush.mjs). 부적을 열 때만 받는다
const bujeokBrush = localFont({
  variable: "--font-bujeok-brush",
  src: [{ path: "../fonts/LXGWWenKaiTC-Bujeok.woff2", weight: "500", style: "normal" }],
  display: "swap",
  preload: false,
});

/** <body>에 붙는 글꼴 변수 className (한국어·영어 레이아웃 공용) */
export const FONT_CLASS = `${pretendard.variable} ${gowunBatang.variable} ${silkscreen.variable} ${bujeokBrush.variable}`;
