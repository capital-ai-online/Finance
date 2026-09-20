from __future__ import annotations

import argparse
import json
from pathlib import Path

from socialP1AsrEvidence import _term_match


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Re-evaluate Required-Term matches from existing ASR transcripts.")
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    return parser.parse_args()


def main() -> int:
    args = _parse_args()
    payload = json.loads(args.input.read_text(encoding="utf-8"))
    cases = payload.get("cases")
    if not isinstance(cases, list) or not cases:
        raise RuntimeError("existing ASR evidence must contain at least one case")

    for case in cases:
        transcript = str(case.get("transcript", ""))
        required_terms = case.get("required_terms")
        if not isinstance(required_terms, list) or not required_terms:
            raise RuntimeError("existing ASR case has no Required Terms")
        rematched = []
        for item in required_terms:
            term = str(item["term"])
            matched, matched_as = _term_match(term, transcript)
            rematched.append({"term": term, "matched": matched, "matched_as": matched_as})
        case["required_terms"] = rematched
        case["required_terms_pass"] = all(item["matched"] for item in rematched)

    productive = [case for case in cases if case.get("productive_acceptance") is True]
    payload["production_required_terms_pass"] = all(case["required_terms_pass"] for case in productive)
    payload["all_cases_required_terms_pass"] = all(case["required_terms_pass"] for case in cases)
    payload["rematched_from_existing_transcript"] = True

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
