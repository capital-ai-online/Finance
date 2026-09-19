from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path


def _parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Correlate SOCIAL-P1 German ASR evidence from Whisper small and large-v3.")
    p.add_argument("--small", type=Path, required=True)
    p.add_argument("--large", type=Path, required=True)
    p.add_argument("--output-dir", type=Path, required=True)
    return p.parse_args()


def _index(payload: dict) -> dict[tuple[str, str], dict]:
    out = {}
    for case in payload["cases"]:
        if case.get("productive_acceptance") is not True:
            continue
        out[(case["engine"], case["sample_id"])] = case
    return out


def main() -> int:
    args = _parse_args()
    small = json.loads(args.small.read_text(encoding="utf-8"))
    large = json.loads(args.large.read_text(encoding="utf-8"))

    if small.get("asr_model") != "small":
        raise RuntimeError("small evidence is not Whisper small")
    if large.get("asr_model") != "large-v3":
        raise RuntimeError("large evidence is not Whisper large-v3")
    if small.get("productive_acceptance_case_count") != 4:
        raise RuntimeError("small evidence must contain four German productive cases")
    if large.get("productive_acceptance_case_count") != 4:
        raise RuntimeError("large-v3 evidence must contain four German productive cases")

    si = _index(small)
    li = _index(large)
    if set(si) != set(li) or len(si) != 4:
        raise RuntimeError("German case identity mismatch between ASR passes")

    rows = []
    for key in sorted(si):
        s = si[key]
        l = li[key]
        if s["audio_sha256"] != l["audio_sha256"]:
            raise RuntimeError(f"audio SHA mismatch for {key}")

        s_terms = {x["term"]: x for x in s["required_terms"]}
        l_terms = {x["term"]: x for x in l["required_terms"]}
        if set(s_terms) != set(l_terms):
            raise RuntimeError(f"required-term identity mismatch for {key}")

        term_rows = []
        for term in sorted(s_terms):
            sm = bool(s_terms[term]["matched"])
            lm = bool(l_terms[term]["matched"])
            if sm and lm:
                correlation = "both_match"
            elif (not sm) and lm:
                correlation = "large_only"
            elif sm and (not lm):
                correlation = "small_only"
            else:
                correlation = "neither"
            term_rows.append({
                "term": term,
                "small_matched": sm,
                "large_v3_matched": lm,
                "correlation": correlation,
            })

        large_pass = all(x["large_v3_matched"] for x in term_rows)
        rows.append({
            "engine": s["engine"],
            "sample_id": s["sample_id"],
            "language": s["language"],
            "audio_sha256": s["audio_sha256"],
            "small_transcript": s["transcript"],
            "large_v3_transcript": l["transcript"],
            "small_wer_normalized": s["wer_normalized"],
            "large_v3_wer_normalized": l["wer_normalized"],
            "required_terms": term_rows,
            "large_v3_required_terms_pass": large_pass,
            "acceptance_status": "PASS" if large_pass else "FAILED",
        })

    payload = {
        "schema_version": "1.0.0",
        "source_audio_policy": "same immutable SOCIAL-P1 runtime WAVs; no TTS regeneration",
        "small_model": small["asr_model"],
        "large_model": large["asr_model"],
        "productive_case_count": len(rows),
        "large_v3_production_required_terms_pass": all(r["large_v3_required_terms_pass"] for r in rows),
        "failed_productive_cases": [
            f'{r["engine"]}::{r["sample_id"]}'
            for r in rows
            if r["acceptance_status"] == "FAILED"
        ],
        "cases": rows,
    }

    args.output_dir.mkdir(parents=True, exist_ok=True)
    out_json = args.output_dir / "social-p1-asr-correlation.json"
    out_json.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    with (args.output_dir / "social-p1-asr-correlation.csv").open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["engine", "sample_id", "term", "small_matched", "large_v3_matched", "correlation"])
        for row in rows:
            for term in row["required_terms"]:
                w.writerow([row["engine"], row["sample_id"], term["term"], term["small_matched"], term["large_v3_matched"], term["correlation"]])

    for row in rows:
        print(f'{row["engine"]}::{row["sample_id"]} large-v3 terms={row["large_v3_required_terms_pass"]}')
        for term in row["required_terms"]:
            print(f'  {term["term"]}: {term["correlation"]}')
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
