"use client";

import { useEffect } from "react";
import { track, type TestName } from "@/lib/analytics";
import type { ShareKind } from "@/lib/shareLinks";

const TEST: Record<ShareKind, TestName> = { animal: "animal", samguk: "samguk", face: "face" };

// 공유 링크로 들어온 방문을 GA에서 구분한다 (utm 외에 이벤트로도)
export default function SharedLandingTracker({ kind, resultId }: { kind: ShareKind; resultId: string }) {
  useEffect(() => { track("shared_landing", { test_name: TEST[kind], result_id: resultId }); }, [kind, resultId]);
  return null;
}
