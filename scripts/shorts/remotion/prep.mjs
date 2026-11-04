// episode.json + 해설 wav → Remotion 입력(public/<ep>/): 음성 복사, 장면 길이, 대본 단어별 시작·끝 시간
// whisper.cpp로 단어 시간을 뽑고, 받아쓴 글자 대신 대본 글자를 같은 위치 비율로 맞춘다(오타 없는 자막).
//   node scripts/shorts/remotion/prep.mjs docs/videos/ep03
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {transcribe} from '@remotion/install-whisper-cpp';

const EP = path.resolve(process.argv[2]);
const spec = JSON.parse(fs.readFileSync(path.join(EP, 'episode.json'), 'utf8'));
const V = path.join(EP, 'work/voice');
const FF = process.env.FF || path.join(os.homedir(), '.cache/shorts-tools/node_modules/ffmpeg-static/ffmpeg');
const WHISPER = path.join(os.homedir(), '.cache/shorts-tools/whisper');
const OUT = path.join(path.dirname(new URL(import.meta.url).pathname), 'public', path.basename(EP));
fs.mkdirSync(OUT, {recursive: true});

const dur = (f) => {
	let err = '';
	try { execFileSync(FF, ['-hide_banner', '-i', f], {stdio: ['ignore', 'ignore', 'pipe']}); } catch (e) { err = e.stderr.toString(); }
	const [, h, m, s] = err.match(/Duration: (\d+):(\d+):([\d.]+)/);
	return +h * 3600 + +m * 60 + +s;
};
const letters = (t) => t.replace(/[^가-힣0-9A-Za-z]/g, '');

const items = [...spec.scenes.map((s) => ({id: s.id, text: s.narration})), {id: 'end', text: spec.end.narration}];
const result = {};
for (const it of items) {
	const src = path.join(V, `nar_${it.id}.wav`);
	const wav16 = path.join(OUT, `_${it.id}16.wav`);
	execFileSync(FF, ['-y', '-loglevel', 'error', '-i', src, '-ar', '16000', '-ac', '1', wav16]);
	fs.copyFileSync(src, path.join(OUT, `nar_${it.id}.wav`));
	const {transcription} = await transcribe({
		inputPath: wav16, whisperPath: WHISPER, whisperCppVersion: '1.5.5', model: 'medium',
		tokenLevelTimestamps: true, language: 'ko', printOutput: false,
	});
	fs.unlinkSync(wav16);
	// whisper 토큰 → (글자 위치, 시간) 표
	const marks = [];
	let pos = 0;
	for (const seg of transcription) for (const tk of seg.tokens) {
		const n = letters(tk.text).length;
		if (!n || tk.text.startsWith('[')) continue;
		marks.push({p0: pos, p1: pos + n, t0: tk.offsets.from / 1000, t1: tk.offsets.to / 1000});
		pos += n;
	}
	const heard = pos || 1;
	const timeAt = (frac) => {
		const p = frac * heard;
		const m = marks.find((x) => p <= x.p1) || marks[marks.length - 1];
		if (!m) return frac * dur(src);
		const r = m.p1 > m.p0 ? Math.min(1, Math.max(0, (p - m.p0) / (m.p1 - m.p0))) : 0;
		return m.t0 + (m.t1 - m.t0) * r;
	};
	// 대본 단어마다 같은 비율 위치의 시간
	const words = it.text.split(/\s+/).filter(Boolean);
	const total = letters(it.text).length;
	let acc = 0;
	const timed = words.map((w) => {
		const a = acc / total;
		acc += letters(w).length;
		return {text: w, start: +timeAt(a).toFixed(3), end: +timeAt(acc / total).toFixed(3)};
	});
	result[it.id] = {duration: +dur(src).toFixed(3), words: timed};
	console.log(it.id, result[it.id].duration, timed.slice(0, 4).map((w) => `${w.text}@${w.start}`).join(' '));
}
fs.writeFileSync(path.join(OUT, 'timing.json'), JSON.stringify(result, null, 1));
console.log('→', path.join(OUT, 'timing.json'));
