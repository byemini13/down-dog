#!/usr/bin/env python3
"""Generate filled pose silhouettes and PNG icons."""

from pathlib import Path
import struct
import zlib

ROOT = Path(__file__).resolve().parents[1]
POSES = ROOT / "poses"
ICONS = ROOT / "icons"

INK = "oklch(0.30 0.048 50)"
FAR = "oklch(0.30 0.048 50 / 0.30)"
MAT = "oklch(0.30 0.048 50 / 0.10)"

HEAD = 13.5
TORSO = 22
THIGH = 16.5
SHIN = 14
ARM = 12.5


def svg(parts: str) -> str:
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 210" fill="none">'
        f'<rect x="16" y="180" width="228" height="16" rx="8" fill="{MAT}"/>'
        '<g stroke-linecap="round" stroke-linejoin="round">'
        f"{parts}</g></svg>\n"
    )


def bone(a, b, w, color=INK) -> str:
    return (
        f'<line x1="{a[0]}" y1="{a[1]}" x2="{b[0]}" y2="{b[1]}" '
        f'stroke="{color}" stroke-width="{w}"/>'
    )


def head(p, r=HEAD) -> str:
    return f'<circle cx="{p[0]}" cy="{p[1]}" r="{r}" fill="{INK}" stroke="none"/>'


def body(neck, hip) -> str:
    return bone(neck, hip, TORSO)


# Each pose: far limbs first, then torso, near limbs, head.
POSES_BODY = {
    # Overhead: person on back, ankle crossed on opposite thigh.
    "reclined_figure_4": "".join(
        [
            bone((130, 122), (204, 148), THIGH, FAR),
            bone((204, 148), (148, 96), SHIN, FAR),
            body((130, 56), (130, 122)),
            bone((102, 58), (86, 88), ARM),
            bone((86, 88), (104, 78), ARM),
            bone((158, 58), (118, 74), ARM),
            bone((130, 122), (88, 82), THIGH),
            bone((88, 82), (128, 68), SHIN),
            head((130, 34)),
        ]
    ),
    # Side: kneeling lunge, facing right, torso tall.
    "low_lunge": "".join(
        [
            bone((118, 62), (78, 98), ARM, FAR),
            bone((102, 120), (54, 172), THIGH),
            bone((54, 172), (28, 172), SHIN),
            body((124, 50), (102, 120)),
            bone((102, 120), (172, 96), THIGH),
            bone((172, 96), (202, 172), SHIN),
            bone((122, 62), (158, 98), ARM),
            head((128, 30)),
        ]
    ),
    # Side: chest low, front foot wide, back knee down, forearms on the mat.
    "lizard": "".join(
        [
            bone((88, 148), (42, 174), THIGH, FAR),
            bone((42, 174), (18, 174), SHIN, FAR),
            body((58, 118), (88, 148)),
            bone((88, 148), (176, 128), THIGH),
            bone((176, 128), (228, 174), SHIN),
            bone((54, 120), (28, 150), ARM),
            bone((70, 128), (140, 154), ARM),
            head((42, 104)),
        ]
    ),
    # Side: front shin across the mat, back leg long, folding over the shin.
    "pigeon": "".join(
        [
            bone((132, 152), (230, 172), THIGH, FAR),
            body((70, 100), (132, 152)),
            bone((132, 152), (52, 174), THIGH),
            bone((52, 174), (118, 166), SHIN),
            bone((68, 104), (44, 132), ARM),
            bone((82, 114), (52, 144), ARM),
            head((54, 84)),
        ]
    ),
    # 3/4 seated: knees stacked, folding forward.
    "shoelace": "".join(
        [
            bone((124, 148), (186, 168), THIGH, FAR),
            bone((186, 168), (214, 140), SHIN, FAR),
            body((92, 70), (124, 148)),
            bone((124, 148), (64, 170), THIGH),
            bone((64, 170), (34, 142), SHIN),
            bone((90, 78), (48, 126), ARM),
            bone((102, 90), (56, 138), ARM),
            head((80, 50)),
        ]
    ),
    # Overhead: one knee hugged in, other leg long.
    "knee_to_chest": "".join(
        [
            bone((132, 128), (132, 196), THIGH, FAR),
            body((130, 58), (132, 128)),
            bone((100, 60), (78, 88), ARM),
            bone((78, 88), (108, 78), ARM),
            bone((160, 60), (118, 74), ARM),
            bone((132, 128), (92, 78), THIGH),
            bone((92, 78), (124, 70), SHIN),
            head((130, 36)),
        ]
    ),
    # Overhead: arms in a T, one knee guided across the body.
    "supine_twist": "".join(
        [
            bone((130, 118), (130, 188), THIGH, FAR),
            bone((36, 92), (224, 92), ARM),
            body((130, 56), (130, 118)),
            bone((130, 118), (196, 156), THIGH),
            bone((196, 156), (224, 140), SHIN),
            head((130, 34)),
        ]
    ),
    # Seated side: one leg long, other foot to inner thigh, folding over.
    "seated_half_fold": "".join(
        [
            bone((122, 150), (68, 168), THIGH, FAR),
            bone((68, 168), (38, 146), SHIN, FAR),
            body((108, 76), (122, 150)),
            bone((122, 150), (228, 156), THIGH),
            bone((106, 84), (176, 138), ARM),
            bone((112, 96), (88, 142), ARM),
            head((100, 54)),
        ]
    ),
    # Side-lying: knees stacked, top arm opening behind the chest.
    "open_book": "".join(
        [
            bone((138, 118), (168, 166), THIGH, FAR),
            bone((168, 166), (128, 174), SHIN, FAR),
            bone((138, 118), (162, 160), THIGH),
            bone((162, 160), (124, 170), SHIN),
            body((64, 86), (138, 118)),
            bone((70, 90), (28, 98), ARM, FAR),
            bone((78, 86), (78, 36), ARM),
            bone((78, 36), (124, 28), ARM),
            head((46, 72)),
        ]
    ),
    # Seated: upright, one ankle on the opposite knee, hands behind.
    "seated_figure_4": "".join(
        [
            bone((130, 128), (92, 176), THIGH, FAR),
            bone((92, 176), (70, 176), SHIN, FAR),
            bone((78, 108), (50, 76), ARM, FAR),
            body((130, 46), (130, 128)),
            bone((130, 128), (176, 86), THIGH),
            bone((176, 86), (148, 124), SHIN),
            bone((182, 108), (210, 76), ARM),
            head((130, 24)),
        ]
    ),
    # Side: hips back over back knee, front leg long, folding.
    "half_split": "".join(
        [
            bone((124, 80), (168, 124), ARM, FAR),
            bone((90, 148), (46, 172), THIGH),
            bone((46, 172), (24, 168), SHIN),
            body((128, 68), (90, 148)),
            bone((90, 148), (230, 158), THIGH),
            bone((118, 86), (86, 128), ARM),
            head((136, 46)),
        ]
    ),
    # Side: on back, one leg long, other straight up, strap to the foot.
    "reclined_hamstring": "".join(
        [
            bone((122, 148), (232, 156), THIGH, FAR),
            body((48, 122), (122, 148)),
            bone((122, 148), (136, 40), THIGH),
            bone((62, 120), (128, 70), ARM),
            bone((128, 70), (136, 40), 4),
            head((30, 112)),
        ]
    ),
    # Side: lunge with the back foot pulled toward the glute.
    "deep_lunge_quad": "".join(
        [
            bone((122, 64), (162, 98), ARM, FAR),
            bone((100, 126), (168, 100), THIGH),
            bone((168, 100), (200, 174), SHIN),
            body((130, 46), (100, 126)),
            bone((100, 126), (70, 168), THIGH),
            bone((70, 168), (48, 118), SHIN),
            bone((122, 58), (72, 54), ARM),
            bone((72, 54), (48, 118), ARM),
            head((138, 26)),
        ]
    ),
    # Side: pigeon folded all the way down, forehead on the arms.
    "sleeping_swan": "".join(
        [
            bone((126, 154), (228, 170), THIGH, FAR),
            body((62, 128), (126, 154)),
            bone((126, 154), (56, 172), THIGH),
            bone((56, 172), (104, 162), SHIN),
            bone((58, 130), (36, 150), ARM),
            bone((72, 136), (48, 154), ARM),
            head((44, 118)),
        ]
    ),
    # Seated 3/4: both legs bent, one shin forward, one out to the side.
    "deer": "".join(
        [
            bone((128, 140), (196, 168), THIGH, FAR),
            bone((196, 168), (230, 128), SHIN, FAR),
            body((126, 48), (128, 140)),
            bone((128, 140), (58, 166), THIGH),
            bone((58, 166), (26, 134), SHIN),
            bone((124, 60), (90, 104), ARM),
            bone((128, 64), (164, 106), ARM),
            head((126, 26)),
        ]
    ),
    # Side: longer, lower lunge, hands inside the front foot.
    "dragon": "".join(
        [
            bone((94, 68), (52, 122), ARM, FAR),
            bone((90, 134), (38, 172), THIGH),
            bone((38, 172), (16, 168), SHIN),
            body((96, 52), (90, 134)),
            bone((90, 134), (196, 104), THIGH),
            bone((196, 104), (232, 172), SHIN),
            bone((98, 88), (164, 132), ARM),
            head((96, 30)),
        ]
    ),
    # Seated: one arm reaches overhead and the torso leans away.
    "seated_side_bend": "".join(
        [
            bone((124, 142), (70, 168), THIGH, FAR),
            bone((70, 168), (40, 146), SHIN, FAR),
            bone((124, 142), (180, 166), THIGH),
            bone((180, 166), (214, 140), SHIN),
            body((132, 70), (124, 142)),
            bone((128, 78), (96, 118), ARM),
            bone((148, 48), (206, 36), ARM),
            bone((206, 36), (232, 68), ARM),
            head((164, 30)),
        ]
    ),
    # Overhead: both knees fallen to one side, arms open.
    "reclined_twist": "".join(
        [
            bone((36, 96), (224, 96), ARM),
            body((130, 56), (130, 116)),
            bone((130, 116), (188, 158), THIGH),
            bone((188, 158), (220, 146), SHIN),
            bone((130, 116), (176, 168), THIGH),
            bone((176, 168), (206, 156), SHIN),
            head((130, 34)),
        ]
    ),
    # Side: savasana, arms slightly open, legs long.
    "meditation": "".join(
        [
            bone((168, 128), (202, 154), ARM, FAR),
            body((48, 110), (168, 128)),
            bone((168, 128), (236, 134), THIGH),
            bone((62, 112), (28, 146), ARM),
            head((28, 100)),
        ]
    ),
}


def write_png(path: Path, size: int, rgba_fn):
    raw = bytearray()
    for y in range(size):
        raw.append(0)
        for x in range(size):
            raw.extend(rgba_fn(x, y, size))

    def chunk(tag: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    png += chunk(b"IEND", b"")
    path.write_bytes(png)


def icon_pixel(x, y, size):
    paper = (234, 217, 195, 255)
    oxide = (168, 78, 46, 255)
    ink = (72, 48, 36, 255)
    cx = cy = size / 2
    nx = (x - cx) / size
    ny = (y - cy) / size
    r = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5 / size

    if r > 0.46:
        return paper
    if r > 0.42:
        return ink if 0.42 < r < 0.435 else paper

    px = nx * 2.15
    py = ny * 2.15 + 0.12
    in_body = False
    if abs(py - (0.35 - 0.9 * (px + 0.55))) < 0.11 and -0.85 < px < -0.05:
        in_body = True
    if abs(py - (-0.05 + 0.35 * px)) < 0.12 and -0.35 < px < 0.55:
        in_body = True
    if abs(py - (0.28 + 0.85 * (px - 0.35))) < 0.11 and 0.05 < px < 0.85:
        in_body = True
    if ((px + 0.62) ** 2 + (py + 0.22) ** 2) ** 0.5 < 0.13:
        in_body = True
    return oxide if in_body else paper


def main():
    POSES.mkdir(exist_ok=True)
    ICONS.mkdir(exist_ok=True)
    for name, parts in POSES_BODY.items():
        (POSES / f"{name}.svg").write_text(svg(parts), encoding="utf-8")

    icon_svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect width="128" height="128" fill="#ead9c3"/>
  <circle cx="64" cy="64" r="54" fill="none" stroke="#483024" stroke-width="2.4"/>
  <path d="M28 58 C36 44 46 40 54 48 L78 68 C86 74 98 78 108 86" fill="none" stroke="#a84e2e" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M54 48 L42 92" fill="none" stroke="#a84e2e" stroke-width="7" stroke-linecap="round"/>
  <path d="M78 68 L96 96" fill="none" stroke="#a84e2e" stroke-width="7" stroke-linecap="round"/>
  <circle cx="30" cy="54" r="6" fill="#a84e2e"/>
</svg>
"""
    (ICONS / "icon.svg").write_text(icon_svg, encoding="utf-8")

    for size, filename in ((180, "icon-180.png"), (192, "icon-192.png"), (512, "icon-512.png")):
        write_png(ICONS / filename, size, icon_pixel)
    print(f"wrote {len(POSES_BODY)} poses and icons")


if __name__ == "__main__":
    main()
