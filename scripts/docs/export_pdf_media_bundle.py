#!/usr/bin/env python3
"""Create deterministic social preview images and an optional short video from a local PDF.

The source PDF is not modified. Poppler rasterizes bounded local pages and the
shared CAPITAL-AI media renderer composes brand-safe assets. This is a companion
export, not a PDF/UA validator or social publisher.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
import tempfile
from pathlib import Path

MEDIA_DIR = Path(__file__).resolve().parents[1] / "media"
sys.path.insert(0, str(MEDIA_DIR))

from capital_ai_media import (  # noqa: E402
    MediaRenderError,
    RenderScene,
    load_brand_palette,
    normalize_text,
    render_brand_card,
    render_scene_frame,
    render_short_video,
    safe_output_stem,
    sha256_file,
    write_asset_manifest,
    run_checked,
)

DEFAULT_DISCLAIMER = "CAPITAL-AI Analysebericht. Keine Anlage-, Rechts- oder Steuerberatung."
MAX_PDF_PAGES_FOR_MEDIA = 5


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf", type=Path, help="Local PDF path")
    parser.add_argument("--out-dir", type=Path, required=True)
    parser.add_argument("--title", required=True)
    parser.add_argument("--subtitle", default="Quantitative Analyse - kompakt aufbereitet")
    parser.add_argument("--disclaimer", default=DEFAULT_DISCLAIMER)
    parser.add_argument("--pages", type=int, default=3, help=f"Number of PDF pages to use (1-{MAX_PDF_PAGES_FOR_MEDIA})")
    parser.add_argument("--video", action="store_true")
    parser.add_argument("--allow-gpl-ffmpeg", action="store_true", help="Developer-only FFmpeg GPL-build override")
    return parser.parse_args()


def pdf_page_count(pdf: Path) -> int:
    pdfinfo = shutil.which("pdfinfo")
    if not pdfinfo:
        raise MediaRenderError("pdfinfo not found")
    result = run_checked([pdfinfo, str(pdf)])
    match = re.search(r"^Pages:\s+(\d+)\s*$", result.stdout, re.MULTILINE)
    if not match:
        raise MediaRenderError("Could not determine PDF page count")
    return int(match.group(1))


def rasterize_page(pdf: Path, page_number: int, out_path: Path) -> None:
    pdftoppm = shutil.which("pdftoppm")
    if not pdftoppm:
        raise MediaRenderError("pdftoppm not found")
    prefix = out_path.with_suffix("")
    run_checked([
        pdftoppm,
        "-f", str(page_number),
        "-l", str(page_number),
        "-singlefile",
        "-png",
        "-r", "120",
        str(pdf),
        str(prefix),
    ])
    generated = prefix.with_suffix(".png")
    if not generated.is_file():
        raise MediaRenderError(f"Poppler did not render PDF page {page_number}")
    if generated != out_path:
        generated.replace(out_path)


def main() -> int:
    args = parse_args()
    try:
        pdf = args.pdf.resolve()
        if not pdf.is_file() or pdf.suffix.lower() != ".pdf":
            raise MediaRenderError("source must be an existing local .pdf file")
        if args.pages < 1 or args.pages > MAX_PDF_PAGES_FOR_MEDIA:
            raise MediaRenderError(f"--pages must be between 1 and {MAX_PDF_PAGES_FOR_MEDIA}")
        title = normalize_text(args.title, field="title", max_chars=100)
        subtitle = normalize_text(args.subtitle, field="subtitle", max_chars=240)
        disclaimer = normalize_text(args.disclaimer, field="disclaimer", max_chars=220)
        page_count = pdf_page_count(pdf)
        use_pages = min(args.pages, page_count)
        slug = safe_output_stem(pdf.stem)
        palette = load_brand_palette()
        args.out_dir.mkdir(parents=True, exist_ok=True)

        assets = []
        frames = []
        with tempfile.TemporaryDirectory(prefix="capital-ai-pdf-media-") as temp_dir:
            temp = Path(temp_dir)
            rendered_pages: list[Path] = []
            for page_number in range(1, use_pages + 1):
                page_png = temp / f"page-{page_number:02d}.png"
                rasterize_page(pdf, page_number, page_png)
                rendered_pages.append(page_png)

            first_page = rendered_pages[0]
            assets.append(render_brand_card(
                output_path=args.out_dir / f"{slug}-pdf-preview-1280x720.png",
                width=1280, height=720, title=title, subtitle=subtitle,
                disclaimer=disclaimer, palette=palette, source_image=first_page,
            ))
            assets.append(render_brand_card(
                output_path=args.out_dir / f"{slug}-pdf-square-1080x1080.png",
                width=1080, height=1080, title=title, subtitle=subtitle,
                disclaimer=disclaimer, palette=palette, source_image=first_page,
            ))
            assets.append(render_brand_card(
                output_path=args.out_dir / f"{slug}-pdf-vertical-1080x1920.png",
                width=1080, height=1920, title=title, subtitle=subtitle,
                disclaimer=disclaimer, palette=palette, source_image=first_page,
            ))

            for index, page_png in enumerate(rendered_pages, start=1):
                scene = RenderScene(
                    title=title if index == 1 else f"Berichtsseite {index}",
                    body=subtitle if index == 1 else "Auszug aus dem CAPITAL-AI Bericht - Quelle bleibt das unveränderte PDF.",
                    duration_seconds=4.0 if index < use_pages else 5.0,
                    disclaimer=disclaimer if index in (1, use_pages) else None,
                )
                frame_path = args.out_dir / f"{slug}-pdf-scene-{index:02d}.png"
                assets.append(render_scene_frame(
                    scene,
                    output_path=frame_path,
                    palette=palette,
                    scene_index=index,
                    scene_count=use_pages,
                    source_image=page_png,
                ))
                frames.append((frame_path, scene.duration_seconds))

        ffmpeg_payload = None
        if args.video:
            video_asset, ffmpeg_info = render_short_video(
                frames,
                output_path=args.out_dir / f"{slug}-pdf-short-1080x1920.mp4",
                allow_gpl_ffmpeg=args.allow_gpl_ffmpeg,
            )
            assets.append(video_asset)
            ffmpeg_payload = {
                "version": ffmpeg_info.version,
                "profile": ffmpeg_info.profile,
                "enableGpl": ffmpeg_info.enable_gpl,
                "enableNonfree": ffmpeg_info.enable_nonfree,
                "buildconfSha256": ffmpeg_info.buildconf_sha256,
            }

        manifest = write_asset_manifest(
            output_path=args.out_dir / f"{slug}-pdf-media-manifest.json",
            assets=assets,
            palette=palette,
            source={
                "type": "local-pdf",
                "filename": pdf.name,
                "sha256": sha256_file(pdf),
                "pageCount": page_count,
                "pagesUsed": use_pages,
                "sourcePdfModified": False,
            },
            renderer={
                "pdfRasterizer": "Poppler/pdftoppm",
                "image": "Pillow",
                "video": ffmpeg_payload,
                "videoCodec": "mpeg4" if args.video else None,
                "formalPdfUaValidation": False,
                "networkAccess": False,
            },
        )
        print(json.dumps({"ok": True, "manifest": str(manifest), "assetCount": len(assets)}, indent=2))
        return 0
    except MediaRenderError as exc:
        print(json.dumps({"ok": False, "error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
