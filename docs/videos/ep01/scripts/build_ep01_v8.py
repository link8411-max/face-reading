# 8차 판 조립: 13장면(세력도·융중·방통 추가) → work/ep01-chibi-v8.mp4, ../ep01-chibi-v8-small.mp4
# FF=<ffmpeg 경로> python3 docs/videos/ep01/scripts/build_ep01_v8.py
import subprocess, os, re
S = os.path.dirname(os.path.abspath(__file__))
EP = os.path.dirname(S)
A = os.path.join(EP, "assets")
V = os.path.join(EP, "work/voice")
W = os.path.join(EP, "work/v8")
FF = os.environ["FF"]
FONT = "/System/Library/Fonts/AppleSDGothicNeo.ttc"
PORTRAITS = "/Users/hongseong-il/Documents/face-reading/public/images/samguk"
FPS = 30
os.makedirs(W, exist_ok=True)

def dur(path):
    out = subprocess.run([FF, "-hide_banner", "-i", path], capture_output=True, text=True).stderr
    h, m, s = re.search(r"Duration: (\d+):(\d+):([\d.]+)", out).groups()
    return int(h) * 3600 + int(m) * 60 + float(s)

def esc(t):
    return t.replace("\\", "\\\\").replace(":", "\\:").replace("'", "’").replace("%", "\\%").replace(",", "\\,")

TITLE = (f"drawbox=x=0:y=120:w=iw:h=150:color=black@0.45:t=fill,"
         f"drawtext=fontfile='{FONT}':text='적벽대전':fontsize=76:fontcolor=0xE8B547:borderw=4:bordercolor=black:x=(w-text_w)/2:y=135,"
         f"drawtext=fontfile='{FONT}':text='{esc('조조는 왜 불탔을까?')}':fontsize=42:fontcolor=white:x=(w-text_w)/2:y=222")

def captions(groups, d, delay=0.3, y0=1360, size=58, gap=80):
    """자막 묶음을 글자 수 비율로 해설 시간에 나눠 차례로 보여 준다."""
    total = sum(len("".join(g)) for g in groups)
    span = d - delay - 0.5
    t, parts = delay, []
    for gi, g in enumerate(groups):
        t1 = t + span * len("".join(g)) / total
        end = d if gi == len(groups) - 1 else t1
        for i, ln in enumerate(g):
            parts.append(f"drawtext=fontfile='{FONT}':text='{esc(ln)}':fontsize={size}:fontcolor=white:borderw=6:bordercolor=black@0.85:"
                         f"x=(w-text_w)/2:y={y0 + i * gap}:enable='between(t\\,{t:.2f}\\,{end:.2f})'")
        t = t1
    return ",".join(parts)

def group_start(groups, d, idx, delay=0.3):
    total = sum(len("".join(g)) for g in groups)
    return delay + (d - delay - 0.5) * sum(len("".join(g)) for g in groups[:idx]) / total

ENC = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-r", str(FPS), "-pix_fmt", "yuv420p",
       "-c:a", "aac", "-ar", "44100", "-ac", "2", "-b:a", "160k"]
FADE = lambda d: f"fade=t=in:st=0:d=0.2,fade=t=out:st={d-0.2:.2f}:d=0.2"
NARMIX = lambda d: f"[1:a]adelay=300|300,apad,afade=t=in:d=0.2,afade=t=out:st={d-0.35:.2f}:d=0.35[a]"

def seg_clips(out, clips, nar, groups):
    """Veo 클립(여러 개면 이어서) + 해설. 해설이 길면 마지막 클립을 늘린다."""
    d = round(dur(nar) + 0.6, 2)
    ins, vparts, aparts = [], [], []
    cds = [min(dur(os.path.join(A, c)), cut) for c, cut in clips]
    k = min(max(d / sum(cds), 1.0), 1.7)
    for i, (c, cut) in enumerate(clips):
        ins += ["-i", os.path.join(A, c)]
        n = i + 1
        vparts.append(f"[{n}:v]trim=0:{cds[i]:.2f},setpts={k:.3f}*(PTS-STARTPTS),scale=1080:1920:flags=lanczos,fps={FPS},format=yuv420p[v{i}]")
        aparts.append(f"[{n}:a]atrim=0.12:{cds[i]:.2f},asetpts=PTS-STARTPTS,atempo={1/k:.3f},afade=t=in:d=0.15,"
                      f"afade=t=out:st={max(cds[i]*k-0.4, 0.1):.2f}:d=0.3[c{i}]")
    m = len(clips)
    vcat = "".join(f"[v{i}]" for i in range(m)) + f"concat=n={m}:v=1:a=0,tpad=stop_mode=clone:stop_duration=8"
    acat = "".join(f"[c{i}]" for i in range(m)) + f"concat=n={m}:v=0:a=1"
    fc = (";".join(vparts) + ";" + ";".join(aparts) + ";"
          f"{vcat},{TITLE},{captions(groups, d)},{FADE(d)}[v];"
          f"{acat},volume=0.22,apad[bg];[0:a]adelay=300|300,apad[nr];"
          f"[bg][nr]amix=inputs=2:duration=longest:normalize=0,afade=t=in:d=0.3,afade=t=out:st={d-0.45:.2f}:d=0.45[a]")
    subprocess.run([FF, "-y", "-loglevel", "error", "-i", nar, *ins, "-filter_complex", fc,
                    "-map", "[v]", "-map", "[a]", "-t", str(d), *ENC, out], check=True)
    return d

def kenburns(n, z0=1.0, z1=1.12):
    return (f"scale=2160:3840,zoompan=z='{z0}+{z1 - z0}*on/{n}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={n}:s=1080x1920:fps={FPS}")

def seg_map(out, nar, groups, arrow_start, arrow_len):
    d = round(dur(nar) + 0.6, 2)
    n = int(d * FPS)
    fr = 40 / arrow_len
    # 화살표 레이어를 먼저 얹고, 그다음 한꺼번에 천천히 확대(d=1이라 프레임마다 하나씩)
    fc = (f"[2:v]fps={FPS},setpts=PTS-STARTPTS+{arrow_start}/TB[ar];"
          f"[0:v][ar]overlay=0:0:eof_action=repeat,scale=2160:3840,"
          f"zoompan=z='1+0.06*in/{n}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps={FPS},"
          f"{TITLE},{captions(groups, d)},{FADE(d)},format=yuv420p[v];"
          + NARMIX(d))
    subprocess.run([FF, "-y", "-loglevel", "error", "-loop", "1", "-framerate", str(FPS), "-i", os.path.join(A, "map_m208_start.png"),
                    "-i", nar, "-framerate", f"{fr:.3f}", "-i", os.path.join(A, "map_arrow/a%03d.png"),
                    "-filter_complex", fc, "-map", "[v]", "-map", "[a]", "-t", str(d), *ENC, out], check=True)
    return d

def seg_end3(out, nar, groups):
    """퇴각 그림 → 삼국 세력도로 넘어간다 (자막 3번째 묶음부터)."""
    d = round(dur(nar) + 0.6, 2)
    sw = round(group_start(groups, d, 2), 2)
    n1, n2 = int((sw + 0.5) * FPS), int((d - sw + 0.5) * FPS)
    fc = (f"[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,{kenburns(n1)},trim=duration={sw+0.5},setpts=PTS-STARTPTS[a];"
          f"[2:v]{kenburns(n2, 1.08, 1.0)},trim=duration={d-sw+0.5},setpts=PTS-STARTPTS[b];"
          f"[a][b]xfade=transition=fade:duration=0.5:offset={sw},{TITLE},{captions(groups, d)},{FADE(d)},format=yuv420p[v];"
          + NARMIX(d))
    subprocess.run([FF, "-y", "-loglevel", "error", "-loop", "1", "-i", os.path.join(A, "scene7.png"), "-i", nar,
                    "-loop", "1", "-i", os.path.join(A, "map_m3k.png"),
                    "-filter_complex", fc, "-map", "[v]", "-map", "[a]", "-t", str(d), *ENC, out], check=True)
    return d

def seg_end(out, nar):
    d = round(dur(nar) + 1.4, 2)
    cap = lambda t, y, s, col="white": (f"drawtext=fontfile='{FONT}':text='{esc(t)}':fontsize={s}:fontcolor={col}:borderw=5:"
                                        f"bordercolor=black@0.85:x=(w-text_w)/2:y={y}")
    fc = ("[1:v]scale=440:440:flags=neighbor[p1];[2:v]scale=440:440:flags=neighbor[p2];"
          "[0:v][p1]overlay=80:470[t1];[t1][p2]overlay=560:470,"
          + cap("조조", 925, 54, "0xE8B547") .replace("x=(w-text_w)/2", "x=300-text_w/2") + ","
          + cap("제갈량", 925, 54, "0xE8B547").replace("x=(w-text_w)/2", "x=780-text_w/2") + ","
          + cap("여러분은 조조일까요, 제갈량일까요?", 1120, 62) + ","
          + cap("얼굴 사진 한 장으로 확인하기", 1225, 50) + ","
          + cap("unse-ai.com/samguk", 1380, 78, "0xE8B547")
          + f",fade=t=in:st=0:d=0.3,format=yuv420p[v];"
          + f"[3:a]adelay=300|300,apad,afade=t=in:d=0.2,afade=t=out:st={d-0.5:.2f}:d=0.5[a]")
    subprocess.run([FF, "-y", "-loglevel", "error", "-f", "lavfi", "-i", f"color=c=0x23263A:s=1080x1920:d={d}:r={FPS}",
                    "-i", os.path.join(PORTRAITS, "조조.jpg"), "-i", os.path.join(PORTRAITS, "제갈량.jpg"), "-i", nar,
                    "-filter_complex", fc, "-map", "[v]", "-map", "[a]", "-t", str(d), *ENC, out], check=True)
    return d

nar = lambda i: os.path.join(V, f"nar_{i}.wav")
old = lambda i: os.path.join(A, f"nar{i}.wav")
FULL = 99
plan = [
    ("s01", lambda o: seg_clips(o, [("clip1.mp4", FULL)], nar("hook"),
        [["여러분, 수십만 대군이요.", "단 한 번의 불길에 무너집니다."], ["그런데 이 불이,", "천하를 셋으로 나눴다는 거 아세요?"]])),
    ("s02", lambda o: seg_map(o, nar("map"),
        [["때는 208년.", "지도 좀 보세요."], ["북쪽은 전부 조조 땅이에요."], ["남은 건 형주와 강동,", "그리고 땅 한 뼘 없는 유비뿐."],
         ["마침 형주의 주인 유표가", "세상을 떠납니다."], ["조조는 이때다 하고,", "대군을 몰아 남쪽으로 내려오죠."]], 12.4, 4.6)),
    ("s04", lambda o: seg_clips(o, [("clip_yz.mp4", FULL)], nar("yz"),
        [["그런데요, 그 한 해 전."], ["제갈량은 유비에게", "이런 그림을 보여 줬어요."],
         ["“형주와 익주를 얻고,", "손권과 손잡아 조조와 맞서십시오.”"], ["천하를 셋으로", "나누자는 거였죠."]])),
    ("s05", lambda o: seg_clips(o, [("clip3.mp4", FULL)], old(2),
        [["그런데요, 여기서", "첫 번째 문제가 터집니다."], ["북쪽 병사들은", "배를 탈 줄 몰랐어요."], ["배는 흔들리지, 속은 뒤집히지,", "거기다 병까지 돕니다."]])),
    ("s06", lambda o: seg_clips(o, [("clip_pang.mp4", 5.6), ("clip4.mp4", FULL)], nar("chain"),
        [["연의에서는 이때 방통이 찾아와,", "배를 쇠사슬로 묶으라고 권합니다."], ["흔들림은 확 줄었죠."], ["그런데요,", "이게 함정이었어요."]])),
    ("s08", lambda o: seg_clips(o, [("clip5.mp4", FULL)], old(4),
        [["자, 그런데 말이죠.", "붙어 있는 배는 도망칠 수가 없어요."], ["오나라의 노장 황개,", "바로 이 틈을 노립니다."]])),
    ("s09", lambda o: seg_clips(o, [("clip7b.mp4", FULL)], nar("wind"),
        [["그런데 또 문제가 생깁니다.", "겨울 장강엔 북서풍이 불어요."], ["불을 놓으면,", "오히려 우리 쪽이 탑니다."], ["연의에서는 주유가", "걱정 끝에 쓰러지죠."]])),
    ("s10", lambda o: seg_clips(o, [("clip8b.mp4", FULL)], nar("altar"),
        [["연의에서는 제갈량이", "제단을 쌓고 바람을 부릅니다."], ["실제 기록에도 그날", "동남풍이 거셌다고 나와요."]])),
    ("s11", lambda o: seg_clips(o, [("clip6.mp4", FULL)], nar("ram"),
        [["황개는 항복하는 척 다가가,", "불붙인 배로 그대로 들이받죠!"]])),
    ("s12", lambda o: seg_end3(o, nar("end3"),
        [["이것이 바로 적벽대전입니다!"], ["조조는 북쪽으로 물러나고,", "유비는 형주를 얻죠."],
         ["그리고 결국,", "제갈량이 그린 그림대로"], ["천하는 위, 촉, 오,", "셋으로 나뉩니다."]])),
    ("s13", lambda o: seg_end(o, nar("cta"))),
]

segs = []
only = os.environ.get("ONLY")
for name, fn in plan:
    out = os.path.join(W, name + ".mp4")
    if not only or name in only.split(","):
        print(name, fn(out))
    segs.append(out)

args = [FF, "-y", "-loglevel", "error"]
for s in segs:
    args += ["-i", s]
parts = "".join(f"[{i}:v][{i}:a]" for i in range(len(segs)))
fc = f"{parts}concat=n={len(segs)}:v=1:a=1[v][a0];[a0]aresample=async=1,highpass=f=40,alimiter=limit=0.95[a]"
final = os.path.join(W, "ep01-chibi-v8.mp4")
subprocess.run(args + ["-filter_complex", fc, "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
                       "-c:a", "aac", "-b:a", "192k", final], check=True)
small = os.path.join(EP, "ep01-chibi-v8-small.mp4")
subprocess.run([FF, "-y", "-loglevel", "error", "-i", final, "-c:v", "libx264", "-preset", "veryfast", "-crf", "28", "-c:a", "copy", small], check=True)
print(final, dur(final), os.path.getsize(small) / 1e6, "MB")
