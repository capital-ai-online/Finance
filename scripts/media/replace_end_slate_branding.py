#!/usr/bin/env python3
"""Replace a third-party end slate with a deterministic CAPITAL-AI brand slate.

This utility is intentionally narrow: it does not perform image inpainting or
remove arbitrary provenance marks from content. It replaces a caller-selected
final time range with a locally supplied CAPITAL-AI logo asset.

Security / governance:
- local input files only;
- no network access;
- shared FFmpeg licence-profile checks from capital_ai_media;
- argv-based subprocess execution with shell=False;
- source audio is preserved;
- output is deterministic for the same inputs and parameters.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from capital_ai_media import (
    MediaRenderError,
    enforce_ffmpeg_license_profile,
    inspect_ffmpeg,
    run_checked,
)


def _existing_file(value: str) -> Path:
    path = Path(value).expanduser().resolve()
    if not path.is_file():
        raise argparse.ArgumentTypeError(f"file not found: {path}")
    return path


def _positive_time(value: str) -> float:
    try:
        parsed = float(value)
    except ValueError as exc:
        raise argparse.ArgumentTypeError("start time must be numeric") from exc
    if parsed < 0:
        raise argparse.ArgumentTypeError("start time must be >= 0")
    return parsed


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Replace a selected final video range with CAPITAL-AI branding."
    )
    parser.add_argument("--input", required=True, type=_existing_file)
    parser.add_argument("--logo", required=True, type=_existing_file)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--start", required=True, type=_positive_time)
    parser.add_argument("--logo-width", type=int, default=980)
    parser.add_argument(
        "--allow-gpl-ffmpeg",
        action="store_true",
        help="Developer smoke-test override only; production should use reviewed LGPL FFmpeg.",
    )
    return parser


def main() -> int:
    args = build_parser().parse_args()
    if not 240 <= args.logo_width <= 1200:
        raise MediaRenderError("logo-width must be between 240 and 1200 pixels")

    output = args.output.expanduser().resolve()
    output.parent.mkdir(parents=True, exist_ok=True)

    ffmpeg = inspect_ffmpeg()
    enforce_ffmpeg_license_profile(
        ffmpeg,
        allow_gpl_ffmpeg=bool(args.allow_gpl_ffmpeg),
    )

    start = f"{args.start:.3f}"
    filter_graph = (
        "[0:v]drawbox=x=0:y=0:w=iw:h=ih:color=black:t=fill:"
        f"enable='gte(t,{start})'[base];"
        f"[1:v]scale={args.logo_width}:-1[logo];"
        "[base][logo]overlay=(W-w)/2:(H-h)/2:"
        f"enable='gte(t,{start})'[video]"
    )

    run_checked(
        [
            ffmpeg.executable,
            "-y",
            "-i",
            str(args.input),
            "-i",
            str(args.logo),
            "-filter_complex",
            filter_graph,
            "-map",
            "[video]",
            "-map",
            "0:a?",
            "-c:v",
            "libx264",
            "-crf",
            "18",
            "-preset",
            "medium",
            "-c:a",
            "copy",
            "-movflags",
            "+faststart",
            str(output),
        ]
    )
    print(output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
