# SEO S3 — Management Dashboard

**Roadmap:** SEO-ROADMAP-0001 / S3  
**Status:** im Branch implementiert  
**Zugriff:** Owner/Admin; Backend-Endpunkte bleiben durch `checkAdminAccess` geschützt.

## Geliefert

- neuer Admin-Tab „SEO Management“
- KPI-Karten für Keywords, Rankings und Content-Inventar
- Keyword- und Content-Tabellen
- Quellenstatus für Search Console, GA4 und manuelle Importe
- defensiv validierte API-Antworten
- ehrliche Leerstati statt Demo-, Mock- oder Schätzwerten
- Tests für ungültige Payloads und Quellenstatus

## Datenquellen

Das Dashboard liest ausschließlich `/api/seo/summary`, `/keywords`, `/ranks` und `/content`.
Search Console gilt nur dann als verbunden, wenn ein Rank-Snapshot diese Quelle ausweist.
GA4 bleibt „nicht verbunden“, bis ein produktiver, autorisierter Datenadapter bereitsteht.

## Bewusste Grenzen

- keine externe Google-, Supabase- oder Render-Mutation
- keine Credentials im Frontend
- keine künstlichen Rankings
- S1 verwendet weiterhin den vorhandenen In-Memory-Store; Persistenz-Wiring bleibt separat
