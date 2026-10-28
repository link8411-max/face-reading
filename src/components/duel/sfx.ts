// 일기토 효과음: Web Audio 발진기(사각파·잡음)로 짧게 만든다. 파일 없음, 실패는 모두 무시.
export type SfxName = 'hit' | 'slash' | 'ko' | 'levelup' | 'card' | 'cutin';

const MUTE_KEY = 'unse-duel:muted';

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;
let muted: boolean | null = null;
let touched = false;

// 사용자가 한 번이라도 누르거나 키를 치면 재생할 수 있다(자동 재생 정책)
if (typeof window !== 'undefined') {
  const mark = () => {
    touched = true;
    window.removeEventListener('pointerdown', mark);
    window.removeEventListener('keydown', mark);
  };
  try {
    window.addEventListener('pointerdown', mark, { passive: true });
    window.addEventListener('keydown', mark);
  } catch {
    // 무시
  }
}

function userActivated(): boolean {
  if (touched) return true;
  try {
    const ua = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
    return !!ua?.hasBeenActive;
  } catch {
    return false;
  }
}

export function isMuted(): boolean {
  if (muted !== null) return muted;
  try {
    muted = localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    muted = false;
  }
  return muted;
}

export function setMuted(value: boolean): void {
  muted = value;
  try {
    localStorage.setItem(MUTE_KEY, value ? '1' : '0');
  } catch {
    // 저장 못 해도 이번 화면에서는 적용된다
  }
}

function audio(): AudioContext | null {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    return ctx;
  } catch {
    return null;
  }
}

function noiseBuffer(ac: AudioContext): AudioBuffer {
  if (noise) return noise;
  const len = Math.floor(ac.sampleRate * 0.5);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  // 결정적 잡음(LCG): 매번 같은 소리
  let s = 12345;
  for (let i = 0; i < len; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    d[i] = (s / 0x7fffffff) * 2 - 1;
  }
  noise = buf;
  return buf;
}

/** 사각파 한 음: freq에서 toFreq로 미끄러진다 */
function tone(ac: AudioContext, at: number, dur: number, freq: number, toFreq = freq, vol = 0.08, type: OscillatorType = 'square') {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, at);
  if (toFreq !== freq) o.frequency.exponentialRampToValueAtTime(Math.max(20, toFreq), at + dur);
  g.gain.setValueAtTime(vol, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(ac.destination);
  o.start(at);
  o.stop(at + dur + 0.02);
}

/** 잡음 한 번: 필터 주파수를 from→to로 */
function burst(ac: AudioContext, at: number, dur: number, from: number, to: number, vol = 0.15, type: BiquadFilterType = 'bandpass') {
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer(ac);
  const f = ac.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(from, at);
  f.frequency.exponentialRampToValueAtTime(Math.max(20, to), at + dur);
  const g = ac.createGain();
  g.gain.setValueAtTime(vol, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  src.connect(f).connect(g).connect(ac.destination);
  src.start(at);
  src.stop(at + dur + 0.02);
}

export function playSfx(name: SfxName): void {
  try {
    if (typeof window === 'undefined' || isMuted() || !userActivated()) return;
    const ac = audio();
    if (!ac) return;
    if (ac.state === 'suspended') void ac.resume().catch(() => {});
    const t = ac.currentTime + 0.01;
    switch (name) {
      case 'hit':
        burst(ac, t, 0.12, 1800, 300, 0.2);
        tone(ac, t, 0.1, 140, 70, 0.08);
        break;
      case 'slash':
        burst(ac, t, 0.18, 6000, 900, 0.18, 'highpass');
        tone(ac, t + 0.04, 0.12, 220, 60, 0.06);
        break;
      case 'ko':
        tone(ac, t, 0.5, 300, 50, 0.09);
        burst(ac, t + 0.1, 0.3, 600, 100, 0.08, 'lowpass');
        break;
      case 'levelup':
        [523, 659, 784, 1047].forEach((f, i) => tone(ac, t + i * 0.08, 0.1, f, f, 0.06));
        break;
      case 'card':
        tone(ac, t, 0.04, 880, 880, 0.05);
        break;
      case 'cutin':
        tone(ac, t, 0.25, 200, 800, 0.07);
        burst(ac, t, 0.25, 400, 3000, 0.06);
        break;
    }
  } catch {
    // 소리는 덤: 어떤 실패도 화면을 막지 않는다
  }
}
