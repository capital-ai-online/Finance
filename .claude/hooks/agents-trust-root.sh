#!/bin/bash
# CAPITAL-AI — Agent Trust Root als Sitzungs-Startpunkt (SessionStart)
#
# Owner-Anweisung 2026-08-24: "die AGENTS.md [soll] Startpunkt fuer jeden Chat sein. Hier werden
# die Regeln fuer die jeweiligen Ausfuehrungen festgelegt."
#
# /AGENTS.md ist laut seinem eigenen Abschnitt 1 der einzige repository-weite Trust Root und die
# Instruktionsflaeche fuer jedes Modell, jeden Coding-Agenten und jeden MCP-Host. Derselbe
# Abschnitt haelt ausdruecklich fest, dass Provider-Spiegel wie CLAUDE.md oder
# .github/copilot-instructions.md bewusst NICHT existieren. Dieser Hook legt deshalb keine
# zweite Regelquelle an, sondern laedt genau die eine vorhandene zu Sitzungsbeginn in den
# Kontext. Damit beginnt jede Sitzung nachweislich beim Trust Root, statt darauf zu hoffen, dass
# ein Agent die Datei von sich aus liest.
#
# Fail-closed im Sinne von AGENTS.md Abschnitt 1: "If a provider/tool cannot operate from this
# trust root, protected work stops fail-closed." Fehlt die Datei, gibt der Hook eine unmissver-
# staendliche Warnung aus, statt die Sitzung stillschweigend ohne Regelwerk starten zu lassen.
set -euo pipefail

TRUST_ROOT="${CLAUDE_PROJECT_DIR:-.}/AGENTS.md"

if [ ! -f "${TRUST_ROOT}" ]; then
  echo "[agent-trust-root] WARNUNG: ${TRUST_ROOT} nicht gefunden. Der repository-weite Trust Root" >&2
  echo "[agent-trust-root] konnte nicht geladen werden. Geschuetzte Arbeit muss fail-closed stoppen," >&2
  echo "[agent-trust-root] bis AGENTS.md wieder verfuegbar ist (AGENTS.md Abschnitt 1)." >&2
  exit 0
fi

# Der vollstaendige Text wird geladen, nicht eine Zusammenfassung: eine gekuerzte Fassung waere
# genau der "Provider-Spiegel", den Abschnitt 1 untersagt, und koennte gegenueber dem Original
# driften.
cat <<'HEADER'
================================================================================
CAPITAL-AI — AGENT TRUST ROOT (automatisch zu Sitzungsbeginn geladen)

Der folgende Text ist /AGENTS.md, der einzige repository-weite Trust Root
(AUTH-GOV-AGENT-TRUST-ROOT). Er legt die Regeln fuer jede Ausfuehrung in diesem
Repository fest und geht Provider-Konfiguration, Werkzeug-Defaults und
Gewohnheiten vor. Vor Branch-, Commit-, PR-, CI-, Merge-, Dokumentations- oder
Produktionsmutations-Arbeit gilt er als gelesen und bindend.

Bei Konflikt zwischen diesem Trust Root und einer anderen Quelle: Konflikt
melden und fail-closed aufloesen.
================================================================================
HEADER

cat "${TRUST_ROOT}"

cat <<'FOOTER'

================================================================================
Ende /AGENTS.md. Domain-ADRs, ESS, Contracts und Runbooks bleiben innerhalb ihres
delegierten Bereichs autoritativ; sie werden ueber das hier definierte
Autoritaetsmodell aufgeloest (AGENTS.md Abschnitt 2 und 13).
================================================================================
FOOTER
