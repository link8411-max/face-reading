"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { track } from "@/lib/analytics";
import { activeSeason } from "@/content/coupangSeasons";

// 쿠팡 파트너스 다이나믹 배너 — "고객 관심 기반 추천" (방문자의 쿠팡 쿠키로 관심 상품을 보여줌)
// subId로 페이지별 실적을 쿠팡 파트너스 리포트에서 구분한다. 결과 이미지 캡처에서는 제외(no-screenshot, iframe 필터).
// 서드파티 쿠키를 막는 브라우저에서는 위젯 iframe이 빈 채로 남는다. 위젯이 부모 창에 보내는 postMessage로 실제 노출을 확인하고,
//   화면에 보인 뒤에도 FALLBACK_DELAY_MS 안에 노출 메시지(adOnePixelDisplayed / adDisplayed)가 없으면 일반 제휴 링크로 바꾼다.
// GA: 화면에 보이면 coupang_banner_view(slot, keyword=widget|links) — 위젯이 실제로 떴는지 / 링크로 대체했는지 구분.
//   배너를 누르면 coupang_click(slot, keyword=banner), 대체 링크를 누르면 coupang_click(slot, keyword=링크 key).
//   배너는 다른 도메인 iframe이라 클릭을 직접 볼 수 없어서, 창의 초점이 이 iframe으로 옮겨 가는 순간을 클릭으로 본다.
export const COUPANG_WIDGET_ID = 1043563;
const TRACKING_CODE = "AF6497036";
const WIDTH = 400;
const HEIGHT = 140;

// GA 개인정보 필터(영문·숫자·밑줄)에 맞춘 위치 값: mbti-infp → mbti_infp
export function gaSlot(subId: string): string {
  return subId.replace(/[^A-Za-z0-9_]/g, "_");
}

// 화면에 보인 뒤 이 시간 안에 노출 메시지가 없으면 빈 배너로 보고 링크로 바꾼다.
// iframe 로드를 기다리지 않는다 — 광고 차단·지연 로딩으로 아예 로드되지 않는 경우도 링크로 바꿔야 해서.
// (크롬 실측: 로드 후 노출 메시지까지 0.1초 안쪽, 로드는 0.3~0.6초)
export const FALLBACK_DELAY_MS = 5000;

// 위젯은 어떤 메시지는 객체로, 어떤 메시지는 JSON 문자열로 보낸다 — 둘 다 받는다
function messageType(data: unknown): string | null {
  let d = data;
  if (typeof d === "string") {
    try { d = JSON.parse(d); } catch { return null; }
  }
  if (d && typeof d === "object" && "type" in d) {
    const t = (d as { type: unknown }).type;
    return typeof t === "string" ? t : null;
  }
  return null;
}

// 실제로 상품이 그려졌다는 메시지인가 (adLoaded는 빈 배너에서도 오므로 제외)
export function isDisplayedMessage(data: unknown): boolean {
  const t = messageType(data);
  return t === "adOnePixelDisplayed" || t === "adDisplayed";
}

export function coupangHomeUrl(subId: string): string {
  return `https://link.coupang.com/re/AFFHOMEWW?lptag=${TRACKING_CODE}&subid=${encodeURIComponent(subId)}`;
}

// 대체 링크: 진행 중인 시즌 추천(있으면) + 쿠팡 홈
export function fallbackLinks(subId: string, now: Date): { key: string; label: string; url: string }[] {
  const season = activeSeason(now);
  return [
    ...(season?.links ?? []),
    { key: "home", label: "쿠팡 오늘의 특가 보기", url: coupangHomeUrl(subId) },
  ];
}

const noopSubscribe = () => () => {};

export default function CoupangBanner({ subId, tone = "light" }: { subId: string; tone?: "light" | "dark" }) {
  const src = `https://ads-partners.coupang.com/widgets.html?id=${COUPANG_WIDGET_ID}&template=carousel&trackingCode=${TRACKING_CODE}&subId=${subId}&width=${WIDTH}&height=${HEIGHT}&tsource=`;
  const dark = tone === "dark";
  const muted = dark ? "text-stone-400" : "text-muted";
  const boxRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [mode, setMode] = useState<"widget" | "links">("widget");
  const [links, setLinks] = useState<{ key: string; label: string; url: string }[]>([]);
  // 서버가 그려 준 iframe은 하이드레이션 전에 이미 노출 메시지를 보냈을 수 있다(그 메시지는 놓친다).
  // 그러면 정상 배너를 빈 배너로 오해하므로, 하이드레이션이 끝나면 iframe을 새로 만들어 리스너가 붙은 뒤에 로드되게 한다.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  // 타이머 효과를 다시 돌리는 조건(화면에 보임 / 노출 확인)
  const [seen, setSeen] = useState(false);
  const [displayed, setDisplayed] = useState(false);
  // 콜백 안에서 최신 값을 보는 용도 + GA를 한 번만 보내는 표시
  const displayedRef = useRef(false);
  const viewSentRef = useRef(false);

  // 화면에 절반 이상 보이면 seen
  useEffect(() => {
    const box = boxRef.current;
    if (!box || !("IntersectionObserver" in window)) {
      const t = setTimeout(() => setSeen(true), 0); // 옵저버가 없는 환경은 바로 본 것으로 친다
      return () => clearTimeout(t);
    }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setSeen(true); io.disconnect(); }
    }, { threshold: 0.5 });
    io.observe(box);
    return () => io.disconnect();
  }, []);

  // 위젯이 보내는 메시지: 우리 iframe에서 온 것만 믿는다
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (!frameRef.current || e.source !== frameRef.current.contentWindow) return;
      if (!isDisplayedMessage(e.data) || displayedRef.current) return;
      displayedRef.current = true;
      setDisplayed(true);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [subId]);

  // 위젯이 실제로 떴고 화면에도 보였을 때 한 번만 widget 노출 기록 (화면 밖에서 미리 뜬 배너는 보이는 순간에 센다)
  useEffect(() => {
    if (!seen || !displayed || viewSentRef.current) return;
    viewSentRef.current = true;
    track("coupang_banner_view", { slot: gaSlot(subId), keyword: "widget" });
  }, [seen, displayed, subId]);

  // 화면에 보였는데 노출 메시지가 없으면 일정 시간 뒤 링크로 대체
  useEffect(() => {
    if (!seen || displayed || mode !== "widget") return;
    const slot = gaSlot(subId);
    const timer = setTimeout(() => {
      if (displayedRef.current) return;
      viewSentRef.current = true;
      setLinks(fallbackLinks(subId, new Date()));
      setMode("links");
      track("coupang_banner_view", { slot, keyword: "links" });
    }, FALLBACK_DELAY_MS);
    return () => clearTimeout(timer);
  }, [seen, displayed, mode, subId]);

  // 위젯 iframe 클릭 감지 (links 모드에는 iframe이 없어 일어나지 않음)
  useEffect(() => {
    const slot = gaSlot(subId);
    const onBlur = () => {
      setTimeout(() => {
        if (frameRef.current && document.activeElement === frameRef.current) track("coupang_click", { slot, keyword: "banner" });
      }, 0);
    };
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, [subId]);

  const linkClass = dark
    ? "h-10 px-4 rounded-full bg-white/10 border border-stone-600 text-sm text-stone-100 grid place-items-center"
    : "h-10 px-4 rounded-full bg-card border border-line text-sm grid place-items-center";

  return (
    <div ref={boxRef} className="mt-6 no-screenshot">
      <p className={`text-center text-xs mb-2 ${muted}`}>추천 상품</p>
      {mode === "widget" ? (
        <div className="flex justify-center">
          <iframe
            key={hydrated ? "client" : "server"}
            ref={frameRef}
            src={src}
            width={WIDTH}
            height={HEIGHT}
            frameBorder="0"
            scrolling="no"
            referrerPolicy="unsafe-url"
            loading="lazy"
            title="쿠팡 추천 상품"
            className="rounded-2xl max-w-full"
          />
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-2">
          {links.map((l) => (
            <a
              key={l.key}
              href={l.url}
              target="_blank"
              rel="sponsored noopener"
              className={linkClass}
              onClick={() => track("coupang_click", { slot: gaSlot(subId), keyword: l.key })}
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
      <p className={`text-center text-[10px] mt-2 ${muted}`}>
        이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
      </p>
    </div>
  );
}
