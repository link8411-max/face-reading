# 완성본 검사: 장면 경계 소리, 혼자 튀는 소리, 최대 음량, 길이·크기, 장면별 정지 화면 모음(work/sheet.png)
#   python3 scripts/shorts/check.py docs/videos/ep02
import json, os, re, subprocess, sys
from pathlib import Path

EP = Path(sys.argv[1]).resolve()
SPEC = json.loads((EP / "episode.json").read_text())
W = EP / "work/build"
FF = os.environ.get("FF") or str(Path.home() / ".cache/shorts-tools/node_modules/ffmpeg-static/ffmpeg")
final = W / "final.mp4"

def dur(path):
    out = subprocess.run([FF, "-hide_banner", "-i", str(path)], capture_output=True, text=True).stderr
    h, m, s = re.search(r"Duration: (\d+):(\d+):([\d.]+)", out).groups()
    return int(h) * 3600 + int(m) * 60 + float(s)

out = subprocess.run([FF, "-hide_banner", "-i", str(final), "-vn", "-af",
                      "asetnsamples=441,astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.Peak_level",
                      "-f", "null", "-"], capture_output=True, text=True).stderr
pk = [-120.0 if "inf" in v else float(v) for v in re.findall(r"Peak_level=([-0-9.inf]+)", out)]
ids = [s["id"] for s in SPEC["scenes"]] + ["end"]
lens = [dur(W / f"{i}.mp4") for i in ids]
problems = []
print(f"길이 {dur(final):.1f}초, 최대 음량 {max(pk):.1f}dB")
if max(pk) > -1:
    problems.append("최대 음량이 -1dB를 넘음")
# 장면 경계 ±0.15초 안에서 앞뒤보다 확 큰 10ms 조각(딸깍)을 찾는다
t = 0
for i, L in enumerate(lens[:-1]):
    t += L
    c = int(t * 100)
    w = pk[c - 15:c + 15]
    clicks = [k for k in range(2, len(w) - 2) if w[k] > -35 and max(w[k-2:k]) < w[k] - 25 and max(w[k+1:k+3]) < w[k] - 25]
    print(f"  {ids[i]}→{ids[i+1]} {t:6.2f}s 경계 최대 {max(w):6.1f}dB {'딸깍 의심' if clicks else ''}")
    if clicks:
        problems.append(f"{ids[i]}→{ids[i+1]} 경계 딸깍")
# 전체에서 혼자 튀는 10ms 조각(말소리 자음은 -30dB 아래라 거슬리지 않음)
iso = [i / 100 for i in range(3, len(pk) - 3) if pk[i] > -25 and max(pk[i-3:i]) < -50 and max(pk[i+2:i+4]) < -50]
print("혼자 튀는 소리:", iso or "없음")
problems += [f"{s}초 튐" for s in iso]
small = EP / f"{SPEC['name']}-small.mp4"
mb = small.stat().st_size / 1e6
print(f"압축본 {mb:.1f}MB")
if mb > 30:
    problems.append("압축본 30MB 초과")
# 장면마다 가운데 프레임 한 장씩 모아 한 장으로
t, frames = 0, []
for i, L in zip(ids, lens):
    f = W / f"_f_{i}.png"
    subprocess.run([FF, "-y", "-loglevel", "error", "-ss", f"{t + L / 2:.2f}", "-i", str(final), "-frames:v", "1", "-vf", "scale=216:384", str(f)], check=True)
    frames.append(f)
    t += L
cols = min(len(frames), 7)
subprocess.run([FF, "-y", "-loglevel", "error", *sum((["-i", str(f)] for f in frames), []), "-filter_complex",
                "".join(f"[{i}:v]" for i in range(len(frames))) + f"xstack=inputs={len(frames)}:layout="
                + "|".join(f"{(i % cols) * 216}_{(i // cols) * 384}" for i in range(len(frames))) + ":fill=black",
                str(EP / "work/sheet.png")], check=True)
for f in frames:
    f.unlink()
print("정지 화면 모음:", EP / "work/sheet.png")
print("문제 없음" if not problems else "문제: " + ", ".join(problems))
sys.exit(1 if problems else 0)
