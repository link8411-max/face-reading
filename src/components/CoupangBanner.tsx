// 쿠팡 파트너스 다이나믹 배너 — "고객 관심 기반 추천" (방문자의 쿠팡 쿠키로 관심 상품을 보여줌)
// subId로 페이지별 실적을 쿠팡 파트너스 리포트에서 구분한다. 결과 이미지 캡처에서는 제외(no-screenshot, iframe 필터).
export const COUPANG_WIDGET_ID = 1043563;
const TRACKING_CODE = "AF6497036";
const WIDTH = 400;
const HEIGHT = 140;

export default function CoupangBanner({ subId, tone = "light" }: { subId: string; tone?: "light" | "dark" }) {
  const src = `https://ads-partners.coupang.com/widgets.html?id=${COUPANG_WIDGET_ID}&template=carousel&trackingCode=${TRACKING_CODE}&subId=${subId}&width=${WIDTH}&height=${HEIGHT}&tsource=`;
  const muted = tone === "dark" ? "text-stone-400" : "text-[#5C4033]/60";
  return (
    <div className="mt-6 no-screenshot">
      <p className={`text-center text-xs mb-2 ${muted}`}>추천 상품</p>
      <div className="flex justify-center">
        <iframe
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
