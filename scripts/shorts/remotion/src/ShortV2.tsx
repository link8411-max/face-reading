// 템플릿 v2: 6박자(beats). 박자마다 이어 찍은 체인 영상(1~2개) + 단어별 자막 + 출처 배지 + 제목 띠 + 전환 효과음.
// twist 박자는 앞 박자의 마지막 프레임을 멈추고 먹이 번지는 효과(Veo 없음).
import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing} from 'remotion';

export const FPS = 30;
export const LEAD = 0.25;
export const TAIL = 0.35;
export const END_PAD = 1.4;
export const beatFrames = (narDur: number) => Math.round((narDur + LEAD + TAIL) * FPS);

export type Beat = {id: string; badge: string | null; narration: string; videos?: (string | {src: string; dur: number; badge?: string | null})[]; sfx?: 'whoosh' | 'boom'; chain: {kind: string}[]};
export type EpisodeV2 = {version: 2; title: string; subtitle: string; watermark?: string; emphasis?: string[]; beats: Beat[];
	end: {portraits: string[]; lines: string[]; url: string; narration: string}};
export type Timing = Record<string, {duration: number; words: {text: string; start: number; end: number}[]}>;
export type ShortV2Props = {ep: string; episode?: EpisodeV2; timing?: Timing; freeze?: string};

const GOLD = '#E8B547';
const FONT = '"Apple SD Gothic Neo", "Noto Sans KR", sans-serif';

const TitleBar: React.FC<{ep: EpisodeV2}> = ({ep}) => {
	const {width, height} = useVideoConfig();
	if (width > height) return (
		<AbsoluteFill style={{pointerEvents: 'none', fontFamily: FONT}}>
			<div style={{position: 'absolute', top: 36, left: 44, fontSize: 40, fontWeight: 800, color: GOLD, textShadow: '0 0 8px #000, 0 0 3px #000'}}>{ep.title}</div>
			<div style={{position: 'absolute', top: 44, right: 48, fontSize: 28, fontWeight: 700, color: 'rgba(255,255,255,0.9)', textShadow: '0 0 6px #000, 0 0 3px #000, 0 0 2px #000'}}>{ep.watermark ?? 'unse-ai.com'}</div>
		</AbsoluteFill>
	);
	return (
	<AbsoluteFill style={{pointerEvents: 'none'}}>
		<div style={{position: 'absolute', top: 120, left: 0, right: 0, height: 150, background: 'rgba(0,0,0,0.45)', textAlign: 'center', fontFamily: FONT}}>
			<div style={{fontSize: 76, fontWeight: 800, color: GOLD, marginTop: 10, textShadow: '0 0 6px #000'}}>{ep.title}</div>
			<div style={{fontSize: 40, fontWeight: 600, color: 'white', marginTop: -4}}>{ep.subtitle}</div>
		</div>
		<div style={{position: 'absolute', top: 284, width: '100%', textAlign: 'center', fontFamily: FONT, fontSize: 32, color: 'rgba(255,255,255,0.75)', textShadow: '0 0 4px #000'}}>{ep.watermark ?? 'unse-ai.com'}</div>
	</AbsoluteFill>
	);
};

// 출처 도장: 연의(붉은색) / 정사(푸른색). 박자 시작에 쿵 찍히듯 들어온다
const Badge: React.FC<{text: string}> = ({text}) => {
	const f = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const s = spring({frame: f - 4, fps, config: {damping: 10, stiffness: 220}});
	const red = text.startsWith('연의');
	const land = width > height;
	return (
		<div style={{position: 'absolute', top: land ? 100 : 340, right: land ? 48 : 50, fontSize: land ? 34 : 40, transform: `rotate(-6deg) scale(${0.6 + 0.4 * s})`, opacity: s, fontFamily: FONT,
			border: `6px solid ${red ? '#C8403A' : '#3F78B5'}`, color: red ? '#C8403A' : '#3F78B5', background: 'rgba(0,0,0,0.7)',
			borderRadius: 10, padding: '6px 18px', fontWeight: 900, letterSpacing: 2}}>{text}</div>
	);
};

// 문구 자막: 문장부호(=실제 쉼)에서만 페이지를 나눈다. 단어별 색 바꾸기는 싱크가 어긋나 보여서 쓰지 않고,
// 핵심어만 금색으로 고정한다. 페이지가 바뀌는 순간만 살짝 튀어 오른다(쉼 위치라 정확함).
const Captions: React.FC<{words: Timing[string]['words']; emphasis: string[]}> = ({words, emphasis}) => {
	const f = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const land = width > height;
	const now = f / fps - LEAD;
	const pages: (typeof words)[] = [];
	let cur: typeof words = [];
	for (const w of words) {
		cur.push(w);
		if (/[.?!,]$/.test(w.text)) { pages.push(cur); cur = []; }
	}
	if (cur.length) pages.push(cur);
	const page = pages.find((_, i) => now < (pages[i + 1]?.[0].start ?? 1e9)) ?? pages[pages.length - 1];
	if (!page || now < page[0].start - 0.12) return null;
	const pageStart = Math.round((page[0].start + LEAD) * fps);
	const pop = spring({frame: f - pageStart, fps, config: {damping: 14, stiffness: 180}});
	const chars = page.reduce((a, w) => a + w.text.length, 0);
	const size = land ? (chars > 24 ? 58 : 66) : chars > 16 ? 64 : chars > 11 ? 72 : 80;
	return (
		<div style={{position: 'absolute', ...(land ? {bottom: 70} : {top: 1250}), left: land ? 160 : 50, right: land ? 160 : 50, textAlign: 'center', fontFamily: FONT, transform: `scale(${0.9 + 0.1 * pop})`}}>
			{page.map((w, i) => {
				const key = emphasis.some((e) => w.text.includes(e));
				return (
					<span key={i} style={{display: 'inline-block', margin: '0 9px', fontSize: size, fontWeight: 900, lineHeight: 1.25,
						color: key ? GOLD : 'white', WebkitTextStroke: '10px black', paintOrder: 'stroke fill', textShadow: '0 6px 12px rgba(0,0,0,0.6)'}}>
						{w.text.replace(/[,.]$/, '')}
					</span>
				);
			})}
		</div>
	);
};

// 박자 화면: 체인 영상을 차례로. 영상 길이(dur)에 비례해 시간을 나누고, 슬롯이 영상보다 길면 살짝 느리게 재생해 끝이 비지 않게 한다
type Vid = string | {src: string; dur: number; badge?: string | null};
const BeatVideos: React.FC<{ep: string; videos: Vid[]; frames: number}> = ({ep, videos, frames}) => {
	const vs = videos.map((v) => (typeof v === 'string' ? {src: v, dur: 8} as Exclude<Vid, string> : v));
	const total = vs.reduce((a, v) => a + v.dur, 0);
	let at = 0;
	return (
		<>
			{vs.map((v, i) => {
				const len = i === vs.length - 1 ? frames - at : Math.round((frames * v.dur) / total);
				const rate = Math.min(1, Math.max(0.8, (v.dur * FPS) / len));
				const el = (
					<Sequence key={v.src} from={at} durationInFrames={len}>
						{/* 오른쪽 아래 Veo 표시가 화면 밖으로 나가도록 왼쪽 위 기준으로 살짝 키운다 */}
						{/* 클립 소리가 뚝 끊기거나 시작되면 장면이 바뀔 때 '치직' 소리가 난다(2026-11-05) → 앞뒤 5프레임 페이드 */}
						<OffthreadVideo src={staticFile(`${ep}/${v.src}`)} playbackRate={rate} volume={(fr) => 0.2 * Math.max(0, Math.min(1, fr / 5, (len - 1 - fr) / 5))} style={{width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.07)', transformOrigin: '0 0'}} />
						{v.badge && <Badge text={v.badge} />}
					</Sequence>
				);
				at += len;
				return el;
			})}
		</>
	);
};

// 반전: 멈춘 프레임 위로 먹이 번지고 색이 바랜다
const Twist: React.FC<{ep: string; freeze: string; frames: number}> = ({ep, freeze, frames}) => {
	const f = useCurrentFrame();
	const t = interpolate(f, [0, frames * 0.7], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)});
	// 박자가 길면(8초 넘게) 화면이 검게 오래 머물지 않도록 그림이 보이는 만큼만 어두워지고, 천천히 다가간다
	const zoom = interpolate(f, [0, frames], [1, 1.08]);
	return (
		<AbsoluteFill>
			<Img src={staticFile(`${ep}/${freeze}`)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${zoom})`, filter: `grayscale(${0.8 * t}) brightness(${1 - 0.3 * t}) contrast(${1 + 0.15 * t})`}} />
			<AbsoluteFill style={{background: `radial-gradient(circle at 50% 45%, rgba(10,8,8,0) ${Math.max(20, 70 - 50 * t)}%, rgba(10,8,8,${0.7 * t}) ${Math.max(60, 110 - 50 * t)}%)`}} />
		</AbsoluteFill>
	);
};

const EndCard: React.FC<{ep: string; end: EpisodeV2['end']}> = ({ep, end}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {width, height} = useVideoConfig();
	const land = width > height;
	const n = end.portraits.length;
	const size = land ? 280 : n === 1 ? 520 : n <= 2 ? 400 : 300;
	return (
		<AbsoluteFill style={{backgroundColor: '#23263A', fontFamily: FONT, alignItems: 'center'}}>
			<div style={{display: 'flex', gap: 30, marginTop: land ? 180 : n === 1 ? 470 : 380, justifyContent: 'center'}}>
				{end.portraits.map((p, i) => {
					const s = spring({frame: f - i * 5, fps, config: {damping: 12}});
					return (
						<div key={p} style={{textAlign: 'center', transform: `translateY(${(1 - s) * 80}px)`, opacity: s}}>
							<Img src={staticFile(`portraits/${p}.jpg`)} style={{width: size, height: size, imageRendering: 'pixelated', borderRadius: 16, border: `4px solid ${GOLD}`}} />
							<div style={{color: GOLD, fontSize: 48, fontWeight: 800, marginTop: 10}}>{p}</div>
						</div>
					);
				})}
			</div>
			<div style={{color: 'white', fontSize: 64, fontWeight: 900, marginTop: land ? 50 : 70, textAlign: 'center', padding: '0 60px', opacity: interpolate(f, [10, 20], [0, 1], {extrapolateRight: 'clamp'})}}>{end.lines[0]}</div>
			{end.lines.slice(1).map((l) => <div key={l} style={{color: 'white', fontSize: 44, marginTop: 20}}>{l}</div>)}
			<div style={{color: GOLD, fontSize: 80, fontWeight: 900, marginTop: land ? 30 : 50, transform: `scale(${1 + 0.04 * Math.sin(f / 6)})`}}>{end.url}</div>
			<Sequence from={Math.round(LEAD * FPS)}><Audio src={staticFile(`${ep}/nar_end.wav`)} /></Sequence>
			<Audio src={staticFile('sfx/whoosh.wav')} volume={0.35} />
		</AbsoluteFill>
	);
};

export const ShortV2: React.FC<ShortV2Props> = ({ep, episode, timing, freeze = 'twist_freeze.png'}) => {
	if (!episode || !timing) return null;
	const emphasis = episode.emphasis ?? [];
	let at = 0;
	return (
		<AbsoluteFill style={{backgroundColor: 'black'}}>
			{episode.beats.map((b, i) => {
				const frames = beatFrames(timing[b.id].duration);
				const isTwist = b.chain.length > 0 && b.chain.every((c) => c.kind === 'effect');
				const el = (
					<Sequence key={b.id} from={at} durationInFrames={frames}>
						<AbsoluteFill style={{backgroundColor: 'black'}}>
							{isTwist ? <Twist ep={ep} freeze={freeze} frames={frames} /> : <BeatVideos ep={ep} videos={b.videos ?? []} frames={frames} />}
							<Sequence from={Math.round(LEAD * FPS)}><Audio src={staticFile(`${ep}/nar_${b.id}.wav`)} /></Sequence>
							{i > 0 && <Audio src={staticFile(`sfx/${isTwist ? 'boom' : b.sfx ?? 'whoosh'}.wav`)} volume={isTwist ? 0.6 : 0.3} />}
							{b.badge && !(b.videos ?? []).some((v) => typeof v !== 'string' && 'badge' in v) && <Badge text={b.badge} />}
							<Captions words={timing[b.id].words} emphasis={emphasis} />
						</AbsoluteFill>
					</Sequence>
				);
				at += frames;
				return el;
			})}
			<Sequence from={at}><EndCard ep={ep} end={episode.end} /></Sequence>
			<Sequence from={0} durationInFrames={at}><TitleBar ep={episode} /></Sequence>
			<Audio src={staticFile('sfx/wind.wav')} volume={0.08} />
		</AbsoluteFill>
	);
};
