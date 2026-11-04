# 전체 시나리오 검사용 스토리보드: 장면마다 시작·가운데·끝 프레임 3장 + 해설·must_show를 한 줄로, 전 장면을 세로로 이어 work/storyboard.png
# Claude가 이 한 장을 보고 흐름(훅→전개→반전→마무리), 인물 연속성(다치기 전후 안대 등), 해설과 화면의 일치를 검사한다.
#   python3 scripts/shorts/storyboard.py docs/videos/ep02   (build.py 다음)
import json, os, re, subprocess, sys, textwrap
from pathlib import Path

EP = Path(sys.argv[1]).resolve()
SPEC = json.loads((EP / "episode.json").read_text())
B, R = EP / "work/build", EP / "work/review"
R.mkdir(parents=True, exist_ok=True)
FF = os.environ.get("FF") or str(Path.home() / ".cache/shorts-tools/node_modules/ffmpeg-static/ffmpeg")
FONT = "/System/Library/Fonts/AppleSDGothicNeo.ttc"

def dur(p):
    o = subprocess.run([FF, "-hide_banner", "-i", str(p)], capture_output=True, text=True).stderr
    h, m, s = re.search(r"Duration: (\d+):(\d+):([\d.]+)", o).groups()
    return int(h) * 3600 + int(m) * 60 + float(s)

def esc(t):
    return t.replace("\\", "\\\\").replace(":", "\\:").replace("'", "’").replace("%", "\\%").replace(",", "\\,")

rows, t0 = [], 0.0
scenes = SPEC["scenes"] + [{"id": "end", "kind": "end", "narration": SPEC["end"]["narration"], "must_show": "끝 화면 문구·주소"}]
for sc in scenes:
    seg = B / f"{sc['id']}.mp4"
    d = dur(seg)
    row = R / f"_row_{sc['id']}.png"
    text = textwrap.wrap(sc["narration"], 26)[:5] + [""] + textwrap.wrap("보여야 할 것: " + sc.get("must_show", "-"), 26)[:4]
    draws = ",".join(f"drawtext=fontfile='{FONT}':text='{esc(l)}':fontsize=22:fontcolor=white:x=20:y={50 + i * 32}" for i, l in enumerate(text) if l)
    head = f"drawtext=fontfile='{FONT}':text='{esc(sc['id'])}  {t0:.1f}–{t0 + d:.1f}초  ({sc['kind']})':fontsize=26:fontcolor=0xE8B547:x=20:y=12"
    shots = [max(0.35, d * 0.15), d * 0.5, d - 0.35]
    ins = sum((["-ss", f"{s:.2f}", "-i", str(seg)] for s in shots), [])
    fc = ";".join(f"[{i}:v]scale=200:356,setsar=1[f{i}]" for i in range(3))
    fc += f";color=c=0x1b1b1f:s=440x356:d=1[t];[t]{head},{draws}[tx];[f0][f1][f2][tx]hstack=4"
    subprocess.run([FF, "-y", "-loglevel", "error", *ins, "-filter_complex", fc, "-frames:v", "1", str(row)], check=True)
    rows.append(row)
    t0 += d
out = EP / "work/storyboard.png"
subprocess.run([FF, "-y", "-loglevel", "error", *sum((["-i", str(r)] for r in rows), []), "-filter_complex",
                "".join(f"[{i}:v]" for i in range(len(rows))) + f"vstack={len(rows)}", str(out)], check=True)
for r in rows:
    r.unlink()
print(out)
