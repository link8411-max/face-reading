// 삼국지 쇼츠 템플릿: 장면마다 짧은 컷 2~3개(영상 또는 그림+움직임), 단어별 자막(핵심어 금색), 제목 띠, 장면 전환 효과음, 끝 화면
import React from 'react';
import {
	AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing,
} from 'remotion';

export const FPS = 30;
export const LEAD = 0.25; // 장면 시작 뒤 해설이 나오기까지(초)
export const TAIL = 0.35; // 해설 끝난 뒤 다음 장면까지(초)
export const END_PAD = 1.4;
export const sceneFrames = (narDur: number) => Math.round((narDur + LEAD + TAIL) * FPS);

type Shot = {src: string; move?: 'in' | 'out' | 'left' | 'right' | 'up'; focus?: [number, number]; zoom?: number; from?: number; volume?: number};
type Scene = {id: string; narration: string; shots?: Shot[]; src: string | (string | [string, number])[]; kind: string; sfx?: 'whoosh' | 'boom'};
export type Episode = {title: string; subtitle: string; watermark?: string; emphasis?: string[]; scenes: Scene[];
	end: {portraits: string[]; lines: string[]; url: string; narration: string}};
export type Timing = Record<string, {duration: number; words: {text: string; start: number; end: number}[]}>;
export type ShortProps = {ep: string; episode?: Episode; timing?: Timing};

const GOLD = '#E8B547';
const FONT = '"Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
const isVideo = (s: string) => /\.(mp4|mov|webm)$/i.test(s);

// 컷 하나: 영상이면 그대로(살짝 확대), 그림이면 정해진 방향으로 움직인다
const ShotView: React.FC<{ep: string; shot: Shot; frames: number}> = ({ep, shot, frames}) => {
	const f = useCurrentFrame();
	const t = interpolate(f, [0, frames], [0, 1], {extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});
	const z0 = shot.zoom ?? 1;
	const [fx, fy] = shot.focus ?? [0.5, 0.42];
	const move = shot.move ?? 'in';
	let scale = z0 * (move === 'out' ? interpolate(t, [0, 1], [1.14, 1.02]) : interpolate(t, [0, 1], [1.02, 1.14]));
	let dx = 0, dy = 0;
	if (move === 'left') { scale = z0 * 1.12; dx = interpolate(t, [0, 1], [40, -40]); }
	if (move === 'right') { scale = z0 * 1.12; dx = interpolate(t, [0, 1], [-40, 40]); }
	if (move === 'up') { scale = z0 * 1.12; dy = interpolate(t, [0, 1], [50, -50]); }
	const style: React.CSSProperties = {
		width: '100%', height: '100%', objectFit: 'cover',
		transformOrigin: `${fx * 100}% ${fy * 100}%`, transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
	};
	return isVideo(shot.src)
		? <OffthreadVideo src={staticFile(`${ep}/${shot.src}`)} startFrom={Math.round((shot.from ?? 0) * FPS)} volume={shot.volume ?? 0.25} style={style} />
		: <Img src={staticFile(`${ep}/${shot.src}`)} style={style} />;
};

// 컷 사이 짧은 디졸브(6프레임)
const Fade: React.FC<{frames: number; children: React.ReactNode; first: boolean}> = ({frames, children, first}) => {
	const f = useCurrentFrame();
	const o = first ? 1 : interpolate(f, [0, 6], [0, 1], {extrapolateRight: 'clamp'});
	return <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>;
};

const TitleBar: React.FC<{ep: Episode}> = ({ep}) => (
	<AbsoluteFill style={{pointerEvents: 'none'}}>
		<div style={{position: 'absolute', top: 120, left: 0, right: 0, height: 150, background: 'rgba(0,0,0,0.45)', textAlign: 'center', fontFamily: FONT}}>
			<div style={{fontSize: 76, fontWeight: 800, color: GOLD, marginTop: 10, textShadow: '0 0 6px #000, 0 0 2px #000'}}>{ep.title}</div>
			<div style={{fontSize: 40, fontWeight: 600, color: 'white', marginTop: -4}}>{ep.subtitle}</div>
		</div>
		<div style={{position: 'absolute', top: 284, width: '100%', textAlign: 'center', fontFamily: FONT, fontSize: 32, color: 'rgba(255,255,255,0.75)', textShadow: '0 0 4px #000'}}>
			{ep.watermark ?? 'unse-ai.com'}
		</div>
	</AbsoluteFill>
);

// 단어별 자막: 3~4단어씩 한 화면, 말하는 단어는 커지며 흰색→금색, 핵심어는 항상 금색
const Captions: React.FC<{words: Timing[string]['words']; emphasis: string[]}> = ({words, emphasis}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const now = f / fps - LEAD;
	const pages: (typeof words)[] = [];
	let cur: typeof words = [];
	for (const w of words) {
		cur.push(w);
		const len = cur.reduce((a, x) => a + x.text.length, 0);
		if (len >= 11 || /[.?!,]$/.test(w.text) && len >= 6) { pages.push(cur); cur = []; }
	}
	if (cur.length) pages.push(cur);
	const page = pages.find((p, i) => now < (pages[i + 1]?.[0].start ?? 1e9)) ?? pages[pages.length - 1];
	if (!page || now < page[0].start - 0.15) return null;
	const pageStart = Math.round((page[0].start + LEAD) * fps);
	const pop = spring({frame: f - pageStart, fps, config: {damping: 14, stiffness: 180}});
	return (
		<div style={{position: 'absolute', top: 1270, left: 60, right: 60, textAlign: 'center', fontFamily: FONT, transform: `scale(${0.85 + 0.15 * pop})`}}>
			{page.map((w, i) => {
				const active = now >= w.start - 0.05 && now < w.end + 0.05;
				const key = emphasis.some((e) => w.text.includes(e));
				return (
					<span key={i} style={{
						display: 'inline-block', margin: '0 10px', fontSize: active ? 86 : 78, fontWeight: 900, lineHeight: 1.25,
						color: key || active ? GOLD : 'white',
						WebkitTextStroke: '10px black', paintOrder: 'stroke fill', textShadow: '0 6px 12px rgba(0,0,0,0.6)',
						transition: 'none',
					}}>{w.text.replace(/[,.]$/, '')}</span>
				);
			})}
		</div>
	);
};

const SceneView: React.FC<{ep: string; scene: Scene; timing: Timing[string]; emphasis: string[]; frames: number; index: number}> = ({ep, scene, timing, emphasis, frames, index}) => {
	const shots: Shot[] = scene.shots ?? [{src: typeof scene.src === 'string' ? scene.src : String((scene.src[0] as any)[0] ?? scene.src[0])}];
	// 컷 길이: 고르게 나눈다
	const each = Math.floor(frames / shots.length);
	const f = useCurrentFrame();
	const fadeIn = interpolate(f, [0, 5], [0, 1], {extrapolateRight: 'clamp'});
	return (
		<AbsoluteFill style={{backgroundColor: 'black', opacity: index === 0 ? 1 : fadeIn}}>
			{shots.map((s, i) => (
				<Sequence key={i} from={i * each} durationInFrames={i === shots.length - 1 ? frames - i * each : each + 6}>
					<Fade frames={each} first={i === 0}><ShotView ep={ep} shot={s} frames={i === shots.length - 1 ? frames - i * each : each + 6} /></Fade>
				</Sequence>
			))}
			<Sequence from={Math.round(LEAD * FPS)}><Audio src={staticFile(`${ep}/nar_${scene.id}.wav`)} /></Sequence>
			{index > 0 && <Audio src={staticFile(`sfx/${scene.sfx ?? 'whoosh'}.wav`)} volume={scene.sfx === 'boom' ? 0.6 : 0.35} />}
			<Captions words={timing.words} emphasis={emphasis} />
		</AbsoluteFill>
	);
};

const EndCard: React.FC<{ep: string; end: Episode['end']; timing: Timing[string]}> = ({ep, end, timing}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const n = end.portraits.length;
	const size = n <= 2 ? 400 : 300;
	return (
		<AbsoluteFill style={{backgroundColor: '#23263A', fontFamily: FONT, alignItems: 'center'}}>
			<div style={{display: 'flex', gap: 30, marginTop: 380, justifyContent: 'center'}}>
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
			<div style={{color: 'white', fontSize: 64, fontWeight: 900, marginTop: 70, textAlign: 'center', padding: '0 60px', opacity: interpolate(f, [10, 20], [0, 1], {extrapolateRight: 'clamp'})}}>{end.lines[0]}</div>
			{end.lines.slice(1).map((l) => <div key={l} style={{color: 'white', fontSize: 44, marginTop: 20}}>{l}</div>)}
			<div style={{color: GOLD, fontSize: 80, fontWeight: 900, marginTop: 50, transform: `scale(${1 + 0.04 * Math.sin(f / 6)})`}}>{end.url}</div>
			<Sequence from={Math.round(LEAD * FPS)}><Audio src={staticFile(`${ep}/nar_end.wav`)} /></Sequence>
			<Audio src={staticFile('sfx/whoosh.wav')} volume={0.35} />
		</AbsoluteFill>
	);
};

export const Short: React.FC<ShortProps> = ({ep, episode, timing}) => {
	if (!episode || !timing) return null;
	const emphasis = episode.emphasis ?? [];
	let at = 0;
	return (
		<AbsoluteFill style={{backgroundColor: 'black'}}>
			{episode.scenes.map((s, i) => {
				const frames = sceneFrames(timing[s.id].duration);
				const el = (
					<Sequence key={s.id} from={at} durationInFrames={frames}>
						<SceneView ep={ep} scene={s} timing={timing[s.id]} emphasis={emphasis} frames={frames} index={i} />
					</Sequence>
				);
				at += frames;
				return el;
			})}
			<Sequence from={at}>
				<EndCard ep={ep} end={episode.end} timing={timing.end} />
			</Sequence>
			<Sequence from={0} durationInFrames={at}><TitleBar ep={episode} /></Sequence>
			<Audio src={staticFile('sfx/wind.wav')} volume={0.08} />
		</AbsoluteFill>
	);
};
