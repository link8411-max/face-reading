import {Composition, staticFile} from 'remotion';
import {Short, type ShortProps, type Episode, type Timing, FPS, sceneFrames, END_PAD} from './Short';
import {ShortV2, type ShortV2Props, type EpisodeV2, beatFrames} from './ShortV2';
import {MapScene, mapShotFrames} from './MapScene';
import {Thumb} from './Thumb';
import {HookCard} from './HookCard';

export const RemotionRoot: React.FC = () => (
	<>
		<Composition
			id="Short"
			component={Short}
			width={1080}
			height={1920}
			fps={FPS}
			durationInFrames={300}
			defaultProps={{ep: 'ep03'} as ShortProps}
			calculateMetadata={async ({props}) => {
				const [episode, timing] = await Promise.all([
					fetch(staticFile(`${props.ep}/episode.json`)).then((r) => r.json() as Promise<Episode>),
					fetch(staticFile(`${props.ep}/timing.json`)).then((r) => r.json() as Promise<Timing>),
				]);
				const total = episode.scenes.reduce((a, s) => a + sceneFrames(timing[s.id].duration), 0)
					+ Math.round((timing.end.duration + END_PAD) * FPS);
				return {durationInFrames: total, props: {...props, episode, timing}};
			}}
		/>
		<Composition
			id="ShortV2"
			component={ShortV2}
			width={1080}
			height={1920}
			fps={FPS}
			durationInFrames={300}
			defaultProps={{ep: 'ep03'} as ShortV2Props}
			calculateMetadata={async ({props}) => {
				const [episode, timing] = await Promise.all([
					fetch(staticFile(`${props.ep}/episode.json`)).then((r) => r.json() as Promise<EpisodeV2>),
					fetch(staticFile(`${props.ep}/timing.json`)).then((r) => r.json() as Promise<Timing>),
				]);
				const total = episode.beats.reduce((a, b) => a + beatFrames(timing[b.id].duration), 0)
					+ Math.round((timing.end.duration + END_PAD) * FPS);
				return {durationInFrames: total, props: {...props, episode, timing}};
			}}
		/>
		<Composition
			id="ShortV2H"
			component={ShortV2}
			width={1920}
			height={1080}
			fps={FPS}
			durationInFrames={300}
			defaultProps={{ep: 'long01-samgo-h'} as ShortV2Props}
			calculateMetadata={async ({props}) => {
				const [episode, timing] = await Promise.all([
					fetch(staticFile(`${props.ep}/episode.json`)).then((r) => r.json() as Promise<EpisodeV2>),
					fetch(staticFile(`${props.ep}/timing.json`)).then((r) => r.json() as Promise<Timing>),
				]);
				const total = episode.beats.reduce((a, b) => a + beatFrames(timing[b.id].duration), 0)
					+ Math.round((timing.end.duration + END_PAD) * FPS);
				return {durationInFrames: total, props: {...props, episode, timing}};
			}}
		/>
		<Composition
			id="MapSceneH"
			component={MapScene}
			width={1920}
			height={1080}
			fps={FPS}
			durationInFrames={210}
			defaultProps={{shot: 'xinye'}}
			calculateMetadata={({props}) => ({durationInFrames: mapShotFrames(props.shot, FPS)})}
		/>
		<Composition id="Thumb" component={Thumb} width={1280} height={720} fps={30} durationInFrames={1}
			defaultProps={{img: 'long01-samgo-h/thumb_A.png', l1: '47세 장군이', l2: '두 시간 서 있었다'}} />
		<Composition id="HookCard" component={HookCard} width={1080} height={1920} fps={30} durationInFrames={1}
			defaultProps={{lines: ['그런데 청년이 입을 열자,', '23년 동안 없던 게', '생깁니다'], cta: '전체 이야기 ▶ 아래 관련 영상'}} />
		<Composition
			id="MapScene"
			component={MapScene}
			width={1080}
			height={1920}
			fps={FPS}
			durationInFrames={210}
			defaultProps={{shot: 'xinye'}}
			calculateMetadata={({props}) => ({durationInFrames: mapShotFrames(props.shot, FPS)})}
		/>
	</>
);
