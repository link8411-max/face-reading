# 클립 검수: Veo 클립마다 1초 간격 프레임을 한 줄로 모아 work/review/<id>.png로 만든다.
# 조립 전에 이 그림을 직접 보고, 해설이 말하는 일이 화면에 실제로 일어나는지 확인한다(화살이 꽂히는지, 다치기 전 안대가 없는지 등).
#   python3 scripts/shorts/review.py docs/videos/ep02
import json, os, subprocess, sys
from pathlib import Path

EP = Path(sys.argv[1]).resolve()
SPEC = json.loads((EP / "episode.json").read_text())
A, R = EP / "assets", EP / "work/review"
R.mkdir(parents=True, exist_ok=True)
FF = os.environ.get("FF") or str(Path.home() / ".cache/shorts-tools/node_modules/ffmpeg-static/ffmpeg")

for sc in SPEC["scenes"]:
    if sc["kind"] != "clip":
        continue
    srcs = sc["src"] if isinstance(sc["src"], list) else [sc["src"]]
    for s in srcs:
        name = s if isinstance(s, str) else s[0]
        out = R / f"{sc['id']}_{Path(name).stem}.png"
        subprocess.run([FF, "-y", "-loglevel", "error", "-i", str(A / name), "-vf",
                        "fps=1,scale=180:-1,tile=8x1:padding=4:color=black", "-frames:v", "1", str(out)], check=True)
        print(f"{sc['id']}  해설: {sc['narration'][:60]}…")
        print(f"     확인할 것: {sc.get('must_show', '해설 내용이 화면에 보이는지')}")
        print(f"     {out}")
print("\n각 그림을 열어 '확인할 것'이 실제 프레임에 있는지 본 뒤 build.py로 넘어간다. 없으면 그 클립만 다시 만든다.")
