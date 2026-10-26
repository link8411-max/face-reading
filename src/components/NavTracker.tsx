"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { recordPathVisit } from "@/lib/navHistory";

// 경로가 바뀔 때마다 기록해서 useBackOrHome이 뒤로 갈 수 있는지 판단하게 한다
export default function NavTracker() {
  const pathname = usePathname();
  useEffect(() => {
    recordPathVisit();
  }, [pathname]);
  return null;
}
