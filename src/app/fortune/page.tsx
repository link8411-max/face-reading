import FortuneClient from "./FortuneClient";
import PageGuide from "@/components/PageGuide";

// 가이드를 layout에 두면 /fortune/daily에도 중첩되므로 page에서 렌더
export default function FortunePage() {
  return (
    <>
      <FortuneClient />
      <PageGuide route="/fortune" />
    </>
  );
}
