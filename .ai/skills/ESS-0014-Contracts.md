# ESS-0014-CONTRACTS

## Owner-Änderung 2026-09-15 — FE-CONSENT-V3 / Variante A

**Freigabe:** „Variante A freigegeben“ im zugehörigen Owner-Chat. **Aktivierung:** erst nach Human Merge und separat autorisierter Production-Promotion; Branch-Evidence ist keine Production Acceptance.

Dieser begrenzte Änderungszusatz ersetzt mit Aktivierung ausschließlich die unten beschriebenen CookieHub-Providerbindungen und die AdSense-Ladefreigabe: Selbst gehostetes CookieConsent v3.1.0 wird Consent Source of Truth; Google Analytics bleibt im Basic Mode hinter einem gültigen Analytics-Opt-in. AdSense bleibt vollständig pausiert und alle Werbesignale bleiben `denied`, auch nach „Alle akzeptieren“. Historische CookieHub-Zustimmungen werden nicht übernommen.

Die bisher genannten CookieHub-SDK-/Initializer-/CSP-/Event-Invarianten sind danach historische Providerbindungen. An ihre Stelle treten gepinnte lokale SDK/CSS/License-Dateien, `public/cookieconsent-init.js`, `CookieConsent.validConsent()` plus `acceptedCategory('analytics')` und die auf `window` registrierten Events `cc:onConsent` / `cc:onChange`. Der gespeicherte Widerruf deaktiviert GA, löscht erreichbare GA-Cookies und lädt nach vorheriger GA-Ausführung einmal neu. Die alleinige First-Party-Bridge bleibt `public/google-analytics-consent.js`.

Keine globale Supersession: Zero Google network before opt-in, Basic Consent Mode v2, CSP-Nonce/Report-Only-Grenze, geschützte Pfade/Schutzprüfungen, IAM, Human-/CODEOWNER-Review, Produktionsfreigaben und unabhängige SEC/COMP-Assurance gelten weiter. Neue Consent-Assets werden zusätzlich geschützt. Alte Audit-Evidence wird nicht umgeschrieben. Ein zentraler anonymer Consent-Log-Dienst wird nicht behauptet; Bewertung des lokalen Nachweises bleibt ein COMP-Handoff. AMP-/SEO-Verhalten wird durch diesen Zusatz nicht erweitert.

Umsetzung und Nachweis: `docs/runbooks/GOOGLE_ANALYTICS_SETUP.md` und `docs/projects/frontend/evidence/COOKIECONSENT_V3_MIGRATION_2026-09-15.md`.

---


## Google Marketing Integration & Protected Change Contracts

### Version

1.0.0

### Status

Enterprise Specification

---

## Dokumentklassifizierung

Dieses Dokument definiert ausschließlich die Komponenten- und Sicherheitsverträge von ESS-0014. Repositoryweite IAM-, Event-, Release- und Dokumentationsregeln werden nicht dupliziert.

Bei Konflikt gelten in dieser Reihenfolge:

1. geltendes Recht und zwingende Provider-Anforderungen;
2. ESS-0001-CONTRACTS für globale Enterprise Contracts;
3. bestehende IAM-/Security-ADRs und ESS-0006;
4. ESS-0014 für den Google-Marketing-Scope;
5. dieses Dokument für die technische Contract-Ausprägung.

---

## Cross Reference

**Depends On**

- ESS-0001-CONTRACTS
- ESS-0006 — Security & Compliance
- ESS-0007 — Enterprise Release Center
- ESS-0011 — Enterprise Traceability
- ESS-0012 — Documentation Governance
- ESS-0013 — Enterprise Event Mesh
- ESS-0014 — Google Marketing MCP Governance

**Related ADR**

- ADR-0003.5 — Owner IAM / Step-up
- ADR-0008 — Central IAM Authorization
- ADR-0009 — CORS/Security Hardening
- ADR-0035 — Protected Google Marketing Integration & Strict CSP

---

## 1. Principal Contract

```ts
type MarketingPrincipal =
  | { type: 'human'; userId: string; iamRole: 'owner' | 'admin' | 'supervisor' | 'user' }
  | { type: 'service_account'; serviceAccountId: string };
```

Service Accounts sind keine `Role` und dürfen `profiles.iam_role` nicht erweitern.

---

## 2. Capability Contract

```ts
type GoogleMarketingCapability =
  | 'google.marketing.read'
  | 'google.marketing.plan'
  | 'google.marketing.apply'
  | 'google.marketing.publish'
  | 'google.marketing.rollback'
  | 'google.marketing.credentials.rotate';
```

Ein Grant enthält mindestens:

```ts
interface MarketingCapabilityGrant {
  id: string;
  serviceAccountId: string;
  capability: GoogleMarketingCapability;
  resourceScope: string[];
  purpose: string;
  grantedByOwnerUserId: string;
  issuedAt: string;
  expiresAt: string;
  revokedAt?: string;
}
```

### Contract

- Grant Create/Update/Revoke: Human OWNER + frischer Step-up.
- Service Account darf keinen Grant erzeugen, bearbeiten, verlängern oder widerrufen.
- `rollback` und `publish` werden niemals aus einem allgemeineren Recht abgeleitet.
- Capability Matching ist exact/fail-closed.

---

## 3. Protected Resource Contract

Initial geschützte Ressourcen:

```text
index.html
public/cookiehub-init.js
public/google-analytics-consent.js
server.ts::Content-Security-Policy
CookieHub production configuration
GA4 production property/data stream
GTM production container/version
AdSense publisher/site configuration
Google Ads production customer/campaign resources
Google Marketing MCP/API credential configuration
```

Spätere Implementierungen dürfen den Scope über eine Registry erweitern, aber niemals implizit verkleinern.

---

## 4. Protected Change Classification Contract

Eine Änderung ist `protected`, wenn sie:

- einen geschützten Pfad entfernt;
- Consent früher/weiter öffnet;
- eine CSP-Direktive schwächt oder entfernt;
- Provider-/Property-/Publisher-/Customer-Identitäten ändert;
- ein IAM-/Approval-/Audit-Gate entfernt;
- eine zuvor behobene Sicherheits-/Consent-Regression wieder einführt;
- einen Rollback/Revert auf eine frühere Integrationsversion durchführt.

Der Classifier muss konservativ sein: bei Unsicherheit `protected=true`.

---

## 5. Impact Disclosure Contract

Vor interaktivem protected change MUSS der Agent mindestens dieses Schema präsentieren:

```ts
interface ProtectedChangeImpact {
  privacyConsent: string;
  analyticsMeasurement: string;
  adsMonetization: string;
  cspSecurity: string;
  complianceAudit: string;
  runtimeSeoAmp: string;
  affectedResources: Array<{
    resource: string;
    beforeFingerprint: string;
    afterFingerprint: string;
  }>;
}
```

Erst nach expliziter Bestätigung darf ein Approval-Prozess beginnen.

---

## 6. Explicit Confirmation Contract

Zulässig:

- eindeutige Bestätigung des konkret beschriebenen Diffs und der Auswirkungen;
- OWNER Approval Artifact für einen Headless-Service-Account-Job.

Nicht zulässig:

- aus einer früheren Unterhaltung abgeleitete Zustimmung;
- Schweigen;
- allgemeine Freigaben wie `mach weiter` ohne Bezug auf den Impact-Diff;
- ein Service Account, der sein eigenes Approval erzeugt;
- ein AI-Agent, der OWNER-Approval simuliert.

---

## 7. Human OWNER Authorization Contract

Ein Human protected change verlangt gleichzeitig:

```text
verified Supabase identity
AND iam_role == owner
AND fresh one-time step-up
AND explicitConfirmation == true
AND non-expired approval context
AND expectedFingerprint matches live state
```

Fehlt ein Element: `DENY`.

---

## 8. Service Account Authorization Contract

Ein Service Account protected change verlangt:

```text
verified service principal
AND active exact capability grant
AND target within resourceScope
AND grant not expired/revoked
AND expectedFingerprint matches live state
```

Für `google.marketing.rollback` zusätzlich:

```text
one-time job-specific OWNER approval artifact
AND approval target == requested target
AND approval diff fingerprint == requested diff
AND approval unused
AND approval not expired
```

---

## 9. Approval Artifact Contract

```ts
interface ProtectedChangeApproval {
  id: string;
  requestId: string;
  actorType: 'human' | 'service_account';
  actorId: string;
  ownerUserId: string;
  ownerGrantId?: string;
  capability: GoogleMarketingCapability;
  targets: string[];
  beforeFingerprints: string[];
  afterFingerprints: string[];
  impactSummaryHash: string;
  reason: string;
  explicitConfirmation: true;
  issuedAt: string;
  expiresAt: string;
  usedAt?: string;
}
```

Approval wird atomar als benutzt markiert. Replay ist unzulässig.

---

## 10. Dry-Run Contract

Alle mutierenden Tools:

```ts
interface MutationRequest {
  dryRun: boolean; // default true
  expectedFingerprint: string;
  reason: string;
  approvalId?: string;
}
```

`dryRun=false` ohne vollständige AuthZ/Approval-Kette -> deny.

---

## 11. MCP Separation Contract

### Official Google MCP

Google Analytics MCP und Google Ads MCP werden entsprechend dem jeweils dokumentierten Funktionsumfang verwendet. Ist der MCP read-only, bleibt er read-only.

### CAPITAL-AI API adapters

Mutierende Provideroperationen laufen in getrennten, explizit benannten Adaptern. Ein MCP Tool darf einen solchen Adapter nur nach Policy-/IAM-/Approval-Gate aufrufen.

### Claude

Claude ist Client/Host/Implementer, nicht Trust Root.

---

## 12. CSP Nonce Contract

Für production HTML:

```ts
nonce = cryptographicallyRandomPerResponse();
```

Pflichten:

- mindestens 128 Bit Entropie;
- Base64/Base64URL-safe Darstellung;
- neuer Nonce pro HTML Response;
- derselbe Request-Nonce im CSP Header und allen autorisierten Script Tags dieser Response;
- keine Speicherung als globaler Prozesswert;
- kein Logging des Nonce als Sicherheitsnachweis notwendig;
- statische Assets benötigen keinen eigenen dynamischen Nonce-Header.

AdSense-kompatibler Script-Core:

```text
script-src 'nonce-{nonce}' 'unsafe-inline' 'unsafe-eval' 'strict-dynamic' https: http:
```

Zusätzlich:

```text
object-src 'none'
base-uri 'none'
```

---

## 13. CookieHub CSP Contract

Mindestens:

```text
script/style: cookiehub.net cdn.cookiehub.eu
connect: ds.cookiehub.net consent.cookiehub.net region-eu.cookiehub.net consent-eu.cookiehub.net cookiehub.net cdn.cookiehub.eu
```

Die tatsächlich benötigten Endpoints sind gegen die aktuelle CookieHub-Dokumentation zu validieren.

---

## 14. Consent Runtime Contract

Vor zulässigem Consent dürfen keine Analytics-/Marketing-Daten entgegen dem aktiven CAPITAL-AI-Consent-Modell übertragen werden.

Required Google Consent dimensions:

```text
analytics_storage
ad_storage
ad_user_data
ad_personalization
```

CookieHub ist die Source of Truth für die Nutzerentscheidung.

---

## 15. AMP Contract

`amp-auto-ads` darf nur als aktiv/funktional bewertet werden, wenn das Dokument die AMP-Validierungsanforderungen erfüllt.

Ein normales React/Vite-Dokument mit eingefügtem `amp-auto-ads` Element ist keine bestätigte AMP-Implementierung.

Tests und Dokumentation müssen zwischen `present in markup` und `valid AMP runtime` unterscheiden.

---

## 16. Audit Contract

Jeder protected change erzeugt mindestens:

```text
ProtectedChangeRequestedEvent
ProtectedChangeApprovedEvent | ProtectedChangeDeniedEvent
ProtectedChangeAppliedEvent
ProtectedChangeVerifiedEvent | ProtectedChangeVerificationFailedEvent
```

Eventnamen müssen vor Registrierung gegen ESS-0013 Event Catalog geprüft werden; existiert bereits ein semantisch gleiches Event, ist dieses wiederzuverwenden.

---

## 17. Rollback Contract

Rollback ist selbst eine destructive mutation und **kein Sonderweg um Approval zu umgehen**.

Rollback verlangt:

1. Impact Disclosure;
2. explicit confirmation;
3. OWNER+Step-up oder Service Account + exact rollback grant + one-time OWNER approval;
4. Dry-run diff;
5. Pre-change backup/fingerprint;
6. Apply;
7. Post-change verification;
8. Audit Evidence.

Emergency/Break-Glass darf die OWNER-/Audit-Anforderung nicht abschaffen; ein separater Break-Glass-ADR/Mechanismus kann nur den operativen Ablauf beschleunigen.

---

## 18. Test Contract

Pflichttests:

- role denial matrix;
- service-account capability matrix;
- approval expiry/replay;
- fingerprint race/mismatch;
- per-response nonce uniqueness;
- CSP header/script nonce parity;
- CookieHub banner initialisation;
- no analytics before consent;
- AdSense CSP compatibility smoke test;
- AMP markup presence plus separate AMP-validity test;
- audit evidence completeness.

---

## 19. Traceability Contract

ESS-0014 muss mindestens zu folgenden Artefakten bidirektional verlinkt werden:

- ADR-0035;
- CSP implementation;
- consent runtime;
- IAM/step-up;
- service account grant implementation;
- Google Marketing MCP/API architecture;
- relevant tests;
- production evidence.

---

## End of ESS-0014-CONTRACTS

