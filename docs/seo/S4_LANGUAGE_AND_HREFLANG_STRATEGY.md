# SEO S4 — Sprach- und hreflang-Strategie

**Roadmap:** SEO-ROADMAP-0001 / S4  
**Status:** abgeschlossen  
**Baseline:** `main@ac47dfd901155c56c61f733bc7e8df9e892341ff`

## Entscheidung

CAPITAL-AI bleibt bis zur Bereitstellung vollständig übersetzter, eigenständig adressierbarer
Sprachvarianten **German-first**:

- Dokument- und Inhaltssprache: Deutsch
- HTML-Sprachdeklaration: `lang="de"`
- strukturierte Daten: `inLanguage: "de-DE"`
- Open Graph Locale: `de_DE`
- bestehende kanonische URLs bleiben sprachneutral und zeigen auf die deutsche Fassung
- Keywords dürfen Produkt- oder Fachbegriffe auf Englisch enthalten, werden aber als
  deutschsprachige Suchintention verwaltet

## hreflang-Regel

Aktuell werden **keine** `hreflang`-Links ausgegeben. Es existieren keine gleichwertigen,
kanonischen Übersetzungs-URLs. Selbstreferenzielle oder erfundene Alternativen würden Suchmaschinen
eine nicht vorhandene Internationalisierung signalisieren.

`hreflang` wird erst aktiviert, wenn für jede freigegebene Sprache:

1. eine stabile URL-Struktur beschlossen ist, beispielsweise `/de/...` und `/en/...`;
2. Titel, Meta Description, sichtbarer Hauptinhalt und rechtliche Texte vollständig übersetzt sind;
3. jede Sprachseite einen Self-Canonical besitzt;
4. alle Varianten wechselseitig aufeinander verweisen;
5. `x-default` auf eine bewusst gewählte Default- oder Sprachauswahlseite zeigt;
6. Sitemap, Prerender-Ausgabe und Tests dieselben Sprachbeziehungen enthalten.

## Keyword-Strategie

- Locale im SeoEngine-Keyword-Register bleibt ein Pflichtmerkmal.
- Deutsche Inhalte verwenden `de-DE`.
- Englische Finanz- und Technikbegriffe dürfen Bestandteil deutscher Keyword-Phrasen sein.
- Ein Keyword erhält erst dann `en-*`, wenn sein Zielpfad tatsächlich englischen Inhalt liefert.
- Ranking-Daten verschiedener Locales werden nicht zusammengeführt.

## Akzeptanznachweis

- `index.html` enthält `lang="de"`.
- JSON-LD weist die Website mit `de-DE` aus.
- Open Graph verwendet `de_DE`.
- Im Repository existiert kein produktives `hreflang`.
- Es existieren keine kanonischen englischen Inhaltsrouten.
- Kein externer Dienst und keine Produktionskonfiguration wurde verändert.

## Folgepunkt

Bei Beginn von Roadmap J3 muss diese Strategie durch einen eigenen Internationalisierungs-ADR
ersetzt oder erweitert werden. Erst dieser Schritt darf URL-Schema, Locale-Fallback,
Übersetzungs-Governance und produktive `hreflang`-Ausgabe festlegen.
