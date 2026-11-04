# 8차 TTS pcm → nar_<id>.wav: 끝에 붙는 큰 잡음 덩어리를 자르고 앞뒤 무음 정리
import subprocess, os, re, sys
S = os.path.dirname(os.path.abspath(__file__))
FF = os.environ["FF"]
V = os.path.join(S, "../work/voice")

def peaks(path, win=1200):
    out = subprocess.run([FF, "-hide_banner", "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", path, "-af",
                          f"asetnsamples={win},astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.Peak_level",
                          "-f", "null", "-"], capture_output=True, text=True).stderr
    return [float(v) if "inf" not in v else -200.0 for v in re.findall(r"Peak_level=([-0-9.inf]+)", out)]

starts = {k: float(v) for k, v in (a.split("=") for a in sys.argv[1:])}  # id=문장 시작 초(지시문을 읽은 경우)
for f in sorted(os.listdir(V)):
    if not f.endswith(".pcm"):
        continue
    i = f[3:-4]
    p = os.path.join(V, f)
    total = os.path.getsize(p) / 48000
    pk = peaks(p)
    end = total
    j = len(pk) - 1
    while j >= 0 and pk[j] > -6:
        j -= 1
    if j < len(pk) - 1 and pk[j] < -45:
        end = (j + 1) * 0.05
    out = os.path.join(V, f"nar_{i}.wav")
    subprocess.run([FF, "-y", "-loglevel", "error", "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", p,
                    "-af", f"atrim=start={starts.get(i, 0)}:end={end},asetpts=PTS-STARTPTS,"
                           "silenceremove=start_periods=1:start_threshold=-40dB,areverse,silenceremove=start_periods=1:start_threshold=-40dB,areverse,"
                           "atempo=1.1,afade=t=in:d=0.04,areverse,afade=t=in:d=0.08,areverse",
                    "-ar", "44100", "-ac", "2", out], check=True)
    print(i, f"총 {total:.2f}s, 자른 끝 {end:.2f}s")
