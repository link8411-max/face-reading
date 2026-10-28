"use client";

import "./duel.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createDuelGame, DuelBridge, type BattleFocusId, type SceneName, type UiAction } from "@/game/duel/createDuelGame";
import { eventsToTimeline, timelineLength, type Side } from "@/game/duel/timeline";
import { createRng, type Rng } from "@/lib/duel/rng";
import { pickReward, playerTurn, startRun } from "@/lib/duel/run";
import { getReward } from "@/lib/duel/rewards";
import { BOSS_WAVES, getDuelGeneral, STARTER_IDS } from "@/lib/duel/generals";
import { defaultSave, loadSave, recordRunEnd, writeSave } from "@/lib/duel/save";
import { narrate } from "@/lib/duel/narrative";
import { encodeRunKey } from "@/lib/duel/shareKey";
import { makeRunId, newRunNonce } from "@/lib/duel/feedback";
import { advancePlayed, buildRunLog, endEventId, waveEventId } from "@/lib/duel/runLog";
import { duelShareUrl, ogImageUrl } from "@/lib/shareLinks";
import type { RunRecord, RunState, SaveData } from "@/lib/duel/types";
import { track } from "@/lib/analytics";
import { useResultShare } from "@/hooks/useResultShare";
import CoupangBanner from "@/components/CoupangBanner";
import FeedbackForm from "./FeedbackForm";
import OverlayButtons, { type OverlayButton } from "./OverlayButtons";
import { overlayLayout, resolveStarterUnlock, stageLayout } from "./clientLogic";
import { GAME_H, GAME_W } from "@/game/duel/config";
import { resultLayout } from "@/game/duel/layout";
import { bodyPages } from "@/game/duel/wrap";
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
/** "한 번 더 누르면 결정" 안내를 본 표시 */
const HINT_KEY = "duel.confirmHint";
/** 무대 아래 남길 여백(px) */
const STAGE_BOTTOM_GAP = 12;
/** anim:done이 오지 않을 때(장면이 없을 때) 입력을 다시 여는 여유 시간 */
const ANIM_GRACE_MS = 3000;

const storage = (): Storage | null => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

/** 기기 종류(플레이 데이터용). 터치 화면이면 모바일 */
const deviceKind = (): "mobile" | "desktop" => {
  try {
    return window.matchMedia("(pointer: coarse)").matches ? "mobile" : "desktop";
  } catch {
    return "desktop";
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
  const [stage, setStage] = useState<{ w: number; h: number; left: number; tall: boolean } | null>(null);
  const [bridge] = useState(() => new DuelBridge());
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const measure = () => {
      const dpr = window.devicePixelRatio || 1;
      // 세로로도 넘치지 않게: 화면 높이 - 무대 위쪽(머리글) - 아래 여백
      const top = el.getBoundingClientRect().top + window.scrollY;
      const maxH = Math.max(GAME_H, window.innerHeight - top - STAGE_BOTTOM_GAP);
      // 폰·터치는 세로형(아래 큰 명령 패널), 넓은 마우스 화면은 가로형
      let coarse = false;
      try {
        coarse = window.matchMedia("(pointer: coarse)").matches;
      } catch {
        // matchMedia가 없으면 폭으로만
      }
      const { w, h, tall } = stageLayout(el.clientWidth, dpr, maxH, coarse);
      // 게임이 만들어지기 전이면 처음 크기로, 뒤라면 크기를 바꾸고 장면을 다시 연다
      if (bridge.tall !== tall) bridge.emit("layout:tall", { tall });
      // 가운데 정렬도 기기 화소 경계에 맞춘다(반 화소 어긋나면 도트가 번진다)
      const left = Math.floor(((el.clientWidth - w) / 2) * dpr) / dpr;
      setStage((old) => (old && old.w === w && old.h === h && old.left === left && old.tall === tall ? old : { w, h, left, tall }));
      // 바깥 천 무늬의 체커 칸도 캔버스와 같은 배율로
      el.closest<HTMLElement>(".duel-cloth")?.style.setProperty("--px", String(Math.max(1, Math.round(w / GAME_W))));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [bridge]);
  const tall = !!stage?.tall;
  /** 만들어진 게임(무대 크기가 바뀌면 Phaser에 다시 재라고 알린다) */
  const gameRef = useRef<DuelGame | null>(null);
  useEffect(() => {
    // Phaser는 창 resize 때만 부모 크기를 다시 잰다 → React가 무대 크기를 바꾼 뒤 부모 크기를 다시 재게 하고 맞춘다
    const scale = gameRef.current?.scale;
    if (!scale) return;
    scale.getParentBounds();
    scale.refresh();
  }, [stage]);
  const rngRef = useRef<Rng>(createRng(1));
  const sidesRef = useRef<{ player: Side }>({ player: "left" });
  const seedParamRef = useRef<string | null>(null);

  const [save, setSave] = useState<SaveData>(defaultSave);
  const [run, setRun] = useState<RunState | null>(null);
  /** 판마다 새로 만드는 무작위 값(피드백 runId용). 공유 시드 링크로 같은 판이 되어도 겹치지 않게 한다 */
  const [runNonce, setRunNonce] = useState("");
  /** finishRun이 읽는 runNonce */
  const runNonceRef = useRef("");
  /** 플레이 데이터: 진행 시간 시계(저장 사이 시간을 쌓는다), 이어하기 판인지, 이번 판에서 이미 보낸 보스 도달 */
  const clockRef = useRef({ startedAt: 0, playedMs: 0, lastAt: 0 });
  const resumedRef = useRef(false);
  const firedWavesRef = useRef<Set<number>>(new Set());
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
  /** 결과 열전 쪽 */
  const [resultPage, setResultPage] = useState(0);
  /** 이 브라우저에 저장할 수 있는지(시작 화면 안내) */
  const [storageOk, setStorageOk] = useState(true);
  /** "한 번 더 누르면 결정" 안내를 이미 봤는지(한 번 결정하면 끈다, 이 기기에 기억) */
  const [hintDone, setHintDone] = useState(false);
  const [booted, setBooted] = useState(false);
  /** 첫 장면이 그려졌는지(그전에는 불러오는 중 문구) */
  const [painted, setPainted] = useState(false);

  // ── 저장 ──
  const persist = useCallback((data: SaveData) => {
    // 진행 중인 판이면 시작 시각과 지금까지 진행한 시간을 함께 적는다(이어하기 때 이어서 쌓는다)
    if (data.current) {
      const now = Date.now();
      const c = clockRef.current;
      c.playedMs = advancePlayed(c.playedMs, c.lastAt, now);
      c.lastAt = now;
      data = { ...data, current: { ...data.current, startedAt: c.startedAt, playedMs: c.playedMs } };
    }
    writeSave(storage(), data);
    setSave(data);
  }, []);

  // ── 장면 보이기 ──
  const go = useCallback((scene: SceneName) => {
    setScreen(scene);
    setReadyScene(null);
    bridge.emit("scene:go", { scene });
  }, [bridge]);

  const storageOkRef = useRef(true);
  const showStart = useCallback((data: SaveData, sel: string) => {
    bridge.emit("start:show", { ...toStartShow(data, sel), storageOk: storageOkRef.current });
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
    setResultPage(0);
    track("result_view", { test_name: "duel", result_id: r.record.starter });
    track("duel_end", { test_name: "duel", result_id: endEventId(r.record.starter, r.record.cleared, r.wave) });
    // 판 요약 1회 전송(실패·서버 꺼짐은 무시, 게임에는 영향 없음). 개인정보는 보내지 않는다
    const c = clockRef.current;
    const nonce = runNonceRef.current;
    if (nonce) {
      const playedMs = advancePlayed(c.playedMs, c.lastAt, Date.now());
      const log = buildRunLog(r, {
        runId: makeRunId(nonce, r.seed, r.record.starter, r.record.waves.length),
        device: deviceKind(),
        resumed: resumedRef.current,
        playedMs,
      });
      try {
        fetch("/api/duel/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(log), keepalive: true }).catch(() => {});
      } catch {
        // 보내지 못해도 결과 화면은 그대로
      }
    }
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
    if (roster !== data.roster) data = { ...data, roster };
    // 한 번 써 보아 저장이 되는지 안다(인앱·사생활 보호 모드면 시작 화면에 안내)
    const ok = writeSave(storage(), data);
    storageOkRef.current = ok;
    setStorageOk(ok);
    try {
      setHintDone(window.localStorage.getItem(HINT_KEY) === "1");
    } catch {
      // 못 읽으면 안내를 보인다
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

  // 보스 웨이브에 처음 들어가면 한 번 알린다(GA 퍼널: 몇 번째 보스까지 오는지)
  useEffect(() => {
    if (!run || run.phase !== "battle") return;
    if (!(BOSS_WAVES as readonly number[]).includes(run.wave) || firedWavesRef.current.has(run.wave)) return;
    firedWavesRef.current.add(run.wave);
    track("duel_wave", { test_name: "duel", result_id: waveEventId(run.wave) });
  }, [run]);

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
    // 진행 중인 판을 두고 새로 출진하면 그 판은 버려진다
    if (save.current && (save.current.phase === "battle" || save.current.phase === "reward")) track("duel_abandon", { test_name: "duel" });
    const seed = seedFrom(seedParamRef.current);
    const r = startRun(selected, seed);
    rngRef.current = createRng(seed);
    sidesRef.current = { player: "left" };
    track("test_start", { test_name: "duel" });
    const now = Date.now();
    clockRef.current = { startedAt: now, playedMs: 0, lastAt: now };
    resumedRef.current = false;
    firedWavesRef.current = new Set();
    const nonce = newRunNonce();
    runNonceRef.current = nonce;
    setRun(r);
    setRunNonce(nonce);
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

  /** 열전 다음 쪽(끝이면 처음으로) */
  const turnPage = useCallback(() => {
    const shown = bridge.shown.result;
    if (!shown) return;
    const n = bodyPages(shown.lines, resultLayout(bridge.tall).bodyLines).length;
    const next = ((shown.page ?? 0) + 1) % Math.max(1, n);
    setResultPage(next);
    bridge.emit("result:show", { ...shown, page: next });
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
        track("duel_resume", { test_name: "duel" });
        const now = Date.now();
        clockRef.current = { startedAt: cur.startedAt ?? now, playedMs: cur.playedMs ?? 0, lastAt: now };
        resumedRef.current = true;
        // 이 웨이브까지의 보스 도달은 이미 보냈다
        firedWavesRef.current = new Set(BOSS_WAVES.filter((w) => w <= cur.wave));
        const nonce = newRunNonce();
        runNonceRef.current = nonce;
        setRun(cur);
        setRunNonce(nonce);
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
    if (!hintDone) {
      setHintDone(true);
      try {
        window.localStorage.setItem(HINT_KEY, "1");
      } catch {
        // 저장 못 해도 이번 판에서는 끈다
      }
    }
    bridge.emit("ui:action", act);
  }, [battleSel, bridge, hintDone, rowInfo]);

  // 대사창 안내 줄: 결정 대기 중이면 "▶ 일격"(+ 금색 결정 단추), 처음에는 "한 번 더 누르면 결정"
  useEffect(() => {
    const name = battleChoice?.label.replace(/ (무제한|남은 \d+회)$/, "") ?? "";
    const text = screen === "battle" && pending && !animating && battleChoice?.action ? `▶ ${name}` : null;
    bridge.emit("battle:prompt", { text, hint: !hintDone });
  }, [animating, battleChoice, bridge, hintDone, pending, screen]);

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
      return overlayLayout("start", startShow.roster.length, !!res, { tall }).map((s, i) => {
        if (s.id === "sortie") return { ...s, label: `${nameOf(selected)}와 함께 ${res ? "새로 " : ""}출진` };
        if (s.id === "resume") return { ...s, label: `이어하기: ${res!.name} 제${res!.wave}전` };
        const g = startShow.roster[i];
        return { ...s, label: g.locked ? `${g.name} 잠김` : `${g.name} ${g.kind}${g.id === selected ? " 선택됨" : ""}`, disabled: g.locked };
      });
    }
    if (screen === "battle") {
      // 고르기 → 결정: 줄은 커서만 옮기고(작아도 됨), 실행은 대사창 위의 큰 "결정" 단추
      const choice = battleChoice;
      return overlayLayout("battle", 0, false, { tall }).map((s) => {
        if (s.id === "confirm") {
          return { ...s, label: choice && pending ? `결정: ${choice.label}` : "먼저 메뉴에서 명령을 고르세요", disabled: !pending || !choice?.action };
        }
        const row = rowInfo(s.id as BattleFocusId);
        // 동행이 없으면 교체는 누를 수 없다(흐리게 + "동행 없음")
        if (s.id === "switch" && !row.action) return { ...s, label: "교체: 동행 없음", disabled: true };
        const again = battleSel === s.id && pending ? " (한 번 더 누르면 결정)" : " 고르기";
        return { ...s, label: `${row.label}${row.action ? "" : " (쓸 수 없음)"}${again}`, pressed: battleSel === s.id };
      });
    }
    if (screen === "reward") {
      if (run && pick) {
        const pv = pickView(run, pick)!;
        return overlayLayout(pick.kind === "recruit" ? "recruit" : "pick", pv.options.length, false, { tall }).map((s, i) => ({ ...s, label: pv.options[i].label }));
      }
      const cards = run?.rewardsOffered ?? [];
      return overlayLayout("reward").slice(0, cards.length).map((s, i) => {
        const r = getReward(cards[i]);
        return { ...s, label: `${r.rarity === "rare" ? "희귀" : "보통"} ${r.name}: ${r.desc}` };
      });
    }
    const pages = record ? bodyPages(narrate(record).lines, resultLayout(tall).bodyLines).length : 1;
    return overlayLayout("result", 0, false, { tall, pages }).map((s) => (s.id === "page" ? { ...s, label: `열전 다음 쪽 (${resultPage + 1}/${pages})` } : s));
  }, [battleChoice, battleSel, pending, pick, record, resultPage, rowInfo, run, screen, selected, startShow, tall]);

  const onAction = useCallback((id: string) => {
    let a: UiAction | null = null;
    if (screen === "start") {
      if (id === "sortie") a = { type: "sortie" };
      else if (id === "resume") a = { type: "resume" };
      else a = { type: "select", starterId: startShow.roster[Number(id.slice(7))]?.id ?? "" };
    } else if (screen === "battle" && run?.battle) {
      if (id === "confirm") {
        if (pending) confirmBattle();
      } else if (id === battleSel && pending) {
        // 같은 줄(카드)을 다시 누르면 결정
        confirmBattle();
      } else selectRow(id as BattleFocusId, true);
    } else if (screen === "reward") {
      if (id.startsWith("opt")) a = { type: "pick", index: Number(id.slice(3)) };
      else if (run) {
        const rid = run.rewardsOffered[Number(id.slice(4))];
        if (rid) a = { type: "reward", rewardId: rid };
      }
    } else if (screen === "result") {
      if (id === "page") turnPage();
      else if (id.startsWith("star")) a = { type: "rate", stars: Number(id.slice(4)) };
      else a = { type: "result", action: id as "share" | "retry" | "samguk" };
    }
    if (a) bridge.emit("ui:action", a);
  }, [battleSel, bridge, confirmBattle, pending, run, screen, selectRow, startShow, turnPage]);

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
      <div ref={outerRef} className="w-full px-2">
        <div
          className="relative overflow-hidden bg-cloth"
          style={stage ? { width: stage.w, height: stage.h, marginLeft: stage.left } : { width: "100%", aspectRatio: "4 / 3" }}
        >
          <div ref={hostRef} className="absolute inset-0 [&_canvas]:[image-rendering:pixelated]" aria-hidden />
          <OverlayButtons buttons={buttons} disabled={locked} onFocus={onFocus} onAction={onAction} onKeyDown={onKeyDown} hover={screen !== "battle"} />
          {!painted && <p className="absolute inset-0 grid place-items-center text-sm text-paper bg-ink">불러오는 중…</p>}
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {screen === "battle" && run ? toBattleView(run)?.message.join(" ") : screen === "start" && !storageOk ? "이 브라우저에서는 이어하기가 저장되지 않아요" : ""}
      </p>
      {screen === "result" && record && (
        <div className="mt-4 mx-auto px-4 max-w-lg flex flex-col gap-3">
          {notice && <p role="status" className="text-xs text-center text-paper">{notice}</p>}
          {busy && <p role="status" className="text-xs text-center text-paper">공유 준비 중…</p>}
          {stars > 0 && (
            // 판마다 한 번: 키는 판(선두·싸움 수·클리어·행군 기록 수), 별점은 캔버스와 폼이 같은 값을 쓴다
            <FeedbackForm
              key={`${record.starter}.${record.waves.length}.${record.cleared ? "c" : "l"}.${save.history.length}`}
              wave={record.waves.length}
              starter={record.starter}
              cleared={record.cleared}
              runId={run && runNonce ? makeRunId(runNonce, run.seed, record.starter, record.waves.length) : undefined}
              rating={stars}
              onRate={rate}
            />
          )}
          <CoupangBanner subId="samguk-duel" tone="dark" />
        </div>
      )}
    </div>
  );
}
