"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics";

// 쿠팡 파트너스 다이나믹 배너 — "고객 관심 기반 추천" (방문자의 쿠팡 쿠키로 관심 상품을 보여줌)
// subId로 페이지별 실적을 쿠팡 파트너스 리포트에서 구분한다. 결과 이미지 캡처에서는 제외(no-screenshot, iframe 필터).
// GA: 화면에 보이면 coupang_banner_view(slot), 배너를 누르면 coupang_click(slot, keyword=banner).
//   배너는 다른 도메인 iframe이라 클릭을 직접 볼 수 없어서, 창의 초점이 이 iframe으로 옮겨 가는 순간을 클릭으로 본다.
export const COUPANG_WIDGET_ID = 1043563;
const TRACKING_CODE = "AF6497036";
const WIDTH = 400;
const HEIGHT = 140;

// GA 개인정보 필터(영문·숫자·밑줄)에 맞춘 위치 값: mbti-infp → mbti_infp
export function gaSlot(subId: string): string {
  return subId.replace(/[^A-Za-z0-9_]/g, "_");
}

export default function CoupangBanner({ subId, tone = "light" }: { subId: string; tone?: "light" | "dark" }) {
  const src = `https://ads-partners.coupang.com/widgets.html?id=${COUPANG_WIDGET_ID}&template=carousel&trackingCode=${TRACKING_CODE}&subId=${subId}&width=${WIDTH}&height=${HEIGHT}&tsource=`;
  const muted = tone === "dark" ? "text-stone-400" : "text-muted";
  const boxRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const slot = gaSlot(subId);
    const box = boxRef.current;
    let seen = false;
    const io = box && "IntersectionObserver" in window
      ? new IntersectionObserver((entries) => {
          if (!seen && entries.some((e) => e.isIntersecting)) {
            seen = true;
            track("coupang_banner_view", { slot });
            io?.disconnect();
          }
        }, { threshold: 0.5 })
      : null;
    if (box) io?.observe(box);
    const onBlur = () => {
      setTimeout(() => {
        if (document.activeElement === frameRef.current) track("coupang_click", { slot, keyword: "banner" });
      }, 0);
    };
    window.addEventListener("blur", onBlur);
    return () => { io?.disconnect(); window.removeEventListener("blur", onBlur); };
  }, [subId]);

  return (
    <div ref={boxRef} className="mt-6 no-screenshot">
      <p className={`text-center text-xs mb-2 ${muted}`}>추천 상품</p>
      <div className="flex justify-center">
        <iframe
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
      <p className={`text-center text-[10px] mt-2 ${muted}`}>
        이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
      </p>
    </div>
  );
}
