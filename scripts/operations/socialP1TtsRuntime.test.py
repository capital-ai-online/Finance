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

    def test_chatterbox_finance_projection_preserves_natural_sentence_flow(self) -> None:
        sample = {
            "sample_id": "de-finance-numbers-v1",
            "text": "Aussprachetest: 12,5 Prozent und 1.234,56 Euro. Sprich BTC, ETH und CAPITAL-AI klar aus.",
        }
        text, projection = MODULE._synthesis_text(sample, "chatterbox-multilingual-v3")
        self.assertEqual(projection, "de_finance_pronunciation_projection_v4_chatterbox_natural_prosody")
        self.assertIn("BTC, ETH und CAPITAL-AI", text)
        self.assertIn("natürlichen, zusammenhängenden Satzfluss", text)
        self.assertNotIn("Danach einzeln", text)
        self.assertNotIn("E, Tee, Haa", text)

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

    def test_chatterbox_runtime_pins_reference_equivalent_generation_defaults(self) -> None:
        self.assertEqual(
            MODULE.CHATTERBOX_GENERATION_PARAMETERS,
            {
                "exaggeration": 0.5,
                "cfg_weight": 0.5,
                "temperature": 0.8,
                "repetition_penalty": 1.2,
                "min_p": 0.05,
                "top_p": 1.0,
            },
        )
        self.assertEqual(
            MODULE.CHATTERBOX_PROSODY_REFERENCE_AUDIO_SHA256,
            "fa0f6a312095f35607bf470325e643ad3f625c01bd3f3a55e98b0b118afd37b0",
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
