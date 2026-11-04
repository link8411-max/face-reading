# 사용: python3 scripts/shorts/check_v2.py docs/videos/epNN <압축본.mp4>  (work/timing.json 필요)
# ShortV2 완성본 검사: 길이·크기·최대 음량·평균 음량, 박자 경계 딸깍, 박자별 시작·가운데·끝 스토리보드
import json, re, subprocess, sys
from pathlib import Path
EP = Path(sys.argv[1]); MP4 = Path(sys.argv[2])
FF = str(Path.home() / ".cache/shorts-tools/node_modules/ffmpeg-static/ffmpeg")
spec = json.loads((EP / "episode.json").read_text())
tm = json.loads((EP / "work/timing.json").read_text())
FPS, LEAD, TAIL, PAD = 30, 0.25, 0.35, 1.4
bounds, t = [], 0.0
for b in spec["beats"]:
    L = round((tm[b["id"]]["duration"] + LEAD + TAIL) * FPS) / FPS
    bounds.append((b["id"], t, t + L)); t += L
bounds.append(("end", t, t + round((tm["end"]["duration"] + PAD) * FPS) / FPS))
err = subprocess.run([FF, "-hide_banner", "-i", str(MP4), "-vn", "-af", "asetnsamples=441,astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.Peak_level", "-f", "null", "-"], capture_output=True, text=True).stderr
pk = [-120.0 if "inf" in v else float(v) for v in re.findall(r"Peak_level=([-0-9.inf]+)", err)]
d = re.search(r"Duration: (\d+):(\d+):([\d.]+)", err).groups(); D = int(d[1]) * 60 + float(d[2])
lu = subprocess.run([FF, "-hide_banner", "-i", str(MP4), "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
I = re.findall(r"I:\s+([-\d.]+) LUFS", lu)[-1]
print(f"길이 {D:.1f}초 (예상 {bounds[-1][2]:.1f}), 크기 {MP4.stat().st_size/1e6:.1f}MB, 최대 {max(pk):.1f}dB, 평균 {I} LUFS")
probs = []
if max(pk) > -1: probs.append("최대 음량 -1dB 초과")
for name, a, _ in bounds[1:]:
    i = int(a * 100); win = pk[max(0, i - 15): i + 15]; ctx = pk[max(0, i - 60): i - 15] + pk[i + 15: i + 60]
    if win and ctx and max(win) > sorted(ctx)[len(ctx) // 2] + 18: probs.append(f"{name} 경계({a:.2f}s) 튀는 소리 {max(win):.1f}dB")
print("문제:", probs or "없음")
R = EP / "work/review"; rows = []
for name, a, b in bounds:
    outs = []
    for k, tt in enumerate([a + 0.15, (a + b) / 2, b - 0.15]):
        o = R / f"_sb_{name}_{k}.png"; subprocess.run([FF, "-y", "-loglevel", "error", "-ss", f"{tt:.2f}", "-i", str(MP4), "-frames:v", "1", "-vf", "scale=270:-1", str(o)]); outs.append(o)
    rows.append(outs)
args = []
for r in rows:
    for o in r: args += ["-i", str(o)]
n = len(rows); fc = "".join(f"[{i*3}][{i*3+1}][{i*3+2}]hstack=3[r{i}];" for i in range(n)) + "".join(f"[r{i}]" for i in range(n)) + f"vstack={n}"
# 2단으로: 너무 길어서 위·아래 반씩
half = (n + 1) // 2
fc = "".join(f"[{i*3}][{i*3+1}][{i*3+2}]hstack=3[r{i}];" for i in range(n)) + "".join(f"[r{i}]" for i in range(half)) + f"vstack={half}[L];" + "".join(f"[r{i}]" for i in range(half, n)) + f"vstack={n-half}[Rr];[Rr]pad=iw:{half}*480:0:0[R2];[L][R2]hstack=2"
subprocess.run([FF, "-y", "-loglevel", "error", *args, "-filter_complex", fc, str(R / "storyboard.png")], check=True)
for name, a, b in bounds: print(f"  {name}: {a:.1f}–{b:.1f}초")
print("→", R / "storyboard.png")
