#!/usr/bin/env python3
"""Generate pose SVGs and PNG icons."""

from pathlib import Path
import struct
import zlib

ROOT = Path(__file__).resolve().parents[1]
POSES = ROOT / "poses"
ICONS = ROOT / "icons"

INK = "oklch(0.32 0.045 50)"


def svg(body: str) -> str:
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 200" fill="none">'
        f'<line x1="16" y1="176" x2="224" y2="176" stroke="{INK}" stroke-width="1.6" opacity="0.3"/>'
        f'<g stroke="{INK}" fill="none" stroke-width="5.8" stroke-linecap="round" stroke-linejoin="round">'
        f"{body}</g></svg>\n"
    )


def head(cx: float, cy: float, r: float = 9.4) -> str:
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{INK}" stroke="none"/>'


POSES_BODY = {
    "reclined_figure_4": f"""
      {head(24, 112, 10)}
      <path d="M36 118 L112 140"/>
      <path d="M112 140 L132 48"/>
      <path d="M132 48 L78 86"/>
      <path d="M112 140 L186 128 L138 92"/>
      <path d="M50 116 L118 64"/>
    """,
    "low_lunge": f"""
      {head(120, 26, 10)}
      <path d="M118 38 L98 118"/>
      <path d="M98 118 L52 168 L26 168"/>
      <path d="M98 118 L164 92 L192 168"/>
      <path d="M114 64 L154 92"/>
      <path d="M114 62 L76 96"/>
    """,
    "lizard": f"""
      {head(52, 86, 10)}
      <path d="M62 94 L118 122 L90 142"/>
      <path d="M90 142 L46 168 L22 168"/>
      <path d="M90 142 L186 108 L220 168"/>
      <path d="M60 96 L34 136 L20 140"/>
      <path d="M118 122 L160 144"/>
    """,
    "pigeon": f"""
      {head(56, 72, 10)}
      <path d="M66 84 L118 148"/>
      <path d="M118 148 L64 168 L28 150"/>
      <path d="M118 148 L218 166"/>
      <path d="M64 88 L44 118"/>
      <path d="M80 102 L52 130"/>
    """,
    "shoelace": f"""
      {head(78, 52, 10)}
      <path d="M86 64 L118 148"/>
      <path d="M118 148 L70 168 L36 146"/>
      <path d="M118 148 L168 168 L204 142"/>
      <path d="M84 70 L48 120"/>
      <path d="M96 84 L54 132"/>
    """,
    "knee_to_chest": f"""
      {head(22, 100, 10)}
      <path d="M34 108 L118 140"/>
      <path d="M118 140 L222 150"/>
      <path d="M118 140 L108 54 L68 108"/>
      <path d="M50 108 L92 70 L108 58"/>
    """,
    "supine_twist": f"""
      {head(28, 70, 10)}
      <path d="M40 80 L118 112"/>
      <path d="M8 118 L118 112 L214 86"/>
      <path d="M118 112 L172 158 L216 146"/>
    """,
    "seated_half_fold": f"""
      {head(96, 60, 10)}
      <path d="M102 72 L120 148"/>
      <path d="M120 148 L68 166 L36 146"/>
      <path d="M120 148 L220 154"/>
      <path d="M104 80 L168 136"/>
      <path d="M108 90 L86 140"/>
    """,
    "open_book": f"""
      {head(118, 28, 10)}
      <path d="M118 40 L118 108"/>
      <path d="M118 108 L58 150 L36 118"/>
      <path d="M118 108 L70 148 L48 122"/>
      <path d="M118 58 L72 70"/>
      <path d="M118 58 L198 78 L220 62"/>
    """,
    "seated_figure_4": f"""
      {head(122, 30, 10)}
      <path d="M122 42 L126 128"/>
      <path d="M78 108 L126 128 L172 108"/>
      <path d="M126 128 L160 72 L196 122 L186 168"/>
      <path d="M126 128 L84 168"/>
      <path d="M78 108 L50 80"/>
      <path d="M172 108 L198 80"/>
    """,
    "half_split": f"""
      {head(132, 54, 10)}
      <path d="M126 66 L92 148"/>
      <path d="M92 148 L50 168 L26 164"/>
      <path d="M92 148 L222 156"/>
      <path d="M122 74 L164 122"/>
      <path d="M118 82 L84 126"/>
    """,
    "reclined_hamstring": f"""
      {head(22, 108, 10)}
      <path d="M34 116 L120 142"/>
      <path d="M120 142 L222 150"/>
      <path d="M120 142 L132 36"/>
      <path stroke-width="3" d="M52 112 L124 58 L132 36"/>
    """,
    "deep_lunge_quad": f"""
      {head(136, 26, 10)}
      <path d="M132 38 L104 122"/>
      <path d="M104 122 L172 96 L200 168"/>
      <path d="M104 122 L68 148 L44 108"/>
      <path d="M122 62 L164 92"/>
      <path d="M122 56 L70 52 L44 108"/>
    """,
    "sleeping_swan": f"""
      {head(46, 118, 10)}
      <path d="M58 124 L124 152"/>
      <path d="M124 152 L70 168 L32 154"/>
      <path d="M124 152 L220 166"/>
      <path d="M56 126 L36 146"/>
      <path d="M72 132 L48 150"/>
    """,
    "deer": f"""
      {head(124, 28, 10)}
      <path d="M124 40 L128 136"/>
      <path d="M128 136 L64 162 L28 138"/>
      <path d="M128 136 L184 164 L222 128"/>
      <path d="M124 52 L92 100"/>
      <path d="M126 56 L160 102"/>
    """,
    "dragon": f"""
      {head(92, 36, 10)}
      <path d="M94 48 L90 132"/>
      <path d="M90 132 L40 168 L16 164"/>
      <path d="M90 132 L190 100 L224 168"/>
      <path d="M92 64 L60 118 L42 128"/>
      <path d="M96 86 L154 128 L178 130"/>
    """,
    "seated_side_bend": f"""
      {head(164, 32, 10)}
      <path d="M154 44 C134 78 120 112 124 140"/>
      <path d="M124 140 L72 164 L40 146"/>
      <path d="M124 140 L176 164 L210 142"/>
      <path d="M142 64 L96 114"/>
      <path d="M164 32 C190 20 214 32 226 62"/>
    """,
    "reclined_twist": f"""
      {head(26, 68, 10)}
      <path d="M38 78 L116 108"/>
      <path d="M6 112 L116 108 L216 82"/>
      <path d="M116 108 L168 156 L208 148"/>
      <path d="M116 108 L160 164 L132 168"/>
    """,
    "meditation": f"""
      {head(28, 96, 10)}
      <path d="M40 104 L176 124"/>
      <path d="M176 124 L224 128"/>
      <path d="M64 108 L28 142"/>
      <path d="M156 122 L196 148"/>
    """,
}


def write_png(path: Path, size: int, rgba_fn):
    raw = bytearray()
    for y in range(size):
        raw.append(0)
        for x in range(size):
            raw.extend(rgba_fn(x, y, size))
    def chunk(tag: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

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

    # down-dog silhouette in a circle
    # simple inverted-V body
    px = nx * 2.15
    py = ny * 2.15 + 0.12
    # hands / feet band
    in_body = False
    # back leg
    if abs(py - (0.35 - 0.9 * (px + 0.55))) < 0.11 and -0.85 < px < -0.05:
        in_body = True
    # spine
    if abs(py - (-0.05 + 0.35 * px)) < 0.12 and -0.35 < px < 0.55:
        in_body = True
    # front leg
    if abs(py - (0.28 + 0.85 * (px - 0.35))) < 0.11 and 0.05 < px < 0.85:
        in_body = True
    # head
    if ((px + 0.62) ** 2 + (py + 0.22) ** 2) ** 0.5 < 0.13:
        in_body = True
    return oxide if in_body else paper


def main():
    POSES.mkdir(exist_ok=True)
    ICONS.mkdir(exist_ok=True)
    for name, body in POSES_BODY.items():
        (POSES / f"{name}.svg").write_text(svg(body), encoding="utf-8")

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
