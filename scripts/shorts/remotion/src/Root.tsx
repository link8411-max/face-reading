import {Composition, staticFile} from 'remotion';
import {Short, type ShortProps, type Episode, type Timing, FPS, sceneFrames, END_PAD} from './Short';

export const RemotionRoot: React.FC = () => (
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
);
