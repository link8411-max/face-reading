# 쇼츠 조립: episode.json + assets/ + work/voice/nar_*.wav → work/final.mp4, <ep>/<name>-small.mp4(30MB 이하)
#   python3 scripts/shorts/build.py docs/videos/ep02        (ONLY=s03,s05 이면 그 장면만 다시)
# 장면 종류(kind): clip(Veo 클립, 여러 개 이어 붙이기 가능) · image(그림+천천히 확대) · swap(그림 → 둘째 그림, 자막 묶음 swap_at부터)
import json, os, re, subprocess, sys
from pathlib import Path

EP = Path(sys.argv[1]).resolve()
SPEC = json.loads((EP / "episode.json").read_text())
A, V, W = EP / "assets", EP / "work/voice", EP / "work/build"
W.mkdir(parents=True, exist_ok=True)
FF = os.environ.get("FF") or str(Path.home() / ".cache/shorts-tools/node_modules/ffmpeg-static/ffmpeg")
FONT = "/System/Library/Fonts/AppleSDGothicNeo.ttc"
PORTRAITS = Path(__file__).resolve().parents[2] / "public/images/samguk"
FPS = 30

def run(args):
    subprocess.run([FF, "-y", "-loglevel", "error", *args], check=True)

def dur(path):
    out = subprocess.run([FF, "-hide_banner", "-i", str(path)], capture_output=True, text=True).stderr
    h, m, s = re.search(r"Duration: (\d+):(\d+):([\d.]+)", out).groups()
    return int(h) * 3600 + int(m) * 60 + float(s)

def esc(t):
    return t.replace("\\", "\\\\").replace(":", "\\:").replace("'", "’").replace("%", "\\%").replace(",", "\\,")

def text(t, y, size, color="white", x="(w-text_w)/2", extra=""):
    return (f"drawtext=fontfile='{FONT}':text='{esc(t)}':fontsize={size}:fontcolor={color}:borderw={max(3, size // 10)}:"
            f"bordercolor=black@0.85:x={x}:y={y}{extra}")

# 위쪽 제목 띠 + 사이트 워터마크(쇼츠 버튼·자막 자리와 겹치지 않는 곳)
TITLE = ("drawbox=x=0:y=120:w=iw:h=150:color=black@0.45:t=fill,"
         + text(SPEC["title"], 135, 76, "0xE8B547") + ","
         + text(SPEC["subtitle"], 222, 42) + ","
         + f"drawtext=fontfile='{FONT}':text='{esc(SPEC.get('watermark', 'unse-ai.com'))}':fontsize=34:fontcolor=white@0.75:"
           f"borderw=3:bordercolor=black@0.6:x=(w-text_w)/2:y=290")

def group_times(groups, d, delay=0.3):
    total = sum(len("".join(g)) for g in groups)
    span, t, out = d - delay - 0.5, delay, []
    for g in groups:
        t1 = t + span * len("".join(g)) / total
        out.append((t, t1))
        t = t1
    return out

def captions(groups, d):
    """자막 묶음을 글자 수 비율로 해설 시간에 나눠 차례로 보여 준다."""
    parts, times = [], group_times(groups, d)
    for gi, (g, (t0, t1)) in enumerate(zip(groups, times)):
        end = d if gi == len(groups) - 1 else t1
        for i, ln in enumerate(g):
            parts.append(text(ln, 1360 + i * 80, 58, extra=f":enable='between(t\\,{t0:.2f}\\,{end:.2f})'"))
    return ",".join(parts)

ENC = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-r", str(FPS), "-pix_fmt", "yuv420p",
       "-c:a", "aac", "-ar", "44100", "-ac", "2", "-b:a", "160k"]
FADE = lambda d: f"fade=t=in:st=0:d=0.2,fade=t=out:st={d-0.2:.2f}:d=0.2"
NARMIX = lambda i, d: f"[{i}:a]adelay=300|300,apad,afade=t=in:d=0.2,afade=t=out:st={d-0.35:.2f}:d=0.35[a]"
KEN = lambda n, z0=1.0, z1=1.12: (f"scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,scale=2160:3840,"
                                  f"zoompan=z='{z0}+{z1 - z0}*on/{n}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={n}:s=1080x1920:fps={FPS}")

def seg_clip(sc, nar, d, out):
    """Veo 클립(여러 개면 이어서) + 해설. 해설이 길면 클립을 최대 1.7배까지 늘리고 마지막 장면을 잡아 둔다."""
    srcs = sc["src"] if isinstance(sc["src"], list) else [sc["src"]]
    clips = [(s, 99) if isinstance(s, str) else (s[0], s[1]) for s in srcs]
    cds = [min(dur(A / c), cut) for c, cut in clips]
    k = min(max(d / sum(cds), 1.0), 1.7)
    ins, vp, ap = ["-i", str(nar)], [], []
    for i, (c, _) in enumerate(clips):
        ins += ["-i", str(A / c)]
        n = i + 1
        vp.append(f"[{n}:v]trim=0:{cds[i]:.2f},setpts={k:.3f}*(PTS-STARTPTS),scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps={FPS},format=yuv420p[v{i}]")
        ap.append(f"[{n}:a]atrim=0.12:{cds[i]:.2f},asetpts=PTS-STARTPTS,atempo={1/k:.3f},afade=t=in:d=0.15,afade=t=out:st={max(cds[i]*k-0.4, 0.1):.2f}:d=0.3[c{i}]")
    m = len(clips)
    fc = (";".join(vp + ap) + ";"
          + "".join(f"[v{i}]" for i in range(m)) + f"concat=n={m}:v=1:a=0,tpad=stop_mode=clone:stop_duration=8,{TITLE},{captions(sc['captions'], d)},{FADE(d)}[v];"
          + "".join(f"[c{i}]" for i in range(m)) + f"concat=n={m}:v=0:a=1,volume={sc.get('bg_volume', 0.22)},apad[bg];[0:a]adelay=300|300,apad[nr];"
          f"[bg][nr]amix=inputs=2:duration=longest:normalize=0,afade=t=in:d=0.3,afade=t=out:st={d-0.45:.2f}:d=0.45[a]")
    run([*ins, "-filter_complex", fc, "-map", "[v]", "-map", "[a]", "-t", str(d), *ENC, str(out)])

def seg_image(sc, nar, d, out):
    n = int(d * FPS)
    fc = f"[0:v]{KEN(n)},{TITLE},{captions(sc['captions'], d)},{FADE(d)},format=yuv420p[v];" + NARMIX(1, d)
    run(["-loop", "1", "-i", str(A / sc["src"]), "-i", str(nar), "-filter_complex", fc, "-map", "[v]", "-map", "[a]", "-t", str(d), *ENC, str(out)])

def seg_swap(sc, nar, d, out):
    sw = round(group_times(sc["captions"], d)[sc.get("swap_at", 1)][0], 2)
    n1, n2 = int((sw + 0.5) * FPS), int((d - sw + 0.5) * FPS)
    fc = (f"[0:v]{KEN(n1)},trim=duration={sw+0.5},setpts=PTS-STARTPTS[a];[2:v]{KEN(n2, 1.08, 1.0)},trim=duration={d-sw+0.5},setpts=PTS-STARTPTS[b];"
          f"[a][b]xfade=transition=fade:duration=0.5:offset={sw},{TITLE},{captions(sc['captions'], d)},{FADE(d)},format=yuv420p[v];" + NARMIX(1, d))
    run(["-loop", "1", "-i", str(A / sc["src"][0]), "-i", str(nar), "-loop", "1", "-i", str(A / sc["src"][1]),
         "-filter_complex", fc, "-map", "[v]", "-map", "[a]", "-t", str(d), *ENC, str(out)])

def seg_end(end, nar, out):
    """끝 화면: 초상화(1~4장) + 문구 + 주소."""
    d = round(dur(nar) + 1.4, 2)
    names = end["portraits"]
    size = 440 if len(names) <= 2 else 360
    pos = {1: [(320, 420)], 2: [(80, 420), (560, 420)]}.get(len(names), [(150, 360), (570, 360), (150, 800), (570, 800)])[:len(names)]
    fc = "".join(f"[{i+1}:v]scale={size}:{size}:flags=neighbor[p{i}];" for i in range(len(names)))
    prev = "0:v"
    for i, (x, y) in enumerate(pos):
        fc += f"[{prev}][p{i}]overlay={x}:{y}[o{i}];"
        prev = f"o{i}"
    labels = [text(nm, y + size + 10, 46, "0xE8B547", f"{x + size // 2}-text_w/2") for nm, (x, y) in zip(names, pos)]
    y0 = max(y for _, y in pos) + size + 120
    lines = [text(t, y0 + i * 105, s, c) for i, (t, s, c) in enumerate(
        [(end["lines"][0], 66, "white"), *[(t, 46, "white") for t in end["lines"][1:]], (end["url"], 78, "0xE8B547")])]
    fc += f"[{prev}]" + ",".join(labels + lines) + f",fade=t=in:st=0:d=0.3,format=yuv420p[v];"
    fc += f"[{len(names)+1}:a]adelay=300|300,apad,afade=t=in:d=0.2,afade=t=out:st={d-0.5:.2f}:d=0.5[a]"
    ins = sum((["-i", str(PORTRAITS / f"{nm}.jpg")] for nm in names), [])
    run(["-f", "lavfi", "-i", f"color=c=0x23263A:s=1080x1920:d={d}:r={FPS}", *ins, "-i", str(nar),
         "-filter_complex", fc, "-map", "[v]", "-map", "[a]", "-t", str(d), *ENC, str(out)])
    return d

only = os.environ.get("ONLY", "").split(",") if os.environ.get("ONLY") else None
segs = []
for sc in SPEC["scenes"]:
    nar, out = V / f"nar_{sc['id']}.wav", W / f"{sc['id']}.mp4"
    if not only or sc["id"] in only:
        d = round(dur(nar) + 0.6, 2)
        {"clip": seg_clip, "image": seg_image, "swap": seg_swap}[sc["kind"]](sc, nar, d, out)
        print(sc["id"], sc["kind"], d)
    segs.append(out)
end_out = W / "end.mp4"
if not only or "end" in only:
    print("end", seg_end(SPEC["end"], V / "nar_end.wav", end_out))
segs.append(end_out)

# 소리째 다시 인코딩하며 잇는다(-c copy로 이으면 이음새 잡음)
args = sum((["-i", str(s)] for s in segs), [])
fc = "".join(f"[{i}:v][{i}:a]" for i in range(len(segs))) + f"concat=n={len(segs)}:v=1:a=1[v][a0];[a0]aresample=async=1,highpass=f=40,alimiter=limit=0.95[a]"
final = W / "final.mp4"
run([*args, "-filter_complex", fc, "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-c:a", "aac", "-b:a", "192k", str(final)])
small = EP / f"{SPEC['name']}-small.mp4"
for crf in (28, 30, 32, 34):
    run(["-i", str(final), "-c:v", "libx264", "-preset", "slow", "-crf", str(crf), "-c:a", "aac", "-b:a", "128k", str(small)])
    if small.stat().st_size < 29e6:
        break
print(final, f"{dur(final):.1f}초", f"{small.stat().st_size/1e6:.1f}MB", small)
