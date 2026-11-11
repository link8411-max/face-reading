"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";
import { track, type TestName } from "@/lib/analytics";

// 결과 화면의 공유 버튼 바로 아래에 놓는 작은 둘째 줄: 친구에게 부적 선물하기 (/bujeok 선물 모드).
// 저장 이미지에는 섞이지 않고(no-screenshot) 사진 테스트 시작 화면에는 놓지 않는다.
// GA: next_test_click(test_name=bujeok), 어느 결과에서 눌렀는지는 result_id `gift_<from>` 하나만 보낸다.
export default function GiftNudge({ from }: { from: TestName }) {
  return (
    <Link
      href="/bujeok?mode=gift"
      onClick={() => track("next_test_click", { test_name: "bujeok", result_id: `gift_${from}` })}
      className="no-screenshot mt-2 h-11 rounded-full bg-card-2 text-ink text-sm font-medium flex items-center justify-center gap-1.5"
    >
      <Icon name="spark" size={16} className="text-accent" />
      친구에게 부적 선물하기
      <Icon name="chevron" size={14} className="text-muted" />
    </Link>
  );
}
