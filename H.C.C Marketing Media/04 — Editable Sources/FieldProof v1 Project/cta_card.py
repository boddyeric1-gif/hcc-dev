import os, sys
from PIL import Image, ImageDraw, ImageFont

MONO = "/nix/store/xbs17gmksi0pljxcs4l6gshklzpmv8gr-dejavu-fonts-2.37/share/fonts/truetype/DejaVuSansMono.ttf"
MONOB = "/nix/store/xbs17gmksi0pljxcs4l6gshklzpmv8gr-dejavu-fonts-2.37/share/fonts/truetype/DejaVuSansMono-Bold.ttf"
COND = "/nix/store/xbs17gmksi0pljxcs4l6gshklzpmv8gr-dejavu-fonts-2.37/share/fonts/truetype/DejaVuSansCondensed-Bold.ttf"

CANVAS = (4, 7, 10)
CYAN = (95, 216, 245)
SLATE = (124, 139, 153)
WHITE = (255, 255, 255)

def sp(t, n=1):
    return (" " * n).join(list(t))

def render(W, H, frames, outdir, fps=30):
    os.makedirs(outdir, exist_ok=True)
    s = min(W, H) / 1080.0
    f_eyebrow = ImageFont.truetype(MONO, int(24 * s))
    f_head = ImageFont.truetype(COND, int(96 * s if H > W else 84 * s))
    f_cta = ImageFont.truetype(MONOB, int(40 * s))
    f_disc = ImageFont.truetype(MONO, int(20 * s))
    head_lines = ["YOU END THE NIGHT", "KNOWING WHO", "THEY REALLY ARE."]
    for i in range(frames):
        t = i / fps
        img = Image.new("RGB", (W, H), CANVAS)
        d = ImageDraw.Draw(img)
        # grid
        step = int(60 * s)
        for x in range(0, W, step):
            d.line([(x, 0), (x, H)], fill=(11, 18, 24))
        for y in range(0, H, step):
            d.line([(0, y), (W, y)], fill=(11, 18, 24))
        # corner brackets
        m = int(54 * s); L = int(80 * s); w = max(2, int(3 * s))
        for (cx, cy, dx, dy) in [(m, m, 1, 1), (W - m, m, -1, 1), (m, H - m, 1, -1), (W - m, H - m, -1, -1)]:
            d.line([(cx, cy), (cx + dx * L, cy)], fill=CYAN, width=w)
            d.line([(cx, cy), (cx, cy + dy * L)], fill=CYAN, width=w)
        cx = W // 2
        top = int(H * (0.30 if H > W else 0.22))
        # eyebrow
        eb = sp("H.C.C - HUNTING CYBER CRIMINALS")
        d.text((cx, top), eb, font=f_eyebrow, fill=SLATE, anchor="ma")
        # headline, line-by-line reveal
        y = top + int(90 * s)
        for li, line in enumerate(head_lines):
            appear = 0.15 + li * 0.28
            if t < appear:
                continue
            prog = min(1.0, (t - appear) / 0.30)
            n = max(1, int(len(line) * prog))
            col = WHITE if li == 0 else CYAN
            d.text((cx, y), line[:n], font=f_head, fill=col, anchor="ma")
            y += int((110 if H > W else 88) * s)
        # cta button
        if t > 1.15:
            bw = int(W * 0.68); bh = int(112 * s)
            bx0 = cx - bw // 2; by0 = int(H * (0.66 if H > W else 0.70))
            d.rectangle([bx0, by0, bx0 + bw, by0 + bh], outline=CYAN, width=max(2, int(3 * s)))
            d.text((cx, by0 + bh // 2), sp("PLAY H.C.C FREE"), font=f_cta, fill=CYAN, anchor="mm")
        # disclaimer
        if t > 1.35:
            d.text((cx, int(H * (0.80 if H > W else 0.86))),
                   "Fiction. Targets, operators and payloads are invented.",
                   font=f_disc, fill=SLATE, anchor="ma")
        # scanline sweep
        sy = int(((t * 0.75) % 1.0) * H)
        d.line([(0, sy), (W, sy)], fill=(18, 46, 56), width=max(2, int(3 * s)))
        img.save(f"{outdir}/f{i:04d}.png")

if __name__ == "__main__":
    W, H, n, out = int(sys.argv[1]), int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
    render(W, H, n, out)
