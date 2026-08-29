# Landingpage Production Baseline — 2026-08-29

- **Claim:** `WP-QM-PERF-00 / Landingpage-Baseline`
- **Produktions-Commit:** `4c25dec3ff4a9b2507bae8cfd265f055c6afa52f`
- **Main vor Sicherung:** `39ff18725d4bfd39254a9978968dbe3c9058f7c3`
- **Kanonischer Pfad:** `src/features/public/ui/LandingPage.tsx`
- **Produktions-Blob-SHA:** `89b3ec45655ec2141276c101e14252e1a99da73c`
- **Status:** funktionale Produktions-Landingpage als Main-Baseline wiederhergestellt; Dashboard-Abhängigkeitsgraph wird ausschließlich über eine technische Lazy-Ladegrenze vom initialen Entry getrennt

## Zweck

Die aktuell produktive, funktionsfähige Landingpage wird als kanonische Referenz im Repository gesichert. Der Performance-Deploy aus PR #604 hatte `src/features/public/ui/LandingPage.tsx` durch eine vereinfachte eigenständige Public-Shell ersetzt. Dieser Ersatz entsprach nicht der produktiven funktionalen Baseline und wurde auf Render zurückgerollt.

Der Sicherungs-PR übernimmt die produktive Dashboard-basierte Landingpage zurück in den kanonischen Pfad. Zur Auflösung des CI- und Performance-Konflikts wird ausschließlich der Import des bestehenden `app/dashboard/Dashboard` über `React.lazy` dynamisch geladen. Die gerenderte fachliche Oberfläche, ihre Navigation, der Enterprise Scorer und die bestehende Dashboard-Authority bleiben unverändert. Es wird keine zweite Landingpage und keine reduzierte Public-Shell eingeführt.

## Ursache des CI-Fehlers

`tests/unit/frontendPerformanceBoundary.test.ts` wurde mit PR #604 auf die dort eingeführte reduzierte Public-Shell zugeschnitten. Nach der Wiederherstellung der produktiven Landingpage erwartete der Test weiterhin:

- `React.lazy`;
- keinen statischen Dashboard-Import;
- einen direkten Lazy-Import von `CryptoScoringEnterprise`;
- `IntersectionObserver` innerhalb der Landingpage.

Der React-Import selbst war funktionsfähig. Der Fehler war ein veralteter Architekturvertrag im Test gegenüber der wiederhergestellten funktionalen Baseline.

Gleichzeitig hätte ein einfacher statischer Import von `app/dashboard` den vollständigen Dashboard-/Scorer-Abhängigkeitsgraph wieder an das initiale Public-Bundle gebunden. Deshalb wird die fachliche Produktionsoberfläche beibehalten, aber ihr bestehender Dashboard-Einstieg als Async-Chunk geladen.

## Geschützte Invarianten

- `/` verwendet weiterhin `LandingPage` als kanonische öffentliche Root-Route.
- Die Landingpage verwendet ausschließlich die bestehende Dashboard-Oberfläche und damit die produktiv vorhandenen Funktionen.
- Das Dashboard wird über `React.lazy(() => import('../../../app/dashboard/Dashboard'))` geladen und nicht statisch in den Landingpage-Entry aufgenommen.
- Der öffentliche Besucherzustand bleibt rein präsentationsbezogen und wird nicht als Supabase-/IAM-Session persistiert.
- Authentifizierung bleibt auf `/login` getrennt.
- Supabase Auth, Onboarding, AAL und MFA werden nicht verändert.
- Keine zweite Landingpage, Public-Shell oder Routing-Authority wird eingeführt.

## Abgrenzung

Nicht Teil dieses PRs sind:

- funktionale Änderungen am Dashboard;
- neue Landingpage-Komponenten;
- Event-Loop-Optimierungen;
- Provider-Concurrency;
- Datenbankänderungen;
- Render-/Supabase-/Stripe-Mutationen.

Die technische Async-Ladegrenze ist Teil dieses PRs, weil sie die bestehende Bundle-Performance-Grenze wiederherstellt, ohne die produktive Oberfläche zu ersetzen.

## Regression Evidence

`tests/unit/publicLandingRoute.test.ts` verlangt für die kanonische Landingpage weiterhin:

- dynamischen Import der bestehenden Dashboard-Authority;
- Rendering von `<LazyDashboard>`;
- Verwendung von `PUBLIC_VISITOR_SESSION`;
- vorhandene Enterprise-Scorer-Funktionalität im bestehenden Dashboard;
- unveränderte Login-/Protected-Route-Grenzen;
- unveränderte OAuth-Branding-/Legal-Metadaten.

`tests/unit/frontendPerformanceBoundary.test.ts` schützt zusätzlich:

- keinen statischen Dashboard-Import im Public Entry;
- `React.lazy` und `React.Suspense` als reine Ladegrenze;
- Beibehaltung des 900-KiB-Initial-Entry-Budgets;
- keine Rückkehr zur separaten PR-#604-Scorer-Public-Shell.

## Rollback

Repository-only: Human-reviewed Git-Revert des Sicherungs-PRs. Es werden keine externen Systeme, Secrets, Datenbanken oder Provider mutiert.
