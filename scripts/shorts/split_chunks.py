# tts_chunks.mjs가 만든 묶음(chunk_N.pcm)을 박자별 nar_<id>.wav로 나눈다.
# 박자 사이의 "..."는 긴 쉼이 되므로, 묶음 안 박자 수-1개의 가장 긴 쉼을 경계로 쓴다(글자 수 비율과 가까운 것 우선).
#   python3 scripts/shorts/split_chunks.py docs/videos/long01-samgo
import json, os, re, subprocess, sys
from pathlib import Path
EP = Path(sys.argv[1]); V = EP / "work/voice"
FF = str(Path.home() / ".cache/shorts-tools/node_modules/ffmpeg-static/ffmpeg")
spec = json.loads((EP / "episode.json").read_text())
text = {b["id"]: b["narration"] for b in spec["beats"]}; text["end"] = spec["end"]["narration"]
letters = lambda t: len(re.sub(r"[^가-힣0-9A-Za-z]", "", t))
for cj in sorted(V.glob("chunk_*.json")):
    ids = json.loads(cj.read_text()); pcm = cj.with_suffix(".pcm")
    dur = pcm.stat().st_size / 48000
    log = subprocess.run([FF, "-hide_banner", "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", str(pcm), "-af", "silencedetect=n=-40dB:d=0.35", "-f", "null", "-"], capture_output=True, text=True).stderr
    st = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", log)]; en = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]
    sil = [(a, b) for a, b in zip(st, en) if a > 0.3 and b < dur - 0.3]
    chars = [letters(text[i]) for i in ids]; tot = sum(chars); cuts = []; acc = 0; used = set()
    for k in range(len(ids) - 1):
        acc += chars[k]; target = dur * acc / tot
        cand = [(abs((a + b) / 2 - target) - (b - a) * 3, j) for j, (a, b) in enumerate(sil) if j not in used and (not cuts or a > cuts[-1][1])]
        _, j = min(cand); used.add(j); cuts.append(sil[j])
    # TTS 묶음 맨 끝에 쉼 뒤 0.1초쯤 0dB 고음 잡음이 붙는다(ep06에서 '치직'으로 들림) → 마지막 쉼에서 끊는다
    tail = [a for a, b in zip(st, en) if dur - 0.4 < b and a < dur - 0.05 and a > dur - 1.5]
    end = tail[-1] + 0.05 if tail else dur
    bounds = [0.0] + [x for c in cuts for x in c] + [end]
    for n, i in enumerate(ids):
        a, b = bounds[2 * n], bounds[2 * n + 1]
        subprocess.run([FF, "-y", "-loglevel", "error", "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", str(pcm), "-af",
            f"atrim={a}:{b},asetpts=PTS-STARTPTS,silenceremove=start_periods=1:start_threshold=-40dB,areverse,silenceremove=start_periods=1:start_threshold=-40dB,areverse,atempo=1.1,afade=t=in:d=0.04,areverse,afade=t=in:d=0.08,areverse",
            "-ar", "44100", "-ac", "2", str(V / f"nar_{i}.wav")], check=True)
        print(i, f"{a:.2f}-{b:.2f}")
