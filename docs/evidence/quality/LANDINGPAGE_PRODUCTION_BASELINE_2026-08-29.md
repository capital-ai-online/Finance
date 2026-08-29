# Landingpage Production Baseline — 2026-08-29

- **Claim:** `WP-QM-PERF-00 / Landingpage-Baseline`
- **Produktions-Commit:** `4c25dec3ff4a9b2507bae8cfd265f055c6afa52f`
- **Main vor Sicherung:** `39ff18725d4bfd39254a9978968dbe3c9058f7c3`
- **Kanonischer Pfad:** `src/features/public/ui/LandingPage.tsx`
- **Produktions-Blob-SHA:** `89b3ec45655ec2141276c101e14252e1a99da73c`
- **Status:** funktionale Produktions-Landingpage als Main-Baseline wiederhergestellt

## Zweck

Die aktuell produktive, funktionsfähige Landingpage wird als kanonische Referenz im Repository gesichert. Der Performance-Deploy aus PR #604 hatte `src/features/public/ui/LandingPage.tsx` durch eine vereinfachte eigenständige Public-Shell ersetzt. Dieser Ersatz entsprach nicht der produktiven funktionalen Baseline und wurde auf Render zurückgerollt.

Dieser Sicherungs-PR übernimmt ausschließlich die produktive Landingpage zurück in den kanonischen Pfad und passt den bestehenden Regressionstest so an, dass ein erneuter Ersatz durch eine funktionsreduzierte Mockup-Landingpage erkannt wird.

## Geschützte Invarianten

- `/` verwendet weiterhin `LandingPage` als kanonische öffentliche Root-Route.
- Die Landingpage verwendet die bestehende Dashboard-Oberfläche und damit die produktiv vorhandenen Funktionen.
- Der öffentliche Besucherzustand bleibt rein präsentationsbezogen und wird nicht als Supabase-/IAM-Session persistiert.
- Authentifizierung bleibt auf `/login` getrennt.
- Supabase Auth, Onboarding, AAL und MFA werden nicht verändert.
- Keine zweite Landingpage, Public-Shell oder Routing-Authority wird eingeführt.

## Abgrenzung

Nicht Teil dieses PRs sind:

- Performanceoptimierungen am Dashboard;
- Bundle-Splitting;
- Event-Loop-Optimierungen;
- Provider-Concurrency;
- Datenbankänderungen;
- Render-/Supabase-/Stripe-Mutationen.

Diese Themen werden ausschließlich über die separate Qualitätsmanagement- und Performance-Roadmap weitergeführt und dürfen die hier gesicherte funktionale Baseline nicht ersetzen.

## Regression Evidence

`tests/unit/publicLandingRoute.test.ts` verlangt für die kanonische Landingpage weiterhin:

- Import der bestehenden Dashboard-Authority;
- Rendering von `<Dashboard>`;
- Verwendung von `PUBLIC_VISITOR_SESSION`;
- vorhandene Enterprise-Scorer-Funktionalität im Dashboard;
- unveränderte Login-/Protected-Route-Grenzen;
- unveränderte OAuth-Branding-/Legal-Metadaten.

## Rollback

Repository-only: Human-reviewed Git-Revert des Sicherungs-PRs. Es werden keine externen Systeme, Secrets, Datenbanken oder Provider mutiert.
