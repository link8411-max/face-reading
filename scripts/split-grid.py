# 2x2 바둑판 초상화를 4장으로 자른다: /usr/bin/python3 scripts/split-grid.py grid.jpg 왼위 오위 왼아래 오아래
# 정확히 반으로 나누고 가장자리 검은 분리선을 걷어낸 뒤(초상화 배경도 검어서 선 위치를 찾기 어렵다), 각 칸을 1024x1024로 키워 같은 폴더에 한글이름.jpg로 저장한다.
import sys, os
from PIL import Image

def trim(im):
    # 칸 가장자리의 검은 분리선 띠를 걷어낸다
    g = im.convert('L'); w, h = g.size; px = g.load()
    def row(y): return sum(px[x, y] for x in range(w)) / w
    def col(x): return sum(px[x, y] for y in range(h)) / h
    t, b, l, r = 0, h, 0, w
    while t < h * 0.08 and row(t) < 8: t += 1
    while b > h * 0.92 and row(b - 1) < 8: b -= 1
    while l < w * 0.08 and col(l) < 8: l += 1
    while r > w * 0.92 and col(r - 1) < 8: r -= 1
    im = im.crop((l, t, r, b)); s = min(im.size)
    return im.crop(((im.width - s) // 2, (im.height - s) // 2, (im.width - s) // 2 + s, (im.height - s) // 2 + s))

src, names = sys.argv[1], sys.argv[2:6]
im = Image.open(src).convert('RGB'); w, h = im.size; cx, cy = w // 2, h // 2
boxes = [(0, 0, cx, cy), (cx, 0, w, cy), (0, cy, cx, h), (cx, cy, w, h)]
out = os.path.dirname(src)
for name, box in zip(names, boxes):
    cell = trim(im.crop(box)).resize((1024, 1024), Image.LANCZOS)
    cell.save(os.path.join(out, name + '.jpg'), quality=95)
    print(name, box)
