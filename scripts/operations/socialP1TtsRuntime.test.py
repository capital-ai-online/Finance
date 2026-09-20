from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).with_name("socialP1TtsRuntime.py")
SPEC = importlib.util.spec_from_file_location("social_p1_tts_runtime", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)


class FinancePronunciationProjectionTest(unittest.TestCase):
    def test_finance_projection_expands_exact_problem_terms(self) -> None:
        sample = {
            "sample_id": "de-finance-numbers-v1",
            "text": "Aussprachetest: 12,5 Prozent und 1.234,56 Euro. Sprich BTC, ETH und CAPITAL-AI klar aus.",
        }
        text, projection = MODULE._synthesis_text(sample, "qwen3-tts")

        self.assertEqual(projection, "de_finance_pronunciation_projection_v1")
        self.assertIn("eintausendzweihundertvierunddreißig Euro und sechsundfünfzig Cent", text)
        self.assertIn("E T H", text)
        self.assertIn("Capital A I", text)
        self.assertNotIn("1.234,56", text)

    def test_chatterbox_finance_projection_spells_h_in_german(self) -> None:
        sample = {
            "sample_id": "de-finance-numbers-v1",
            "text": "Aussprachetest: 12,5 Prozent und 1.234,56 Euro. Sprich BTC, ETH und CAPITAL-AI klar aus.",
        }
        text, projection = MODULE._synthesis_text(sample, "chatterbox-multilingual-v3")
        self.assertEqual(projection, "de_finance_pronunciation_projection_v2_chatterbox_eth_ha")
        self.assertIn("E T Ha", text)
        self.assertNotIn("E T H und", text)

    def test_non_finance_fixture_remains_canonical(self) -> None:
        sample = {"sample_id": "de-dialogue-host-v1", "text": "Willkommen zum CAPITAL-AI Technikdialog."}
        text, projection = MODULE._synthesis_text(sample, "qwen3-tts")
        self.assertEqual(text, sample["text"])
        self.assertEqual(projection, "canonical_fixture_text")


    def test_chatterbox_runtime_calls_candidate_specific_projection(self) -> None:
        source = MODULE_PATH.read_text(encoding="utf-8")
        self.assertIn(
            '_synthesis_text(sample, "chatterbox-multilingual-v3")',
            source,
        )
        self.assertNotIn(
            'synthesis_text, pronunciation_projection = _synthesis_text(sample)\n    wav = model.generate',
            source,
        )

    def test_finance_sample_selection_is_exact(self) -> None:
        manifest = {
            "samples": [
                {"sample_id": "de-finance-numbers-v1"},
                {"sample_id": "de-dialogue-host-v1"},
                {"sample_id": "en-it-architecture-v1"},
                {"sample_id": "en-dialogue-cohost-v1"},
            ]
        }
        selected = MODULE._select_samples(manifest, ["de-finance-numbers-v1"])
        self.assertEqual([sample["sample_id"] for sample in selected], ["de-finance-numbers-v1"])


if __name__ == "__main__":
    unittest.main()
