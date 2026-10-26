"use client";

import { useRouter } from "next/navigation";
import { canGoBackInApp } from "@/lib/navHistory";

// "돌아가기": 사이트 안에서 이동해 왔으면 뒤로, 검색 등 외부에서 바로 들어왔으면 홈으로.
// router.back()만 쓰면 검색 결과로 튕겨 나가거나 새 탭에서는 아무 반응이 없다.
export function useBackOrHome(): () => void {
  const router = useRouter();
  return () => (canGoBackInApp() ? router.back() : router.push("/"));
}
