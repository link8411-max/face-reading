"use client";

import { usePathname } from "next/navigation";

// 주어진 경로 아래에서는 children을 그리지 않는다. 상위 layout이 붙인 안내문을 하위 페이지에서 빼는 용도
// (children은 서버에서 렌더된 요소라 그 외 경로에서는 그대로 HTML에 남는다)
export default function HideOnPaths({ prefixes, children }: { prefixes: string[]; children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  if (prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"))) return null;
  return <>{children}</>;
}
