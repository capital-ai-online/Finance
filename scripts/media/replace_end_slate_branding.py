#!/usr/bin/env python3
"""Normalize externally generated video branding to CAPITAL-AI.

The utility can:
- cover a bottom-right third-party watermark with a caller-supplied CAPITAL-AI badge;
- remove one explicitly selected legacy logo region for a bounded time range;
- replace the final slate with the same CAPITAL-AI asset on black.

It never searches for logos autonomously. All affected regions and time ranges
remain caller-controlled and deterministic.

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


def _non_negative_time(value: str) -> float:
    try:
        parsed = float(value)
    except ValueError as exc:
        raise argparse.ArgumentTypeError("time must be numeric") from exc
    if parsed < 0:
        raise argparse.ArgumentTypeError("time must be >= 0")
    return parsed


def _region(value: str) -> tuple[int, int, int, int]:
    try:
        x, y, width, height = (int(part) for part in value.split(":"))
    except (ValueError, TypeError) as exc:
        raise argparse.ArgumentTypeError("region must be x:y:width:height") from exc
    if min(x, y) < 0 or width < 16 or height < 16:
        raise argparse.ArgumentTypeError("region must use non-negative x/y and width/height >= 16")
    return x, y, width, height


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Normalize external video branding to deterministic CAPITAL-AI branding."
    )
    parser.add_argument("--input", required=True, type=_existing_file)
    parser.add_argument("--logo", required=True, type=_existing_file)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--start", required=True, type=_non_negative_time, help="Start of full end-slate replacement")
    parser.add_argument("--logo-width", type=int, default=980, help="Centered end-slate logo width")
    parser.add_argument("--watermark-start", type=_non_negative_time, default=0.0)
    parser.add_argument("--watermark-end", type=_non_negative_time, default=None)
    parser.add_argument("--watermark-width", type=int, default=230)
    parser.add_argument("--legacy-logo-start", type=_non_negative_time, default=None)
    parser.add_argument("--legacy-logo-end", type=_non_negative_time, default=None)
    parser.add_argument("--legacy-logo-region", type=_region, default=(5, 5, 175, 110))
    parser.add_argument(
        "--allow-gpl-ffmpeg",
        action="store_true",
        help="Developer smoke-test override only; production should use reviewed LGPL FFmpeg.",
    )
    return parser


def _validate(args: argparse.Namespace) -> None:
    if not 240 <= args.logo_width <= 1200:
        raise MediaRenderError("logo-width must be between 240 and 1200 pixels")
    if not 80 <= args.watermark_width <= 600:
        raise MediaRenderError("watermark-width must be between 80 and 600 pixels")

    watermark_end = args.start if args.watermark_end is None else args.watermark_end
    if watermark_end < args.watermark_start:
        raise MediaRenderError("watermark-end must be >= watermark-start")
    if watermark_end > args.start:
        raise MediaRenderError("watermark-end must not extend beyond end-slate start")

    legacy_values = (args.legacy_logo_start, args.legacy_logo_end)
    if exactly_one := ((legacy_values[0] is None) != (legacy_values[1] is None)):
        raise MediaRenderError("legacy-logo-start and legacy-logo-end must be supplied together")
    if not exactly_one and legacy_values[0] is not None and legacy_values[1] < legacy_values[0]:
        raise MediaRenderError("legacy-logo-end must be >= legacy-logo-start")


def main() -> int:
    args = build_parser().parse_args()
    _validate(args)

    output = args.output.expanduser().resolve()
    output.parent.mkdir(parents=True, exist_ok=True)

    ffmpeg = inspect_ffmpeg()
    enforce_ffmpeg_license_profile(ffmpeg, allow_gpl_ffmpeg=bool(args.allow_gpl_ffmpeg))

    start = f"{args.start:.3f}"
    watermark_start = f"{args.watermark_start:.3f}"
    watermark_end_value = args.start if args.watermark_end is None else args.watermark_end
    watermark_end = f"{watermark_end_value:.3f}"

    filters: list[str] = []
    source_label = "0:v"
    if args.legacy_logo_start is not None:
        x, y, width, height = args.legacy_logo_region
        legacy_start = f"{args.legacy_logo_start:.3f}"
        legacy_end = f"{args.legacy_logo_end:.3f}"
        filters.append(
            f"[{source_label}]delogo=x={x}:y={y}:w={width}:h={height}:show=0:"
            f"enable='between(t,{legacy_start},{legacy_end})'[clean]"
        )
        source_label = "clean"

    filters.extend(
        [
            "[1:v]split=2[watermark_source][end_source]",
            f"[watermark_source]scale={args.watermark_width}:-1[watermark]",
            f"[{source_label}][watermark]overlay=x=W-w-12:y=H-h-10:"
            f"enable='between(t,{watermark_start},{watermark_end})'[branded]",
            f"[branded]drawbox=x=0:y=0:w=iw:h=ih:color=black:t=fill:"
            f"enable='gte(t,{start})'[end_base]",
            f"[end_source]scale={args.logo_width}:-1[end_logo]",
            f"[end_base][end_logo]overlay=(W-w)/2:(H-h)/2:enable='gte(t,{start})'[video]",
        ]
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
            ";".join(filters),
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
