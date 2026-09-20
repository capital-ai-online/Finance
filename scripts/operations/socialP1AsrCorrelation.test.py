from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("socialP1AsrCorrelation.py")


class AsrCorrelationTest(unittest.TestCase):
    def _payload(self, model: str, small_match: bool, large_match: bool | None = None) -> dict:
        matched = small_match if large_match is None else large_match
        cases = []
        for engine in ("qwen3-tts", "chatterbox-multilingual-v3"):
            for sample_id in ("de-dialogue-host-v1", "de-finance-numbers-v1"):
                cases.append({
                    "engine": engine,
                    "sample_id": sample_id,
                    "language": "de-DE",
                    "productive_acceptance": True,
                    "audio_sha256": f"{engine}-{sample_id}",
                    "transcript": "x",
                    "wer_normalized": 0.1,
                    "required_terms": [{"term": "ETH", "matched": matched, "matched_as": "ETH" if matched else None}],
                })
        return {
            "asr_model": model,
            "productive_acceptance_case_count": 4,
            "cases": cases,
        }

    def test_large_v3_can_confirm_small_false_negative(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            small = self._payload("small", False)
            large = self._payload("large-v3", True)
            (root / "small.json").write_text(json.dumps(small), encoding="utf-8")
            (root / "large.json").write_text(json.dumps(large), encoding="utf-8")
            out = root / "out"
            subprocess.run([
                sys.executable, str(SCRIPT),
                "--small", str(root / "small.json"),
                "--large", str(root / "large.json"),
                "--output-dir", str(out),
            ], check=True)
            result = json.loads((out / "social-p1-asr-correlation.json").read_text(encoding="utf-8"))
            self.assertTrue(result["large_v3_production_required_terms_pass"])
            self.assertTrue(all(
                term["correlation"] == "large_only"
                for case in result["cases"]
                for term in case["required_terms"]
            ))

    def test_audio_identity_mismatch_fails_closed(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            small = self._payload("small", True)
            large = self._payload("large-v3", True)
            large["cases"][0]["audio_sha256"] = "different"
            (root / "small.json").write_text(json.dumps(small), encoding="utf-8")
            (root / "large.json").write_text(json.dumps(large), encoding="utf-8")
            proc = subprocess.run([
                sys.executable, str(SCRIPT),
                "--small", str(root / "small.json"),
                "--large", str(root / "large.json"),
                "--output-dir", str(root / "out"),
            ])
            self.assertNotEqual(proc.returncode, 0)


if __name__ == "__main__":
    unittest.main()
