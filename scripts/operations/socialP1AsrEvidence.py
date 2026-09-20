from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import unicodedata
from pathlib import Path
from typing import Iterable

import whisper


def _parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Transcribe SOCIAL-P1 WAV evidence and verify required terms.")
    p.add_argument("--artifact-dir", type=Path, required=True)
    p.add_argument("--manifest", type=Path, required=True)
    p.add_argument("--output-dir", type=Path, required=True)
    p.add_argument("--model", default="small")
    p.add_argument("--productive-only", action="store_true")
    p.add_argument("--expected-wav-count", type=int, default=8)
    return p.parse_args()


def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def _normalize(text: str) -> str:
    text = unicodedata.normalize("NFKC", text).casefold()
    text = text.replace("ß", "ss")
    text = text.replace("%", " prozent ")
    text = re.sub(r"(?<=\d)[\.,](?=\d)", " ", text)
    text = re.sub(r"[-_/]", " ", text)
    text = re.sub(r"[^\w\s]", " ", text, flags=re.UNICODE)
    text = re.sub(r"\s+", " ", text).strip()
    return text


ALIASES = {
    "12,5 Prozent": ["12 5 prozent", "zwolf komma funf prozent", "zwoelf komma fuenf prozent"],
    "1.234,56 Euro": ["1 234 56 euro", "1234 56 euro", "tausendzweihundertvierunddreissig komma sechsundfunfzig euro", "eintausendzweihundertvierunddreissig komma sechsundfunfzig euro"],
    "BTC": ["btc", "b t c", "bt c"],
    "ETH": ["eth", "e t h"],
    "CAPITAL-AI": ["capital ai", "capital a i", "capital eye", "capital i"],
    "OAuth 2.0": ["oauth 2 0", "o auth 2 0"],
    "AES-256-GCM": ["aes 256 gcm", "a e s 256 g c m"],
    "SHA-256": ["sha 256", "s h a 256"],
    "API gateway": ["api gateway", "a p i gateway"],
}


def _term_match(term: str, transcript: str) -> tuple[bool, str | None]:
    hay = _normalize(transcript)
    candidates = [term, *ALIASES.get(term, [])]
    for candidate in candidates:
        needle = _normalize(candidate)
        if not needle:
            continue
        if re.search(rf"(?:^|\s){re.escape(needle)}(?:$|\s)", hay):
            return True, candidate
    return False, None


def _word_error_rate(reference: str, hypothesis: str) -> float:
    ref = _normalize(reference).split()
    hyp = _normalize(hypothesis).split()
    if not ref:
        return 0.0 if not hyp else 1.0
    prev = list(range(len(hyp) + 1))
    for i, r in enumerate(ref, start=1):
        cur = [i]
        for j, h in enumerate(hyp, start=1):
            cur.append(min(cur[-1] + 1, prev[j] + 1, prev[j - 1] + (r != h)))
        prev = cur
    return prev[-1] / len(ref)


def main() -> int:
    args = _parse_args()
    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    samples = {x["sample_id"]: x for x in manifest["samples"]}

    wavs = sorted(args.artifact_dir.rglob("*.wav"))
    if args.expected_wav_count <= 0:
        raise RuntimeError("expected WAV count must be positive")
    if len(wavs) != args.expected_wav_count:
        raise RuntimeError(f"expected exactly {args.expected_wav_count} WAV files, found {len(wavs)}")

    if args.productive_only:
        wavs = [
            wav for wav in wavs
            if "--" in wav.stem
            and str(samples[wav.stem.split("--", 1)[1]]["language"]).startswith("de")
        ]
        if len(wavs) != 4:
            raise RuntimeError(f"expected exactly 4 German productive WAV files, found {len(wavs)}")

    model = whisper.load_model(args.model, device="cpu")
    args.output_dir.mkdir(parents=True, exist_ok=True)

    rows = []
    for wav in wavs:
        stem = wav.stem
        if "--" not in stem:
            raise RuntimeError(f"unexpected WAV filename: {wav.name}")
        engine, sample_id = stem.split("--", 1)
        if sample_id not in samples:
            raise RuntimeError(f"unknown sample id: {sample_id}")
        sample = samples[sample_id]
        language = "de" if str(sample["language"]).startswith("de") else "en"

        result = model.transcribe(
            str(wav),
            language=language,
            task="transcribe",
            fp16=False,
            temperature=0.0,
            condition_on_previous_text=False,
            verbose=False,
        )
        transcript = str(result.get("text", "")).strip()
        checks = []
        for term in sample["required_terms"]:
            matched, matched_as = _term_match(term, transcript)
            checks.append({"term": term, "matched": matched, "matched_as": matched_as})

        productive_acceptance = str(sample["language"]).startswith("de")
        row = {
            "engine": engine,
            "sample_id": sample_id,
            "language": sample["language"],
            "evidence_role": "productive_acceptance" if productive_acceptance else "historical_comparison",
            "productive_acceptance": productive_acceptance,
            "wav_file": wav.name,
            "audio_sha256": _sha256(wav),
            "reference_text": sample["text"],
            "transcript": transcript,
            "transcript_sha256": hashlib.sha256(transcript.encode("utf-8")).hexdigest(),
            "wer_normalized": round(_word_error_rate(sample["text"], transcript), 6),
            "required_terms": checks,
            "required_terms_pass": all(x["matched"] for x in checks),
        }
        rows.append(row)

    productive_rows = [r for r in rows if r["productive_acceptance"]]
    historical_rows = [r for r in rows if not r["productive_acceptance"]]
    payload = {
        "schema_version": "1.1.0",
        "asr_engine": "openai-whisper",
        "asr_package_version": "20250625",
        "asr_model": args.model,
        "case_count": len(rows),
        "expected_wav_count": args.expected_wav_count,
        "productive_only": args.productive_only,
        "productive_acceptance_case_count": len(productive_rows),
        "historical_comparison_case_count": len(historical_rows),
        "productive_acceptance_language_policy": ["de-DE"],
        "production_required_terms_pass": all(r["required_terms_pass"] for r in productive_rows),
        "all_cases_required_terms_pass": all(r["required_terms_pass"] for r in rows),
        "cases": rows,
    }

    out_json = args.output_dir / "social-p1-asr-evidence.json"
    out_json.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    with (args.output_dir / "social-p1-asr-evidence.csv").open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["engine", "sample_id", "language", "evidence_role", "productive_acceptance", "audio_sha256", "wer_normalized", "required_terms_pass", "transcript"])
        for r in rows:
            w.writerow([r["engine"], r["sample_id"], r["language"], r["evidence_role"], r["productive_acceptance"], r["audio_sha256"], r["wer_normalized"], r["required_terms_pass"], r["transcript"]])

    for r in rows:
        print(f'{r["engine"]}::{r["sample_id"]} WER={r["wer_normalized"]:.3f} terms={r["required_terms_pass"]}')
        print(r["transcript"])

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
