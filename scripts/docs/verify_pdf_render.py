#!/usr/bin/env python3
"""Verify structural and rendered invariants of a CAPITAL-AI PDF.

This is a renderer smoke gate, not a formal PDF/UA validator. It deliberately
uses Poppler CLI tools instead of an additional Python PDF library:

- pdfinfo: page size, page count, Tagged flag
- pdftotext: selectable/extractable text
- pdftoppm: first-page rasterization for basic brand visibility checks

Usage:

    python3 scripts/docs/verify_pdf_render.py report.pdf
    python3 scripts/docs/verify_pdf_render.py report.pdf --expect-tagged yes
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

A4_WIDTH_PT = 595.28
A4_HEIGHT_PT = 841.89
A4_TOLERANCE_PT = 3.0


def require_tool(name: str) -> str:
    executable = shutil.which(name)
    if not executable:
        raise RuntimeError(
            f"Required Poppler tool '{name}' not found. Install poppler-utils before render verification."
        )
    return executable


def run(*args: str) -> str:
    completed = subprocess.run(args, capture_output=True, text=True, check=False)
    if completed.returncode != 0:
        raise RuntimeError(
            f"Command failed ({completed.returncode}): {' '.join(args)}\n{completed.stderr.strip()}"
        )
    return completed.stdout


def parse_pdfinfo(raw: str) -> dict[str, object]:
    values: dict[str, str] = {}
    for line in raw.splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        values[key.strip()] = value.strip()

    page_size = values.get("Page size", "")
    match = re.search(r"([0-9.]+)\s+x\s+([0-9.]+)\s+pts", page_size)
    if not match:
        raise RuntimeError(f"Could not parse PDF page size from pdfinfo: {page_size!r}")

    width = float(match.group(1))
    height = float(match.group(2))
    pages = int(values.get("Pages", "0"))
    tagged = values.get("Tagged", "").lower()

    return {
        "pages": pages,
        "width_pt": width,
        "height_pt": height,
        "tagged": tagged,
        "title": values.get("Title", ""),
        "author": values.get("Author", ""),
    }


def read_ppm(path: Path) -> tuple[int, int, bytes]:
    with path.open("rb") as handle:
        magic = handle.readline().strip()
        if magic != b"P6":
            raise RuntimeError(f"Expected binary PPM (P6), got {magic!r}")

        def next_data_line() -> bytes:
            while True:
                line = handle.readline()
                if not line:
                    raise RuntimeError("Unexpected EOF in PPM header")
                stripped = line.strip()
                if stripped and not stripped.startswith(b"#"):
                    return stripped

        dimensions = next_data_line().split()
        if len(dimensions) != 2:
            raise RuntimeError("Invalid PPM dimensions")
        width, height = map(int, dimensions)
        max_value = int(next_data_line())
        if max_value != 255:
            raise RuntimeError(f"Unsupported PPM max value: {max_value}")
        pixels = handle.read()

    expected = width * height * 3
    if len(pixels) < expected:
        raise RuntimeError(f"Truncated PPM raster: expected {expected} bytes, got {len(pixels)}")
    return width, height, pixels[:expected]


def brand_pixel_metrics(width: int, height: int, pixels: bytes) -> dict[str, int]:
    top_height = max(1, int(height * 0.22))
    dark = 0
    gold = 0

    for y in range(top_height):
        row_start = y * width * 3
        for x in range(width):
            offset = row_start + x * 3
            red, green, blue = pixels[offset : offset + 3]
            if red < 70 and green < 70 and blue < 80:
                dark += 1
            if red >= 180 and 125 <= green <= 235 and blue <= 155 and red > green:
                gold += 1

    return {"dark_top_pixels": dark, "gold_top_pixels": gold}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf", type=Path)
    parser.add_argument(
        "--expect-tagged",
        choices=("yes", "no", "any"),
        default="any",
        help="Expected pdfinfo Tagged value",
    )
    parser.add_argument(
        "--expect-text",
        action="append",
        default=["CAPITAL-AI"],
        help="Text that must be extractable; may be repeated",
    )
    parser.add_argument("--json", action="store_true", help="Emit machine-readable result")
    args = parser.parse_args()

    pdf = args.pdf.resolve()
    if not pdf.is_file():
        raise RuntimeError(f"PDF not found: {pdf}")

    pdfinfo = require_tool("pdfinfo")
    pdftotext = require_tool("pdftotext")
    pdftoppm = require_tool("pdftoppm")

    info = parse_pdfinfo(run(pdfinfo, str(pdf)))
    if int(info["pages"]) < 1:
        raise RuntimeError("PDF has no pages")

    width_pt = float(info["width_pt"])
    height_pt = float(info["height_pt"])
    portrait_a4 = (
        abs(width_pt - A4_WIDTH_PT) <= A4_TOLERANCE_PT
        and abs(height_pt - A4_HEIGHT_PT) <= A4_TOLERANCE_PT
    )
    landscape_a4 = (
        abs(width_pt - A4_HEIGHT_PT) <= A4_TOLERANCE_PT
        and abs(height_pt - A4_WIDTH_PT) <= A4_TOLERANCE_PT
    )
    if not (portrait_a4 or landscape_a4):
        raise RuntimeError(f"Expected A4 page size, got {width_pt:.2f} x {height_pt:.2f} pt")

    tagged = str(info["tagged"])
    if args.expect_tagged != "any" and tagged != args.expect_tagged:
        raise RuntimeError(f"Expected Tagged={args.expect_tagged}, got Tagged={tagged or 'unknown'}")

    extracted = run(pdftotext, "-layout", str(pdf), "-")
    missing_text = [value for value in args.expect_text if value not in extracted]
    if missing_text:
        raise RuntimeError(f"Expected extractable text missing: {missing_text}")

    with tempfile.TemporaryDirectory(prefix="capital-ai-pdf-render-") as tmp:
        prefix = Path(tmp) / "page"
        run(pdftoppm, "-f", "1", "-l", "1", "-singlefile", "-r", "72", str(pdf), str(prefix))
        ppm = prefix.with_suffix(".ppm")
        raster_width, raster_height, pixels = read_ppm(ppm)
        metrics = brand_pixel_metrics(raster_width, raster_height, pixels)

    if metrics["dark_top_pixels"] < 500:
        raise RuntimeError(
            f"Brand render smoke failed: too few dark header/cover pixels ({metrics['dark_top_pixels']})"
        )
    if metrics["gold_top_pixels"] < 20:
        raise RuntimeError(
            f"Brand render smoke failed: too few gold accent pixels ({metrics['gold_top_pixels']})"
        )

    result = {
        "pdf": str(pdf),
        "pages": info["pages"],
        "pageSizePt": [width_pt, height_pt],
        "a4": True,
        "tagged": tagged,
        "title": info["title"],
        "author": info["author"],
        "extractableText": True,
        "rasterSize": [raster_width, raster_height],
        **metrics,
        "formalPdfUaValidation": False,
    }

    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(
            "PDF render verification PASS — "
            f"pages={result['pages']}, A4=yes, Tagged={tagged or 'unknown'}, "
            f"darkTop={metrics['dark_top_pixels']}, goldTop={metrics['gold_top_pixels']}"
        )
        print("Note: render verification is not a formal PDF/UA conformance certification.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except RuntimeError as exc:
        print(f"PDF render verification FAIL: {exc}", file=sys.stderr)
        raise SystemExit(1)
