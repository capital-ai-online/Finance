from __future__ import annotations

import importlib.util
import sys
import types
import unittest
from pathlib import Path

sys.modules.setdefault("whisper", types.SimpleNamespace())

MODULE_PATH = Path(__file__).with_name("socialP1AsrEvidence.py")
SPEC = importlib.util.spec_from_file_location("social_p1_asr_evidence", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)


class RequiredTermMatcherTest(unittest.TestCase):
    def assertMatch(self, term: str, transcript: str) -> None:
        matched, _ = MODULE._term_match(term, transcript)
        self.assertTrue(matched, msg=f"expected match: {term!r} in {transcript!r}")

    def assertNoMatch(self, term: str, transcript: str) -> None:
        matched, _ = MODULE._term_match(term, transcript)
        self.assertFalse(matched, msg=f"unexpected match: {term!r} in {transcript!r}")

    def test_percent_symbol_is_equivalent_to_prozent(self) -> None:
        self.assertMatch("12,5 Prozent", "Aussprachetest: 12,5% und weitere Werte.")

    def test_capital_eye_is_explicit_asr_equivalent(self) -> None:
        self.assertMatch("CAPITAL-AI", "Willkommen zum Capital Eye Technik Dialog.")

    def test_capital_i_is_explicit_asr_equivalent(self) -> None:
        self.assertMatch("CAPITAL-AI", "Willkommen zum Capital-I Technik Dialog.")

    def test_exact_numeric_value_and_currency_remain_required(self) -> None:
        self.assertMatch("1.234,56 Euro", "Der Betrag lautet 1.234,56 Euro.")
        self.assertNoMatch("1.234,56 Euro", "Der Betrag lautet 1,2453,6 Euro.")
        self.assertNoMatch("1.234,56 Euro", "Der Betrag lautet 1234,56 ohne Währung.")

    def test_btc_segmented_as_bt_c_is_explicit_asr_equivalent(self) -> None:
        self.assertMatch("BTC", "Sprich BT, C klar aus.")

    def test_eth_semantic_alias_is_allowed_while_misrecognitions_remain_fail_closed(self) -> None:
        self.assertMatch("ETH", "Sprich BTC, ETH und CAPITAL-AI klar aus.")
        self.assertMatch("ETH", "Bitcoin und Ethereum sind reine Aussprachebeispiele.")
        self.assertNoMatch("ETH", "Sprich BTC, ETA und Capital Eye klar aus.")
        self.assertNoMatch("ETH", "Sprich BTC, ETS und Capital Eye klar aus.")
        self.assertNoMatch("ETH", "Sprich BTC, ETI und Capital Eye klar aus.")

    def test_term_matching_does_not_accept_substrings(self) -> None:
        self.assertNoMatch("ETH", "Die Methode ist deterministisch.")


if __name__ == "__main__":
    unittest.main()
