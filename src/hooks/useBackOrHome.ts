"use client";

import { useRouter } from "next/navigation";

// "돌아가기": 테스트 페이지의 상위 페이지는 모두 홈이므로 항상 홈으로 간다.
// router.back()은 검색에서 바로 들어왔거나 브라우저 뒤로를 섞어 쓰면 사이트 밖(검색 결과)으로 나갈 수 있다.
export function useBackOrHome(): () => void {
  const router = useRouter();
  return () => router.push("/");
}
