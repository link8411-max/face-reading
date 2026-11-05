"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { track } from "@/lib/analytics";
import type { DailyFortune } from "@/lib/dailyEngine";
import { getSubscription, pushUiState, readPushEnv, readStoredGanji, subscribe, unsubscribe, type PushUiState } from "@/lib/push/client";

const PILL = "h-12 rounded-full bg-white border border-line text-sm font-medium flex items-center justify-center gap-1.5 w-full disabled:opacity-50";

export default function PushToggle({ fortune }: { fortune: DailyFortune | null }) {
  const ganji = fortune?.나.년주표기 ?? null;
  const [state, setState] = useState<PushUiState | null>(null);
  const [stored, setStored] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!ganji) return;
    let alive = true;
    (async () => {
      // 안내 상태(kakao·ios_install·denied·unsupported)는 서비스워커를 기다리지 않고 먼저 정한다
      const s = pushUiState(readPushEnv(false));
      if (!alive) return;
      setState(s);
      if (s === "ios_install" || s === "kakao") track("push_blocked", { test_name: "daily", result_id: s });
      if (s !== "off") return;
      // SW 설치가 실패하면 ready가 영영 안 끝날 수 있어 3초만 기다린다
      const sub = await Promise.race([getSubscription(), new Promise<null>((r) => setTimeout(() => r(null), 3000))]);
      if (!alive || !sub) return;
      const saved = await readStoredGanji();
      if (!alive) return;
      setStored(saved);
      setState("on");
    })();
    return () => { alive = false; };
  }, [ganji]);

  if (!fortune || !ganji) return null;
  if (state === null || state === "unsupported") return <div className="no-screenshot" />;

  const onClick = async () => {
    if (busy) return;
    setBusy(true);
    setNotice("");
    try {
      if (state === "on" && stored === ganji) {
        await unsubscribe();
        track("push_unsubscribe", { test_name: "daily" });
        setState("off");
        setStored(null);
        return;
      }
      const r = await subscribe(ganji);
      if (r === "ok") {
        track("push_subscribe", { test_name: "daily", result_id: ganji });
        setState("on");
        setStored(ganji);
        setNotice("알림을 켰어요. 내일 아침 8시 30분에 처음 와요");
      } else if (r === "denied") {
        track("push_blocked", { test_name: "daily", result_id: "denied" });
        setState(typeof Notification !== "undefined" && Notification.permission === "denied" ? "denied" : state);
      } else {
        track("push_blocked", { test_name: "daily", result_id: "server" });
        // 이미 켜 둔 상태(on)면 그대로 두고 안내만 보인다
        setNotice("지금은 등록이 안 돼요. 잠시 뒤 다시 눌러 주세요");
      }
    } finally {
      setBusy(false);
    }
  };

  const openExternal = () => {
    const target = `${window.location.origin}/fortune/daily?gz=${encodeURIComponent(ganji)}`;
    window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(target)}`;
  };

  return (
    <div className="no-screenshot mt-2">
      {state === "kakao" && (
        <div className="text-center">
          <p className="text-xs text-muted mb-2">카카오톡 안에서는 알림을 켤 수 없어요.</p>
          <button onClick={openExternal} className={PILL}>다른 브라우저로 열기</button>
        </div>
      )}
      {state === "ios_install" && (
        <p className="text-xs text-muted text-center">
          아이폰은 홈 화면에 추가한 앱에서만 알림을 받을 수 있어요. 공유 버튼 → 홈 화면에 추가 → 홈 화면의 &apos;운명을읽다&apos;를 열어 오늘의 운세에서 생년을 넣고 이 버튼을 눌러 주세요.
        </p>
      )}
      {state === "denied" && (
        <p className="text-xs text-muted text-center">알림이 차단돼 있어요. 브라우저 설정에서 unse-ai.com 알림을 허용하면 받을 수 있어요.</p>
      )}
      {state === "off" && (
        <button onClick={onClick} disabled={busy} className={PILL}>
          <Icon name="bell" size={16} />
          매일 아침 8시 30분, 오늘 운세 받기
        </button>
      )}
      {state === "on" && (
        <>
          <button onClick={onClick} disabled={busy} className={PILL}>
            <Icon name="bell" size={16} />
            {stored === ganji ? "아침 운세 알림 끄기" : "이 년주로 바꿔 받기"}
          </button>
          {stored === ganji && fortune && (
            <p className="mt-1 text-xs text-center text-muted">{ganji}년 {fortune.나.띠}띠로 받고 있어요</p>
          )}
        </>
      )}
      {notice && <p role="status" className="mt-2 text-xs text-center text-muted">{notice}</p>}
    </div>
  );
}
