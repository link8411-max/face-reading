"use client";

import "./duel.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createDuelGame, DuelBridge, type BattleFocusId, type SceneName, type UiAction } from "@/game/duel/createDuelGame";
import { eventsToTimeline, timelineLength, type Side } from "@/game/duel/timeline";
import { createRng, type Rng } from "@/lib/duel/rng";
import { pickReward, playerTurn, startRun } from "@/lib/duel/run";
import { getReward } from "@/lib/duel/rewards";
import { getDuelGeneral, STARTER_IDS } from "@/lib/duel/generals";
import { defaultSave, loadSave, recordRunEnd, writeSave } from "@/lib/duel/save";
import { narrate } from "@/lib/duel/narrative";
import { encodeRunKey } from "@/lib/duel/shareKey";
import { duelShareUrl, ogImageUrl } from "@/lib/shareLinks";
import type { RunRecord, RunState, SaveData } from "@/lib/duel/types";
import { track } from "@/lib/analytics";
import { useResultShare } from "@/hooks/useResultShare";
import CoupangBanner from "@/components/CoupangBanner";
import FeedbackForm from "./FeedbackForm";
import OverlayButtons, { type OverlayButton } from "./OverlayButtons";
import { overlayLayout, resolveStarterUnlock, stageSize } from "./clientLogic";
import {
  nextSwitchIndex,
  pendingRecruit,
  pickView,
  recruitView,
  resolveRecruitPick,
  toBattleView,
  toResultShow,
  toRewardShow,
  toStartShow,
  type PendingPick,
} from "./view";

/** Phaser 타입을 직접 import하지 않고 게임 핸들 타입만 받는다 */
type DuelGame = Awaited<ReturnType<typeof createDuelGame>>;
const BATTLE_ROWS: BattleFocusId[] = ["skill0", "skill1", "skill2", "skill3", "switch"];

const FONT_WAIT_MS = 1500;
/** anim:done이 오지 않을 때(장면이 없을 때) 입력을 다시 여는 여유 시간 */
const ANIM_GRACE_MS = 3000;

const storage = (): Storage | null => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const nameOf = (id: string) => getDuelGeneral(id)?.name ?? id;

/** 쿼리의 시드(숫자만), 없으면 무작위 */
function seedFrom(param: string | null): number {
  if (param && /^\d{1,10}$/.test(param)) return Number(param) >>> 0;
  return (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
}

export default function DuelClient() {
  const router = useRouter();
  const hostRef = useRef<HTMLDivElement>(null);
  /** 캔버스 무대를 담는 바깥 칸(폭을 재서 정수 배율 무대 크기를 정한다) */
  const outerRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<{ w: number; h: number; left: number } | null>(null);
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const measure = () => {
      const dpr = window.devicePixelRatio || 1;
      const { w, h } = stageSize(el.clientWidth, dpr);
      // 가운데 정렬도 기기 화소 경계에 맞춘다(반 화소 어긋나면 도트가 번진다)
      const left = Math.floor(((el.clientWidth - w) / 2) * dpr) / dpr;
      setStage((old) => (old && old.w === w && old.h === h && old.left === left ? old : { w, h, left }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  /** 만들어진 게임(무대 크기가 바뀌면 Phaser에 다시 재라고 알린다) */
  const gameRef = useRef<DuelGame | null>(null);
  useEffect(() => {
    // Phaser는 창 resize 때만 부모 크기를 다시 잰다 → React가 무대 크기를 바꾼 뒤 직접 알린다
    gameRef.current?.scale.refresh();
  }, [stage]);
  const [bridge] = useState(() => new DuelBridge());
  const rngRef = useRef<Rng>(createRng(1));
  const sidesRef = useRef<{ player: Side }>({ player: "left" });
  const seedParamRef = useRef<string | null>(null);

  const [save, setSave] = useState<SaveData>(defaultSave);
  const [run, setRun] = useState<RunState | null>(null);
  const [screen, setScreen] = useState<SceneName>("start");
  const [readyScene, setReadyScene] = useState<SceneName | null>(null);
  const [animating, setAnimating] = useState(false);
  const [selected, setSelected] = useState<string>(STARTER_IDS[0]);
  const [pick, setPick] = useState<PendingPick | null>(null);
  /** 전투 메뉴 커서 줄, 그리고 그 줄을 눌러 결정을 기다리는지 */
  const [battleSel, setBattleSel] = useState<BattleFocusId>("skill0");
  const [pending, setPending] = useState(false);
  /** turn()의 안전 타이머(언마운트 때 지운다) */
  const turnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [record, setRecord] = useState<RunRecord | null>(null);
  const [stars, setStars] = useState(0);
  const [booted, setBooted] = useState(false);
  /** 첫 장면이 그려졌는지(그전에는 불러오는 중 문구) */
  const [painted, setPainted] = useState(false);

  // ── 저장 ──
  const persist = useCallback((data: SaveData) => {
    writeSave(storage(), data);
    setSave(data);
  }, []);

  // ── 장면 보이기 ──
  const go = useCallback((scene: SceneName) => {
    setScreen(scene);
    setReadyScene(null);
    bridge.emit("scene:go", { scene });
  }, [bridge]);

  const showStart = useCallback((data: SaveData, sel: string) => {
    bridge.emit("start:show", toStartShow(data, sel));
  }, [bridge]);

  const showBattle = useCallback((r: RunState) => {
    const view = toBattleView(r);
    bridge.emit("run:update", { run: r, ...(view ? { view } : {}) });
    go("battle");
  }, [bridge, go]);

  const showReward = useCallback((r: RunState, p: PendingPick | null, restart: boolean) => {
    bridge.emit("reward:show", toRewardShow(r, pickView(r, p), recruitView(r, p)));
    if (restart) go("reward");
  }, [bridge, go]);

  const finishRun = useCallback((r: RunState, data: SaveData) => {
    const next = recordRunEnd(data, r.record);
    persist(next);
    setRecord(r.record);
    setStars(0);
    track("result_view", { test_name: "duel", result_id: r.record.starter });
    bridge.emit("result:show", { ...toResultShow(r.record, next), stars: 0 });
    go("result");
  }, [bridge, go, persist]);

  const enterReward = useCallback((r: RunState) => {
    const rec = pendingRecruit(r);
    const p: PendingPick | null = rec ? { kind: "recruit", recruitId: rec.id, full: rec.full } : null;
    setPick(p);
    showReward(r, p, true);
  }, [showReward]);

  // ── 처음: 저장 읽기, ?seed·?me, 글꼴, 게임 만들기 ──
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    seedParamRef.current = q.get("seed");
    const me = q.get("me");
    let data = loadSave(storage());
    const roster = resolveStarterUnlock(me, data.roster);
    if (roster !== data.roster) {
      data = { ...data, roster };
      writeSave(storage(), data);
    }
    setSave(data);
    const sel = me && roster.includes(me) ? me : data.history[0]?.starter && roster.includes(data.history[0].starter) ? data.history[0].starter : STARTER_IDS[0];
    setSelected(sel);

    // 늘 시작 화면(장수 고르기)부터. 진행 중 판이 있으면 시작 화면에 "이어하기"가 생긴다
    showStart(data, sel);
    go("start");
    // 마운트 때 한 번만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let game: DuelGame | null = null;
    const fontsReady = (async () => {
      try {
        const loads = Promise.allSettled([
          document.fonts.load("9px Galmuri9", "가"),
          document.fonts.load("bold 11px Galmuri11", "가"),
          document.fonts.load("11px Galmuri11", "가"),
          document.fonts.load("7px Galmuri7", "가"),
        ]);
        await Promise.race([loads, new Promise((r) => setTimeout(r, FONT_WAIT_MS))]);
      } catch {
        // 글꼴을 못 받아도 진행
      }
    })();
    void fontsReady.then(async () => {
      if (cancelled) return;
      const g = await createDuelGame(host, bridge);
      if (cancelled) g.destroy(true);
      else {
        game = g;
        gameRef.current = g;
        g.scale.refresh();
        setBooted(true);
      }
    });
    return () => {
      cancelled = true;
      if (gameRef.current === game) gameRef.current = null;
      game?.destroy(true);
      game = null;
    };
  }, [bridge]);

  // 장면이 뜨면 그 장면의 버튼을 연다
  useEffect(() => {
    const onChanged = ({ scene }: { scene: SceneName }) => {
      setReadyScene(scene);
      setPainted(true);
    };
    bridge.on("scene:changed", onChanged);
    return () => { bridge.off("scene:changed", onChanged); };
  }, [bridge]);

  // 언마운트 때 남은 턴 안전 타이머를 지운다
  useEffect(() => () => {
    if (turnTimerRef.current) clearTimeout(turnTimerRef.current);
  }, []);

  // ── 공유 ──
  const shareMeta = useMemo(() => {
    if (!record) return null;
    const { headline } = narrate(record);
    return { testName: "duel" as const, title: headline, text: headline, url: duelShareUrl(record), imageUrl: ogImageUrl("duel", encodeRunKey(record)) };
  }, [record]);
  const { busy, notice, share } = useResultShare(shareMeta);

  // ── 입력 처리(규칙은 전부 여기서) ──
  const turn = useCallback((r: RunState, action: Parameters<typeof playerTurn>[1]) => {
    const next = playerTurn(r, action, rngRef.current);
    const timeline = eventsToTimeline(next.lastEvents ?? [], sidesRef.current);
    const view = toBattleView(next);
    setAnimating(true);
    let done = false;
    const finish = (sides?: { player: Side }) => {
      if (done) return;
      done = true;
      bridge.off("anim:done", onDone);
      if (turnTimerRef.current) clearTimeout(turnTimerRef.current);
      turnTimerRef.current = null;
      if (sides) sidesRef.current = sides;
      setRun(next);
      setAnimating(false);
      bridge.emit("run:update", { run: next });
      if (next.phase === "won" || next.phase === "lost") {
        finishRun(next, save);
        return;
      }
      persist({ ...save, current: next });
      if (next.phase === "reward") enterReward(next);
    };
    const onDone = ({ sides }: { sides: { player: Side } }) => finish(sides);
    bridge.on("anim:done", onDone);
    turnTimerRef.current = setTimeout(() => finish(), timelineLength(timeline) + ANIM_GRACE_MS);
    bridge.emit("anim:play", { timeline, sides: sidesRef.current, ...(view ? { view } : {}) });
  }, [bridge, enterReward, finishRun, persist, save]);

  const startNewRun = useCallback(() => {
    const seed = seedFrom(seedParamRef.current);
    const r = startRun(selected, seed);
    rngRef.current = createRng(seed);
    sidesRef.current = { player: "left" };
    track("test_start", { test_name: "duel" });
    setRun(r);
    setRecord(null);
    persist({ ...save, current: r });
    showBattle(r);
  }, [persist, save, selected, showBattle]);

  const applyReward = useCallback((r: RunState, rewardId: string, target?: number) => {
    const next = pickReward(r, rewardId, rngRef.current, target);
    setPick(null);
    setRun(next);
    persist({ ...save, current: next });
    showBattle(next);
  }, [persist, save, showBattle]);

  /** 별점: 캔버스 별 줄과 아래 폼이 같은 값 */
  const rate = useCallback((n: number) => {
    setStars(n);
    const shown = bridge.shown.result;
    if (shown) bridge.emit("result:show", { ...shown, stars: n });
  }, [bridge]);

  const handle = useCallback((a: UiAction) => {
    switch (a.type) {
      case "select": {
        if (!save.roster.includes(a.starterId)) return;
        setSelected(a.starterId);
        showStart(save, a.starterId);
        return;
      }
      case "sortie":
        startNewRun();
        return;
      case "resume": {
        const cur = save.current;
        if (!cur || (cur.phase !== "battle" && cur.phase !== "reward")) return;
        // 같은 시드에서 이어 가되, 지난 턴 수만큼 난수를 비켜 간다
        const turns = cur.record.waves.reduce((n, w) => n + w.turns, 0);
        rngRef.current = createRng((cur.seed + turns * 7919) >>> 0);
        sidesRef.current = { player: "left" };
        setRun(cur);
        if (cur.phase === "battle") showBattle(cur);
        else enterReward(cur);
        return;
      }
      case "skill":
      case "switch":
        if (run?.phase === "battle") turn(run, a);
        return;
      case "reward": {
        if (!run || run.phase !== "reward") return;
        const targets = getReward(a.rewardId).targets?.(run);
        if (targets && targets.length > 1) {
          const p: PendingPick = { kind: "target", rewardId: a.rewardId, targets };
          setPick(p);
          showReward(run, p, false);
        } else applyReward(run, a.rewardId, targets?.[0]);
        return;
      }
      case "pick": {
        if (!run || !pick) return;
        if (pick.kind === "recruit") {
          // 교체·거절·합류 확인 모두 "처리함" 표시를 남겨 이어하기 때 창이 다시 뜨지 않게 한다
          const next = resolveRecruitPick(run, pick, a.index, rngRef.current);
          setPick(null);
          setRun(next);
          persist({ ...save, current: next });
          // 항복 창을 닫으면 카드가 뒤집힌다 → 다 뒤집혀 장면이 다시 알릴 때까지 입력을 막는다
          setReadyScene(null);
          showReward(next, null, false);
        } else if (a.index < pick.targets.length) {
          applyReward(run, pick.rewardId, pick.targets[a.index]);
        } else {
          setPick(null);
          showReward(run, null, false);
        }
        return;
      }
      case "result":
        if (a.action === "share") void share();
        else if (a.action === "samguk") router.push("/samguk");
        else {
          setRecord(null);
          setRun(null);
          showStart(save, selected);
          go("start");
        }
        return;
      case "rate":
        rate(a.stars);
        return;
    }
  }, [applyReward, enterReward, go, persist, pick, rate, router, run, save, selected, share, showBattle, showReward, showStart, startNewRun, turn]);

  // 다리의 ui:action → handle (투명 버튼이 보낸다)
  const handleRef = useRef(handle);
  useEffect(() => { handleRef.current = handle; }, [handle]);
  useEffect(() => {
    const on = (a: UiAction) => handleRef.current(a);
    bridge.on("ui:action", on);
    return () => { bridge.off("ui:action", on); };
  }, [bridge]);

  // ── 전투 메뉴: 줄의 이름과 실행할 행동 ──
  const rowInfo = useCallback((id: BattleFocusId): { label: string; action: UiAction | null } => {
    if (!run?.battle) return { label: "", action: null };
    if (id === "switch") {
      const to = nextSwitchIndex(run);
      return to === null
        ? { label: "교체할 장수 없음", action: null }
        : { label: `${nameOf(run.battle.party[to].id)}(으)로 교체`, action: { type: "switch", toIndex: to } };
    }
    const sk = toBattleView(run)?.player.skills[Number(id.slice(5))];
    if (!sk) return { label: "", action: null };
    const uses = sk.usesLeft === null ? "무제한" : `남은 ${sk.usesLeft}회`;
    return { label: `${sk.name} ${uses}`, action: sk.usesLeft === 0 ? null : { type: "skill", skillId: sk.id } };
  }, [run]);
  const battleChoice = useMemo(() => (screen === "battle" ? rowInfo(battleSel) : null), [battleSel, rowInfo, screen]);

  /** 줄 고르기: 커서를 옮기고(pend면) 결정을 기다린다 */
  const selectRow = useCallback((id: BattleFocusId, pend: boolean) => {
    setBattleSel(id);
    if (pend) setPending(true);
    bridge.emit("ui:focus", { id });
  }, [bridge]);

  /** 결정: 고른 줄의 행동을 실행한다 */
  const confirmBattle = useCallback(() => {
    const act = rowInfo(battleSel).action;
    if (!act) return;
    setPending(false);
    bridge.emit("ui:action", act);
  }, [battleSel, bridge, rowInfo]);

  // 대사창 안내 줄: 결정 대기 중이면 "▶ 일격" / "탭하여 결정" 두 줄
  useEffect(() => {
    const name = battleChoice?.label.replace(/ (무제한|남은 \d+회)$/, "") ?? "";
    const text = screen === "battle" && pending && !animating && battleChoice?.action ? `▶ ${name}\n탭하여 결정` : null;
    bridge.emit("battle:prompt", { text });
  }, [animating, battleChoice, bridge, pending, screen]);

  // 새 싸움(웨이브)이 열리면 커서를 첫 줄로, 결정 대기는 끈다
  const battleKey = run?.battle ? `${run.wave}` : "";
  useEffect(() => {
    setBattleSel("skill0");
    setPending(false);
  }, [battleKey]);

  /** 전투 키보드: 위아래 화살표로 커서, Enter/Space로 결정 */
  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (screen !== "battle" || !booted || animating || readyScene !== "battle") return;
    const i = BATTLE_ROWS.indexOf(battleSel);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const n = BATTLE_ROWS.length;
      selectRow(BATTLE_ROWS[(i + (e.key === "ArrowDown" ? 1 : n - 1)) % n], true);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      confirmBattle();
    }
  }, [animating, battleSel, booted, confirmBattle, readyScene, screen, selectRow]);

  // ── 지금 화면의 투명 버튼 ──
  const startShow = useMemo(() => toStartShow(save, selected), [save, selected]);
  const buttons: OverlayButton[] = useMemo(() => {
    if (screen === "start") {
      const res = startShow.resume;
      return overlayLayout("start", startShow.roster.length, !!res).map((s, i) => {
        if (s.id === "sortie") return { ...s, label: `${nameOf(selected)}와 함께 ${res ? "새로 " : ""}출진` };
        if (s.id === "resume") return { ...s, label: `이어하기: ${res!.name} 제${res!.wave}전` };
        const g = startShow.roster[i];
        return { ...s, label: g.locked ? `${g.name} 잠김` : `${g.name} ${g.kind}${g.id === selected ? " 선택됨" : ""}`, disabled: g.locked };
      });
    }
    if (screen === "battle") {
      // 고르기 → 결정: 줄은 커서만 옮기고(작아도 됨), 실행은 대사창 위의 큰 "결정" 단추
      const choice = battleChoice;
      return overlayLayout("battle").map((s) => {
        if (s.id === "confirm") {
          return { ...s, label: choice && pending ? `결정: ${choice.label}` : "먼저 메뉴에서 명령을 고르세요", disabled: !pending || !choice?.action };
        }
        const row = rowInfo(s.id as BattleFocusId);
        return { ...s, label: `${row.label}${row.action ? "" : " (쓸 수 없음)"} 고르기`, pressed: battleSel === s.id };
      });
    }
    if (screen === "reward") {
      if (run && pick) {
        const pv = pickView(run, pick)!;
        return overlayLayout(pick.kind === "recruit" ? "recruit" : "pick", pv.options.length).map((s, i) => ({ ...s, label: pv.options[i].label }));
      }
      const cards = run?.rewardsOffered ?? [];
      return overlayLayout("reward").slice(0, cards.length).map((s, i) => {
        const r = getReward(cards[i]);
        return { ...s, label: `${r.rarity === "rare" ? "희귀" : "보통"} ${r.name}: ${r.desc}` };
      });
    }
    return overlayLayout("result");
  }, [battleChoice, battleSel, pending, pick, rowInfo, run, screen, selected, startShow]);

  const onAction = useCallback((id: string) => {
    let a: UiAction | null = null;
    if (screen === "start") {
      if (id === "sortie") a = { type: "sortie" };
      else if (id === "resume") a = { type: "resume" };
      else a = { type: "select", starterId: startShow.roster[Number(id.slice(7))]?.id ?? "" };
    } else if (screen === "battle" && run?.battle) {
      if (id === "confirm") {
        if (pending) confirmBattle();
      } else selectRow(id as BattleFocusId, true);
    } else if (screen === "reward") {
      if (id.startsWith("opt")) a = { type: "pick", index: Number(id.slice(3)) };
      else if (run) {
        const rid = run.rewardsOffered[Number(id.slice(4))];
        if (rid) a = { type: "reward", rewardId: rid };
      }
    } else if (screen === "result") {
      if (id.startsWith("star")) a = { type: "rate", stars: Number(id.slice(4)) };
      else a = { type: "result", action: id as "share" | "retry" | "samguk" };
    }
    if (a) bridge.emit("ui:action", a);
  }, [bridge, confirmBattle, pending, run, screen, selectRow, startShow]);

  const onFocus = useCallback((id: string) => {
    if (screen === "battle") {
      // Tab으로 줄에 오면 커서만 옮긴다(결정은 Enter/Space 또는 결정 단추)
      if ((BATTLE_ROWS as string[]).includes(id)) selectRow(id as BattleFocusId, false);
      return;
    }
    bridge.emit("ui:focus", { id });
  }, [bridge, screen, selectRow]);

  const locked = !booted || animating || readyScene !== screen;

  return (
    <div>
      {/* 무대는 기기 화소 정수 배율(320×z)로 맞춰 도트가 번지지 않게 한다. 투명 버튼도 무대 안에 둔다 */}
      <div ref={outerRef} className="w-full max-w-[480px] mx-auto">
        <div
          className="relative overflow-hidden rounded-sm bg-ink"
          style={stage ? { width: stage.w, height: stage.h, marginLeft: stage.left } : { width: "100%", aspectRatio: "4 / 3" }}
        >
          <div ref={hostRef} className="absolute inset-0 [&_canvas]:[image-rendering:pixelated]" aria-hidden />
          <OverlayButtons buttons={buttons} disabled={locked} onFocus={onFocus} onAction={onAction} onKeyDown={onKeyDown} hover={screen !== "battle"} />
          {!painted && <p className="absolute inset-0 grid place-items-center text-sm text-paper bg-ink">불러오는 중…</p>}
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {screen === "battle" && run ? toBattleView(run)?.message.join(" ") : ""}
      </p>
      {screen === "result" && record && (
        <div className="mt-4 flex flex-col gap-3">
          {notice && <p role="status" className="text-xs text-center text-muted">{notice}</p>}
          {busy && <p role="status" className="text-xs text-center text-muted">공유 준비 중…</p>}
          {stars > 0 && (
            // 판마다 한 번: 키는 판(선두·싸움 수·클리어·행군 기록 수), 별점은 캔버스와 폼이 같은 값을 쓴다
            <FeedbackForm
              key={`${record.starter}.${record.waves.length}.${record.cleared ? "c" : "l"}.${save.history.length}`}
              wave={record.waves.length}
              starter={record.starter}
              cleared={record.cleared}
              rating={stars}
              onRate={rate}
            />
          )}
          <CoupangBanner subId="samguk-duel" />
        </div>
      )}
    </div>
  );
}
