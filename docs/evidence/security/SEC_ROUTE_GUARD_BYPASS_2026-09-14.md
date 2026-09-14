# Security: Abweichende URL-Schreibweisen umgehen vorgeschaltete Guards

Datum: 2026-09-14
Projekt / Remediation-Owner: CAPITAL-AI-SEC
Projektordner: docs/projects/security/
Primary PVC: N/A — Security ist cross-cutting; betroffene Domain-Owner bleiben bestehen.
Baseline: main@c6d36c216801f16788d205664ab4cfdf0c970dca
Branch: agent/security-route-guard-bypass-20260914
Auftrag: Owner fordert Code-Sicherheitsprüfung und Behebung bestätigter Schwachstellen.
Authority: /AGENTS.md; CTRL-SEC-BOUNDED-REMEDIATION-001; ESS-0006 v1.2.0.
Roadmap-Bezug: SEC-PR900-04, S1-R2-05 und S1-R2-06.
Status: Korrekturen implementiert; unabhängige Laufzeitverifikation OFFEN.

## Befunde und Threat Model

| ID | Befund | Betroffene Dateien | Domain-Owner / PVC |
|---|---|---|---|
| SEC-ROUTE-STRIPE-20260914 | Exakte, case-sensitive Pfadvergleiche überspringen Stripe-Return-URL-Validierung für Router-Aliasse. | server/middleware/stripeReturnUrlGuard.ts; server/stripe.ts | CAPITAL-AI-OPS / PVC-02, PVC-08 |
| SEC-ROUTE-SCREENING-20260914 | Case-sensitive Pfadregex überspringt die gemeinsame Screening-Quota-Prüfung bei anderer Großschreibung. | server/middleware/verifiedScreeningEntitlement.ts; server/routes/registerApplicationRoutes.ts | CAPITAL-AI-OPS als Entitlement-Parent; CAPITAL-AI-FINTECH für Screening-PVC-13..17 und CAPITAL-AI-DATA für Evidence-PVC-10 bleiben Domain-Owner; keine Ownership-Übertragung |

Angreifer kontrollieren die Schreibweise des HTTP-Pfads und die Request-Eingaben.
Geschützte Assets sind vertrauenswürdige Stripe-Rücksprungziele und die serverseitige
Screening-Quota. Die Trust Boundary liegt zwischen untrusted HTTP Request und
produktiven Router-Handlern.

Der Lockfile pinnt Express 4.22.2. Die Router verwenden express.Router() ohne
caseSensitive/strict-Optionen. Express akzeptiert standardmäßig unterschiedliche
Großschreibung und einen optionalen abschließenden Slash:
https://expressjs.com/en/4x/api/express/#express.router

Die vorgelagerten Vergleiche deckten diese Router-Semantik nicht ab.
Der SEO-Slash-Normalizer greift nicht für POST-Requests; API-Pfade werden ebenfalls
ausgenommen. CORS ersetzt keine Pfad-/Entitlement-Prüfung.

## Reproduzierbare Code-Beobachtung

Stripe: /create-checkout-session wird geprüft; /CREATE-CHECKOUT-SESSION und
/create-checkout-session/ wurden vom Guard übersprungen. Gleiches gilt für
/create-portal-session. Der nachgelagerte Router akzeptiert diese Aliasse.

Screening: /api/crypto/score wird erkannt; /API/CRYPTO/SCORE und
/api/crypto/Score/ wurden von den Regex nicht erkannt. Der Guard ruft dann next()
ohne Quota-Prüfung auf. Die sieben geschützten Pfadfamilien sind betroffen.

Diese Befunde sind durch Quelltext-/Framework-Korrelation belegt. Es wurde KEIN
Angriff gegen Produktion und KEINE Stripe-/Subscription-Mutation ausgeführt.
Schweregrad vorläufig: Screening HIGH wegen Quota-Bypass; Stripe MEDIUM wegen
unvalidiertem externen Rücksprungziel. End-to-End-Ausnutzbarkeit bleibt bis zum
isolierten Router-Test bzw. erforderlicher Runtime-Verifikation offen.

## Kleinste ausreichende Korrektur

- Stripe: Nur für die Guard-Entscheidung einen abschließenden Slash entfernen und
  Großschreibung normalisieren. req.url, Billing-Semantik und Origin-Allowlist bleiben erhalten.
- Screening: Die sieben bestehenden Pfadregex case-insensitive auswerten. Keine
  neue Quota-Authority, keine neuen Entitlements, keine zusätzlichen Pfadfamilien.
- tests/unit/securityRouteMatching.test.ts enthält 13 parametrisierte Testfälle mit
  isolierten Express-Routern: DENY/ALLOW für Stripe und alle sieben Screening-Pfade
  sowie einen ungeschützten Katalogpfad. Keine realen Provider werden aufgerufen.

## Ausgeführte Prüfung und Grenzen

- Read-only current-main-, Trust-Root-, Projekt-/PVC-, Roadmap-/ADR-/ESS-Abgleich.
- REST-PR-Liste und PR-Suche lieferten vor Änderungen keine offenen PRs.
- Alle sechs vorhandenen Fremdbranches wurden verglichen. Kein Datei-Overlap mit
  den beiden Middleware-Dateien oder dem neuen Regressionstest. Roadmap-Branches
  haben Dokumentations-Overlap; diese Änderung schreibt keine Roadmap um.
- 40 JavaScript-Prüfungen der aus dem Quelltext extrahierten Pfadklassifikation
  ausgeführt: korrigierte Klassifikation PASS; vor der Korrektur 14 nicht erkannte
  Screening-Großschreibungsvarianten. Dies ist KEIN Express-/Node-/Vitest-Testlauf.
- Historische Baseline-Evidence desselben main SHA, NICHT Branch-Evidence:
  GitHub Job 104087747014 / Run 34877356395 meldet npm audit --omit=dev
  --audit-level=high: 0 vulnerabilities. Baseline-Vitest: 420 Dateien bestanden,
  1 übersprungen; 2586 Tests bestanden, 2 übersprungen.
- CodeQL-Analysen für JavaScript/TypeScript, Python und Actions auf Baseline waren
  erfolgreich. Erfolgreiche Analyse bedeutet NICHT null CodeQL-Alerts.
- Branch-Node/TypeScript/Vitest/Build/Audit/Container/Hosted-CI: NOT RUN.
  Diese Sitzung stellt keinen Node-/Shell-Ausführungshost bereit.
- Klasse nach docs/governance/PR_CHECK_CLASSIFICATION.md: R (Server/Runtime);
  die erforderlichen Production-/Security-Checks bleiben vor Merge offen.
- Kein Befund wird VERIFIED/CLOSED gesetzt. Unabhängige Verifikation bleibt separat.

## Vollständigkeit und Restauftrag

Dies ist ein begrenzter Remediation-Slice, KEIN abgeschlossener Repository-Vollscan.
Die vollständige Code-Scanning-/Dependabot-/Secret-Alert-Liste ist über die in
dieser Sitzung angebotenen Connector-Endpunkte nicht abrufbar. Kein Export lag vor.
Eine Scanner-Kategorie „Generics“ konnte nicht zugeordnet werden; Repository-Suche
fand TypeScript-Vertragsdokumentation. Generics allein begründen keinen Security-Befund.

Für PVC-01..PVC-18 sind sämtliche Dimensionen einer vollständigen adversarial
Bewertung NOT_TESTED, sofern hier nicht ausdrücklich eine begrenzte
Quelltextbeobachtung dokumentiert ist. Es wird kein PVC-Gesamt-PASS abgeleitet.

Weitere Befunde aus Scan-Exporten, Prompt-/History-Vertrauen und übrigen
Security-Roadmap-Paketen müssen gegen dann-current main separat korreliert werden.

## Verifikation und Rücknahme

Isoliert auszuführen:
npx vitest run tests/unit/securityRouteMatching.test.ts tests/unit/stripeReturnUrlGuard.test.ts tests/unit/verifiedScreeningEntitlement.test.ts tests/unit/verifiedScreeningRouteWiring.test.ts

Erwartung: externe Stripe-Ziele immer 400, erschöpfte Screening-Quota immer 429,
gültige Ziele und erlaubte Quota erreichen den Test-Handler, Katalog verbraucht keine Quota.
Anschließend erforderliche Klasse-R-Checks gegen den exakten Branch-/PR-Head.
Production-Readback erst im bestehenden Release-/Deployment-Prozess.

Bei Regression: scoped Korrektur oder Revert auf frischem Branch von dann-current
main, Human/CODEOWNER-Merge und bestehender Release-Prozess. Kein direktes main-Edit,
keine eigenständige Produktionsmutation; Rücknahme würde die Prüflücke wieder öffnen.
