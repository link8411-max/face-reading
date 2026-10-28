"use client";

import "./duel.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type * as Phaser from "phaser";
import { createDuelGame, DuelBridge, type PickView, type RecruitView, type SceneName, type UiAction } from "@/game/duel/createDuelGame";
import { eventsToTimeline, timelineLength, type Side } from "@/game/duel/timeline";
import { createRng, type Rng } from "@/lib/duel/rng";
import { pickReward, playerTurn, startRun, swapInRecruit } from "@/lib/duel/run";
import { getReward } from "@/lib/duel/rewards";
import { getDuelGeneral, STARTER_IDS } from "@/lib/duel/generals";
import { defaultSave, loadSave, recordRunEnd, writeSave } from "@/lib/duel/save";
import { narrate } from "@/lib/duel/narrative";
import { encodeRunKey } from "@/lib/duel/shareKey";
import { duelShareUrl, josa, ogImageUrl } from "@/lib/shareLinks";
import type { RunRecord, RunState, SaveData } from "@/lib/duel/types";
import { track } from "@/lib/analytics";
import { useResultShare } from "@/hooks/useResultShare";
import CoupangBanner from "@/components/CoupangBanner";
import FeedbackForm from "./FeedbackForm";
import OverlayButtons, { type OverlayButton } from "./OverlayButtons";
import { overlayLayout, resolveStarterUnlock } from "./clientLogic";
import { nextSwitchIndex, toBattleView, toResultShow, toRewardShow, toStartShow } from "./view";

const FONT_WAIT_MS = 1500;
/** anim:done이 오지 않을 때(장면이 없을 때) 입력을 다시 여는 여유 시간 */
const ANIM_GRACE_MS = 3000;

/** 고르기 창 상태: 항복한 장수와 바꿀 자리, 또는 보상 대상 */
type Pick = { kind: "recruit"; recruitId: string; full: boolean } | { kind: "target"; rewardId: string; targets: number[] };

const storage = (): Storage | null => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const nameOf = (id: string) => getDuelGeneral(id)?.name ?? id;

/** 이번 싸움에서 항복한 장수(합류했으면 full=false, 자리가 없어 못 들어왔으면 full=true) */
function pendingRecruit(run: RunState): { id: string; full: boolean } | null {
  const w = run.record.waves[run.record.waves.length - 1];
  if (!w?.recruited) return null;
  return { id: w.enemy, full: !run.party.some((f) => f.id === w.enemy) };
}

/** 항복 창 값 */
function recruitView(run: RunState, pick: Pick | null): RecruitView | undefined {
  if (pick?.kind !== "recruit") return undefined;
  const g = getDuelGeneral(pick.recruitId)!;
  const level = run.enemy?.id === pick.recruitId ? run.enemy.level : run.wave;
  return {
    title: `${josa(g.name, "이", "가")} 항복했다!`,
    note: pick.full ? "동행이 가득 찼다. 누구를 보낼까?" : `${josa(g.name, "이", "가")} 동행에 합류했다.`,
    id: g.id,
    name: g.name,
    kind: g.kind,
    level,
    party: run.party.map((f) => ({ id: f.id, name: nameOf(f.id) })),
    slots: run.partyMax,
    full: pick.full,
  };
}

function pickView(run: RunState, pick: Pick | null): PickView | undefined {
  if (!pick) return undefined;
  const hpSub = (i: number) => {
    const f = run.party[i];
    return f.hp <= 0 ? "전사" : `${f.hp}/${f.maxHp}`;
  };
  if (pick.kind === "recruit") {
    if (!pick.full) return { title: "", options: [{ label: "함께 간다" }] };
    return {
      title: "",
      options: [
        ...run.party.map((f, i) => ({ label: `${nameOf(f.id)} 보내기`, sub: `Lv${f.level} ${hpSub(i)}` })),
        { label: "데려가지 않는다" },
      ],
    };
  }
  return {
    title: `${getReward(pick.rewardId).name}: 누구에게 줄까?`,
    options: [
      ...pick.targets.map((i) => ({ label: nameOf(run.party[i].id), sub: `Lv${run.party[i].level} ${hpSub(i)}` })),
      { label: "다른 보상 고르기" },
    ],
  };
}

/** 쿼리의 시드(숫자만), 없으면 무작위 */
function seedFrom(param: string | null): number {
  if (param && /^\d{1,10}$/.test(param)) return Number(param) >>> 0;
  return (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
}

export default function DuelClient() {
  const router = useRouter();
  const hostRef = useRef<HTMLDivElement>(null);
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
  const [pick, setPick] = useState<Pick | null>(null);
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

  const showReward = useCallback((r: RunState, p: Pick | null, restart: boolean) => {
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
    const p: Pick | null = rec ? { kind: "recruit", recruitId: rec.id, full: rec.full } : null;
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
    let game: Phaser.Game | null = null;
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
        setBooted(true);
      }
    });
    return () => {
      cancelled = true;
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
      clearTimeout(timer);
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
    const timer = setTimeout(() => finish(), timelineLength(timeline) + ANIM_GRACE_MS);
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
          const p: Pick = { kind: "target", rewardId: a.rewardId, targets };
          setPick(p);
          showReward(run, p, false);
        } else applyReward(run, a.rewardId, targets?.[0]);
        return;
      }
      case "pick": {
        if (!run || !pick) return;
        if (pick.kind === "recruit") {
          const next = pick.full && a.index < run.party.length ? swapInRecruit(run, pick.recruitId, a.index, rngRef.current) : run;
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
      case "rate": {
        setStars(a.stars);
        const shown = bridge.shown.result;
        if (shown) bridge.emit("result:show", { ...shown, stars: a.stars });
        return;
      }
    }
  }, [applyReward, bridge, enterReward, go, persist, pick, router, run, save, selected, share, showBattle, showReward, showStart, startNewRun, turn]);

  // 다리의 ui:action → handle (투명 버튼이 보낸다)
  const handleRef = useRef(handle);
  useEffect(() => { handleRef.current = handle; }, [handle]);
  useEffect(() => {
    const on = (a: UiAction) => handleRef.current(a);
    bridge.on("ui:action", on);
    return () => { bridge.off("ui:action", on); };
  }, [bridge]);

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
      const view = run ? toBattleView(run) : null;
      const sw = run ? nextSwitchIndex(run) : null;
      return overlayLayout("battle").map((s, i) => {
        if (s.id === "switch") {
          return { ...s, label: sw === null ? "교체할 장수 없음" : `${nameOf(run!.battle!.party[sw].id)}(으)로 교체`, disabled: sw === null };
        }
        const sk = view?.player.skills[i];
        if (!sk) return { ...s, disabled: true };
        const uses = sk.usesLeft === null ? "무제한" : `남은 ${sk.usesLeft}회`;
        return { ...s, label: `${sk.name} ${uses}`, disabled: sk.usesLeft === 0 };
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
  }, [pick, run, screen, selected, startShow]);

  const onAction = useCallback((id: string) => {
    let a: UiAction | null = null;
    if (screen === "start") {
      if (id === "sortie") a = { type: "sortie" };
      else if (id === "resume") a = { type: "resume" };
      else a = { type: "select", starterId: startShow.roster[Number(id.slice(7))]?.id ?? "" };
    } else if (screen === "battle" && run?.battle) {
      if (id === "switch") {
        const to = nextSwitchIndex(run);
        if (to !== null) a = { type: "switch", toIndex: to };
      } else {
        const sk = toBattleView(run)?.player.skills[Number(id.slice(5))];
        if (sk) a = { type: "skill", skillId: sk.id };
      }
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
  }, [bridge, run, screen, startShow]);

  const onFocus = useCallback((id: string) => bridge.emit("ui:focus", { id }), [bridge]);

  const locked = !booted || animating || readyScene !== screen;

  return (
    <div>
      <div className="relative w-full max-w-[480px] mx-auto overflow-hidden rounded-sm bg-ink" style={{ aspectRatio: "4 / 3" }}>
        <div ref={hostRef} className="absolute inset-0" aria-hidden />
        <OverlayButtons buttons={buttons} disabled={locked} onFocus={onFocus} onAction={onAction} />
        {!painted && <p className="absolute inset-0 grid place-items-center text-sm text-paper bg-ink">불러오는 중…</p>}
      </div>
      <p className="sr-only" aria-live="polite">
        {screen === "battle" && run ? toBattleView(run)?.message.join(" ") : ""}
      </p>
      {screen === "result" && record && (
        <div className="mt-4 flex flex-col gap-3">
          {notice && <p role="status" className="text-xs text-center text-muted">{notice}</p>}
          {busy && <p role="status" className="text-xs text-center text-muted">공유 준비 중…</p>}
          {stars > 0 && (
            <FeedbackForm key={stars} wave={record.waves.length} starter={record.starter} cleared={record.cleared} initialRating={stars} />
          )}
          <CoupangBanner subId="samguk-duel" />
        </div>
      )}
    </div>
  );
}
