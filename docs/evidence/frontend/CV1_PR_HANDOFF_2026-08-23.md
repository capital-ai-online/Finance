# CV-0 / CV-1 PR Handoff

**Status:** PR CANDIDATE / MERGE REQUIRED BEFORE NEXT VISUALIZATION WAVE  
**Stand:** 2026-08-23  
**Current main baseline:** `deaf7a5411efdc4aa4638757b7d6958a75c094cc`  
**Branch:** `feat/crypto-visualization-work-packages-2026-08-23`

## Scope dieses PR-Kandidaten

Dieser Branch enthält ausschließlich die bereits umgesetzten Visualisierungswellen **CV-0** und **CV-1** sowie deren Frontend-/Evidence-Dokumentation und Regression-Gates.

- CV-0: Presentation Authority / View-Model Contract
- CV-1: Crypto Score Command Center

Der Branch wurde unmittelbar vor PR-Erstellung gegen den aktuellen `main` synchronisiert. Der seit der ursprünglichen Baseline gemergte Documentary-Stand aus PR #509 (`src/platform/FinTechCore/README.md` plus Versionsprojektions-Test) wird unverändert aus `main` übernommen.

## Merge-Grenze

Weitere Visualisierungsarbeit beginnt **nicht auf diesem PR-Branch vor Merge**.

Verbindliche Reihenfolge nach Human Merge:

```text
CV-0 + CV-1 PR
   ↓ Human Merge
frischer Branch vom dann aktuellen main
   ↓
CV-3 Factor & Model Explorer
   ↓
CV-2 Verified Crypto Market Chart v2
```

Damit wird CV-3 ausdrücklich **vor CV-2** umgesetzt.

## Gründe für CV-3 vor CV-2

1. Die Meme-/DeFi-Challenger, Hard Gates, Correlation Groups und Missing-Evidence-Zustände sind backendseitig bereits vorhanden und benötigen zunächst eine verständliche Presentation Projection.
2. CV-3 kann auf den bestehenden CV-0-Authority-Primitives und dem CV-1-Command-Center aufbauen, ohne einen neuen Market-Data-Contract einzuführen.
3. CV-2 benötigt dagegen einen separaten OHLCV-/Financial-Chart-Contract- und Library-Spike und ist damit die größere Contract-/Dependency-Welle.

## Governance-Invarianten

- Kein Agent-Self-Merge.
- Human-/CODEOWNER-Merge bleibt erforderlich.
- CV-3 wird erst nach bestätigtem Merge von einem frischen, erneut geprüften `main` gestartet.
- CV-2 bleibt nach CV-3 nachgeordnet.
- Keine neuen Scoring-, Ranking-, Evidence-, Pattern-, Regime- oder Execution-Authorities werden durch diese Reihenfolge erzeugt.
- Hosted PR-CI wird erst im PR-Kontext gemäß aktueller Checkklasse ausgeführt.

## Validation State vor PR

- Main-Synchronität: source-/Git-Diff-seitig verifiziert (`0 behind`).
- Offene Parallel-PR-Korrelation: vor PR-Erstellung erneut zu prüfen.
- TypeScript / Unit / Production Build: noch nicht als PASS behauptet.
- Hosted `build-and-test`: noch nicht als PASS behauptet; wird im PR-Kontext ausgeführt.
