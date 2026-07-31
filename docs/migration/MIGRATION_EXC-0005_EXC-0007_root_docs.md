# Migration Report — EXC-0005 und EXC-0007

## Enterprise Migration

### Migration ID

MIG-EXC-0005-0007

### Titel

Verlagerung von `ORCHESTRATORS_AND_SCORING_ENGINES.md` nach `docs/architecture/` und `favicon.svg` nach `public/`

### Version

1.0.0

### Status

**Completed** — beide Strukturmigrationen durchgeführt und verifiziert

### Datum

2026-07-31

### Kategorie

Structural Migration gemäß ESS-0001-CONTRACTS Chapter 14, *Migration Categories*

### ADR-Referenz

ADR-0011 — Bestandsschutz und Zielstruktur für die Root-Abweichungen

### Verantwortlich

Documentary Engine (EXC-0005) · Frontend (EXC-0007)

---

# Enterprise Purpose

Dieser Report dokumentiert die Auflösung der registrierten Ausnahmen EXC-0005 und EXC-0007
gemäß ESS-0001-CONTRACTS Chapter 14. Beide Positionen waren in ADR-0011 als voraussetzungsfrei
und sofort umsetzbar eingestuft.

---

# Abgrenzung

Beide Migrationen sind **Structural Migrations**. Es wurde ausschließlich je ein Artefakt im
Repository verschoben. Kein Build wurde ausgeführt, keine Laufzeitumgebung verändert.

---

## Teil 1 — EXC-0005: `ORCHESTRATORS_AND_SCORING_ENGINES.md`

### Ausgangszustand

```text
ORCHESTRATORS_AND_SCORING_ENGINES.md   (Repository-Root)
```

**Verletzte Contracts**

| Contract | Verletzung |
|---|---|
| Chapter 2 — Documentation Placement | Dokumentation außerhalb `docs/` ohne Werkzeugbindung |

### Zielzustand

```text
docs/architecture/ORCHESTRATORS_AND_SCORING_ENGINES.md
```

### Durchführung

| Schritt | Maßnahme | Ergebnis |
|---|---|---|
| 1 | Prüfsumme des Ausgangsartefakts gebildet | `f24340be…c45591a` |
| 2 | Referenzanalyse über das gesamte Repository | 3 Treffer, alle in dieser Standard-Lieferung selbst (`ADR-0011`, `exception-registry.json`, `ARCHITECTURE_GAP_REPORT.md`) — keine Code-Referenz |
| 3 | Verschiebung als Git-Rename | Ähnlichkeit 100 % |
| 4 | Prüfsumme des Zielartefakts gebildet | `f24340be…c45591a` |

**Prüfsummenvergleich**

```text
vorher   f24340be80bb10a5ebe93843dcbc7b18c76d43ddba61cbaf6487d7219c45591a
nachher  f24340be80bb10a5ebe93843dcbc7b18c76d43ddba61cbaf6487d7219c45591a
```

Identisch. Der Inhalt wurde nicht verändert.

### Bewusst nicht miterledigt

ADR-0011 nennt für EXC-0005 zusätzlich die *Ergänzung von ESS- und ADR-Referenzen gemäß
Chapter 7*. Diese Ergänzung wurde **nicht** vorgenommen.

**Begründung** — dieselbe wie bei EXC-0003: eine inhaltliche Änderung hätte die Prüfsumme
verändert und den Nachweis der reinen Strukturverlagerung zerstört. Chapter 7 sieht die
Ergänzung solcher Referenzen als generatorgestützten Vorgang der Documentation Engine vor,
die noch nicht existiert. Der Punkt bleibt unter GAP-029 offen und ist keine Rückstellung
dieser Migration, sondern ihrer bewussten Abgrenzung.

---

## Teil 2 — EXC-0007: `favicon.svg`

### Ausgangszustand

```text
favicon.svg   (Repository-Root)
public/        (leer, ausschließlich .gitkeep)
```

**Verletzte Contracts**

| Contract | Verletzung |
|---|---|
| Chapter 2 — Repository Root, `public/` als Ort statischer Web-Ressourcen | Statische Ressource außerhalb des vorgesehenen Verzeichnisses |

### Zielzustand

```text
public/favicon.svg
```

### Durchführung

| Schritt | Maßnahme | Ergebnis |
|---|---|---|
| 1 | Prüfsumme des Ausgangsartefakts gebildet | `eb8b5116…7cc6a9451` |
| 2 | Referenz in `index.html` geprüft | `<link rel="icon" href="/favicon.svg">` — bereits root-absolut |
| 3 | Vite-Konfiguration geprüft (`vite.config.ts`) | kein `publicDir`-Override → Default `public/` |
| 4 | Build- und Container-Pfad geprüft (`package.json`, `Dockerfile`) | `vite build` kopiert ausschließlich `publicDir` nach `dist/`; Docker kopiert ausschließlich `dist/` in das Runtime-Image |
| 5 | Verschiebung als Git-Rename | Ähnlichkeit 100 % |
| 6 | Prüfsumme des Zielartefakts gebildet | `eb8b5116…7cc6a9451` |
| 7 | `index.html` erneut geprüft | keine Änderung erforderlich, da Referenz bereits root-absolut ist |

**Prüfsummenvergleich**

```text
vorher   eb8b5116e54ebd520ec0558c09e5180a348bd93a1f02da4b0a507747cc6a9451
nachher  eb8b5116e54ebd520ec0558c09e5180a348bd93a1f02da4b0a507747cc6a9451
```

Identisch. `index.html` wurde nicht verändert.

### Befund während der Migration

## FND-EXC-0007-01 — Das Favicon gelangte vor dieser Migration nicht in den Produktions-Build

**Stufe** Low

**Kategorie** Latenter Fehler, aufgedeckt durch Strukturmigration

**Nachweis**

- `vite.config.ts` setzt keinen abweichenden `publicDir`; Vite kopiert beim Build
  ausschließlich den Inhalt von `public/` unverändert nach `dist/`.
- `favicon.svg` lag vor dieser Migration im Repository-Root, **nicht** in `public/`.
- Der `Dockerfile`-Runtime-Stage kopiert ausschließlich `dist/` in das Produktions-Image
  (`COPY --from=builder /app/dist ./dist`).
- `render.yaml` und `package.json` (`build`, `start`) führen keinen zusätzlichen Kopiervorgang
  für Root-Dateien aus.

**Bewertung**

`index.html` referenzierte das Favicon bereits vor dieser Migration korrekt als `/favicon.svg`.
Die Datei war jedoch in keinem Schritt der Build-Kette Bestandteil von `dist/`. In der
Produktionsumgebung war die Anfrage nach `/favicon.svg` damit mit hoher Wahrscheinlichkeit ein
404, während sie im lokalen Entwicklungsserver möglicherweise funktionierte, da Vite dort in
bestimmten Konfigurationen zusätzlich Dateien aus dem Projekt-Root direkt bedient.

**Auswirkung dieser Migration**

Mit der Verlagerung nach `public/favicon.svg` wird die Datei ab dem nächsten Build regulär
nach `dist/favicon.svg` kopiert und ist über `/favicon.svg` erreichbar. Diese Migration behebt
den Fehler als Nebeneffekt der Strukturkonformität.

**Empfehlung**

Nach dem nächsten Produktions-Deployment verifizieren, dass `/favicon.svg` eine 200-Antwort
liefert. Kein weiterer Code ist zu ändern.

---

# Validierung

| Prüfung | EXC-0005 | EXC-0007 |
|---|---|---|
| Inhalt unverändert | ✓ Prüfsummen identisch | ✓ Prüfsummen identisch |
| Git-Rename erkannt | ✓ Ähnlichkeit 100 % | ✓ Ähnlichkeit 100 % |
| Referenzierende Datei angepasst, falls nötig | entfällt (keine Referenz) | ✓ keine Änderung nötig (bereits root-absolut) |
| Root-Abweichung beseitigt | ✓ | ✓ |
| Kein Build ausgeführt, kein Betriebszustand verändert | ✓ | ✓ |

---

# Rollback

**Strategie** Vollständige Umkehrung durch Rücknahme des jeweiligen Git-Renames.

```bash
git mv docs/architecture/ORCHESTRATORS_AND_SCORING_ENGINES.md ORCHESTRATORS_AND_SCORING_ENGINES.md
git mv public/favicon.svg favicon.svg
```

**Voraussetzungen** keine

**Risiken** Rücknahme von EXC-0007 reproduziert den unter FND-EXC-0007-01 dokumentierten
Zustand (Favicon fehlt im Produktions-Build).

**Rollback-Tests** Prüfsummenvergleich nach Rücknahme

**Rollback-Version** identisch mit der Ausgangsversion, da beide Migrationen inhaltsneutral sind

---

# Auswirkung auf offene Befunde

| Befund | vorher | nachher |
|---|---|---|
| GAP-006 | fünf verbleibende nicht aufgelöste Root-Abweichungen | drei verbleibende (`server/`, `server.ts`; die übrigen vier sind `Permanent` und keine Befunde) |
| GAP-020 | teilweise (Dokumentation ohne ESS-Bezug) | unverändert offen, betrifft Inhalt nicht Ort |
| GAP-029 | Dokument ohne ESS-/ADR-Referenz | unverändert offen, siehe Abgrenzung oben |

---

# Version

Beide Migrationen verändern keine Schnittstelle, kein Verhalten und keinen Datenbestand.

Versionsauswirkung gemäß Chapter 9: **Patch**.

Die tatsächliche Versionsvergabe obliegt dem Version Manager und ist bis zur Auflösung von
GAP-019 (vier widersprüchliche Versionsstände) ausgesetzt.

---

# Related Documents

ADR-0011 — Bestandsschutz und Zielstruktur für die Root-Abweichungen

`.ai/registry/exception-registry.json` — EXC-0005, EXC-0007

`docs/architecture/ARCHITECTURE_GAP_REPORT.md` — GAP-006, GAP-020, GAP-029

ESS-0001-CONTRACTS Chapter 14 — Migration & Lifecycle Contracts

---

# Version History

| Version | Status | Beschreibung |
|---|---|---|
| 1.0.0 | Completed | Strukturmigrationen EXC-0005 und EXC-0007 durchgeführt und verifiziert, Favicon-Build-Fehler FND-EXC-0007-01 aufgedeckt |

---

# End of Document

MIG-EXC-0005-0007

CAPITAL-AI Migration Report

Version 1.0.0
