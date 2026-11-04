# 장면 검수: 조립된 장면(work/build/<id>.mp4)마다 0.25초 간격 프레임을 모아 work/review/<id>.png로 만들고,
# 피처럼 보이는 붉은 튐(자동 검사는 보조일 뿐, 작은 피는 놓칠 수 있다)(앞뒤 프레임보다 갑자기 붉은 화소가 늘어난 프레임)을 자동으로 찾는다.
# Claude는 그림을 직접 열어 ① 첫 프레임이 must_show의 '시작' 상태인지 ② 동작이 한 번만, 해설 순서대로 일어나는지
# (빼고 다시 박기 같은 되감기 없음) ③ 붉은 튐 경고 프레임에 피가 없는지 확인한 뒤에만 사용자에게 보낸다.
#   python3 scripts/shorts/review.py docs/videos/ep02   (build.py 다음에 실행)
import json, os, subprocess, sys
from pathlib import Path

EP = Path(sys.argv[1]).resolve()
SPEC = json.loads((EP / "episode.json").read_text())
B, R = EP / "work/build", EP / "work/review"
R.mkdir(parents=True, exist_ok=True)
FF = os.environ.get("FF") or str(Path.home() / ".cache/shorts-tools/node_modules/ffmpeg-static/ffmpeg")
STEP = 0.25

def red_ratio(seg):
    """프레임마다 '진한 빨강' 화소 비율(작게 줄여 계산). 붉은 하늘처럼 계속 붉은 장면은 앞뒤 차이로 거른다."""
    W, H = 270, 480
    raw = subprocess.run([FF, "-loglevel", "error", "-i", str(seg), "-vf", f"fps={1/STEP},scale={W}:{H}", "-f", "rawvideo",
                          "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
    size, out = W * H * 3, []
    for i in range(0, len(raw) - size + 1, size):
        f, n = raw[i:i + size], 0
        for j in range(0, size, 3):
            r, g, b = f[j], f[j + 1], f[j + 2]
            if r > 100 and r > g * 1.8 and r > b * 1.8:
                n += 1
        out.append(n / (W * H) * 1000)  # 천분율
    return out

warn = []
for sc in SPEC["scenes"]:
    seg = B / f"{sc['id']}.mp4"
    out = R / f"{sc['id']}.png"
    subprocess.run([FF, "-y", "-loglevel", "error", "-i", str(seg), "-vf",
                    f"fps={1/STEP},scale=120:-1,drawtext=fontfile=/System/Library/Fonts/Menlo.ttc:text='%{{pts\\:hms}}':x=4:y=4:fontsize=14:fontcolor=yellow,"
                    "tile=10x5:padding=3:color=black", "-frames:v", "1", str(out)], check=True)
    rr = red_ratio(seg)
    # 장면 앞뒤 페이드(0.5초)는 빼고, 앞뒤 평균보다 1.6배 넘게 붉은 화소가 늘면 의심(불꽃·번쩍임도 걸리므로 경고만 하고 판단은 눈으로)
    spikes = [round(i * STEP, 2) for i in range(3, len(rr) - 3) if rr[i] > 0.3 and rr[i] > 1.6 * (rr[i - 1] + rr[i + 1]) / 2]
    print(f"{sc['id']} ({sc['kind']})  {out}")
    print(f"   확인할 것: {sc.get('must_show', '해설 내용이 화면에 보이는지')}")
    if spikes:
        print(f"   ⚠ 붉은 튐 의심(초): {spikes}  → 확대해서 피인지 확인")
        warn.append(sc["id"])
print("\n붉은 튐 의심 장면:", warn or "없음")
print("그림마다 첫 프레임·동작 순서·되감기 여부를 직접 확인한다. 통과하지 못한 장면은 고친 뒤 ONLY=<id>로 다시 조립하고 이 검수를 다시 돌린다.")
