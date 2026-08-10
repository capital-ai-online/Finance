# Documentary D4 — Review & Lifecycle Governance

Status: IMPLEMENTED IN DRAFT
Date: 2026-08-10
Basis: D5/E1/E4 / PR #169 / main `020c89abf4fbc9b94128b33e77e780e48b1e1cfb`

## Deutsch

D4 führt einen expliziten, evidence-basierten Lifecycle für Documentary-Dokumente ein. Der zulässige Hauptpfad lautet `generated -> reviewed -> approved`. Nach Freigabe sind ausschließlich kontrollierte Übergänge nach `superseded` oder `archived` zulässig; `superseded -> archived` ist ebenfalls erlaubt.

Jeder Übergang verlangt Actor-ID, Aktion, Zeitpunkt und mindestens eine Evidence-Referenz. Übersprungene Status, falsche Aktionen und fehlende Evidence werden fail-closed blockiert. Der Dokument-Fingerprint bleibt bei reinen Lifecycle-Transitions unverändert, weil Review-Status kein Content-Feld ist.

D4 führt keine autonome Freigabe ein. Die Governance-Schicht validiert lediglich eine explizit angeforderte Transition. IAM-/Owner-Step-Up und persistente Audit-Speicherung bleiben getrennte Integrationsaufgaben; D4 umgeht diese Grenzen nicht.

## English

D4 establishes an explicit evidence-backed Documentary lifecycle. The governed path is `generated -> reviewed -> approved`, followed only by controlled supersede/archive transitions. Every transition requires an actor, action, timestamp and evidence reference. Invalid skips, mismatched actions and evidence-free transitions fail closed. Lifecycle-only changes preserve the content fingerprint.
