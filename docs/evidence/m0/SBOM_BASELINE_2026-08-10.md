# SPDX-SBOM-Baseline — M0 Evidence

Stand: 2026-08-10
Repository: `SvenKulessa/Finance`
Baseline-SHA: `f615cf4062f60eff07772c948c461025729a89dd`

## Quelle

Die GitHub Dependency Graph API liefert für dieses Repository erfolgreich ein Software Bill of Materials über:

`GET /repos/SvenKulessa/Finance/dependency-graph/sbom`

## Verifizierte Metadaten

- SPDX Version: `SPDX-2.3`
- Data License: `CC0-1.0`
- Dokumentname: `com.github.SvenKulessa/Finance`
- Erzeuger: GitHub Dependency Graph / protobom
- Erzeugungszeitpunkt der abgefragten Evidence: 2026-08-10T21:54:13Z
- Paketobjekte enthalten Package URLs (`purl`), Versionsinformationen und Lizenzmetadaten, soweit GitHub diese bestimmen kann.

Damit ist nachgewiesen, dass GitHub eine transitive Dependency-Graph-basierte SPDX-SBOM für den aktuellen Repository-Zustand erzeugen kann.

## Grenzen der M0-Erfassung

Der angebundene GitHub-Connector liefert große API-Antworten gekürzt an den Chat-Client. Deshalb wird die vollständige SBOM in M0 nicht manuell aus einer gekürzten Toolantwort rekonstruiert. Dies vermeidet eine unvollständige oder verfälschte Evidence-Datei.

Stattdessen wird M6 einen reproduzierbaren CI-Schritt einführen, der die vollständige SBOM als Build-/Release-Evidence exportiert, hasht und als Artefakt mit Source SHA und Build Run verknüpft.

## Sicherheitsentscheidung

M0 bewertet die Existenz und Abrufbarkeit der vollständigen GitHub Dependency Graph SBOM als ausreichende Baseline-Evidence. Die kryptographische Persistierung und Attestation ist ausdrücklich M6-Scope.

`M0-B01 Dependency/SBOM-Baseline`: PASS.

Residual Controls:

- M6: vollständiger SPDX/CycloneDX Export im CI.
- M6: SHA-256 Digest der SBOM.
- M6: Verknüpfung `source_sha → sbom_digest → artifact_digest → provenance`.
