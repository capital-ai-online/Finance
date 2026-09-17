#!/usr/bin/env python3
"""Bundle every Markdown document of this repository into thematic PDFs.

The PDFs are meant as hand-over sources for NotebookLM (podcast / video
generation). NotebookLM ingests text-based PDFs, so the output is plain,
selectable text with a cover page, a linked table of contents and a visible
repository path for every embedded document.

Dependencies (not part of the Node toolchain of this repository):

    pip install markdown weasyprint pygments

Usage:

    python3 scripts/docs/export_notebooklm_pdfs.py
    python3 scripts/docs/export_notebooklm_pdfs.py --only 04
    python3 scripts/docs/export_notebooklm_pdfs.py --out-dir /tmp/pdf

Every Markdown file below the scanned roots must be claimed by exactly one
bundle. The script fails loudly when a file is unassigned or claimed twice, so
newly added documentation cannot silently drop out of the export.
"""

from __future__ import annotations

import argparse
import datetime as dt
import html
import re
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path

try:
    import markdown as markdown_lib
    from weasyprint import HTML
except ModuleNotFoundError as exc:  # pragma: no cover - environment guard
    sys.exit(
        f"Missing dependency: {exc.name}\n"
        "Install with: pip install markdown weasyprint pygments"
    )

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUT_DIR = REPO_ROOT / "docs" / "exports" / "notebooklm"

# Markdown below these roots is exported. Everything else (node_modules, build
# output, ...) is ignored.
SCAN_ROOTS = ("docs", ".ai", "src", "scripts", "tests", ".github")
SCAN_ROOT_FILES = ("README.md", "AGENTS.md", "CLAUDE.md")

EXCLUDED_DIR_NAMES = {"node_modules", "dist", "build", "coverage", ".git"}

# The export folder holds this script's own output, including a generated
# manifest. Re-ingesting it would duplicate content into the bundles.
EXCLUDED_PREFIXES = ("docs/exports/",)

# The architecture folder is the largest single cluster in the repository and is
# split by subject instead of by an arbitrary alphabetical cut. Names are
# matched against the file name inside docs/architecture/.
ARCHITECTURE_ENTERPRISE_CORE = {
    "AI_VALUE_CHAIN_VALIDATION.md",
    "ARCHITECTURE_GAP_REPORT.md",
    "CAPITAL_AI_ARCHITEKTUR_BEWERTUNGSMATRIX_2026-08-08.md",
    "COMPONENT_CONSISTENCY_REPORT.md",
    "DATENQUALITAETSSCHICHT.md",
    "ENTERPRISE_EVENT_MESH_READINESS_REPORT.md",
    "ENTERPRISE_EVENT_READINESS_REPORT.md",
    "ENTERPRISE_FINTECH_ARCHITECTURE_AUDIT.md",
    "ENTERPRISE_FINTECH_ARCHITECTURE_NACHAUDIT.md",
    "ENTERPRISE_FINTECH_FINALIZATION_REPORT.md",
    "ENTERPRISE_FINTECH_PRODUCTION_BENCHMARK_AUDIT.md",
    "ENTERPRISE_FINTECH_REMEDIATION_PLAN.md",
    "ENTERPRISE_FINTECH_SCREENING_GOVERNANCE_AUDIT.md",
    "ENTERPRISE_MATURITY_REPORT.md",
    "ENTERPRISE_PRODUCTION_AUDIT.md",
    "ENTERPRISE_SCREENING_REMEDIATION_2026-08.md",
    "ENTERPRISE_SCREENING_SCORING_MASTER_ARCHITECTURE.md",
    "GOVERNANCE_MATURITY_REPORT.md",
    "MULTI_PROVIDER_MARKET_DATA_EVALUATION.md",
    "ORCHESTRATORS_AND_SCORING_ENGINES.md",
    "REPOSITORY_STRUCTURE_ANALYSIS.md",
    "ROADMAP.md",
}

# Google Marketing / Analytics / Consent documents live in several folders but
# form one protected subject area (see ESS-0014 and ADR-0035).
GOOGLE_MARKETING_FILES = {
    "docs/architecture/CAPITAL_AI_ENTERPRISE_GOOGLE_ANALYTICS_MCP_IMPLEMENTATION.md",
    "docs/architecture/CAPITAL_AI_GOOGLE_MARKETING_MCP_ARCHITECTURE.md",
    "docs/architecture/CAPITAL_AI_GOOGLE_MARKETING_MCP_TOPOLOGY.md",
}


@dataclass
class Bundle:
    """One output PDF."""

    key: str
    title: str
    subtitle: str
    summary: str
    matches: object  # Callable[[str], bool]
    # Repository-relative paths that should lead the bundle, in this order.
    # Everything else follows sorted by path.
    lead: tuple[str, ...] = ()
    documents: list[Path] = field(default_factory=list)

    def sort_documents(self) -> None:
        order = {path: index for index, path in enumerate(self.lead)}
        self.documents.sort(
            key=lambda p: (
                order.get(str(p.relative_to(REPO_ROOT)), len(order)),
                str(p.relative_to(REPO_ROOT)).lower(),
            )
        )

    @property
    def filename(self) -> str:
        slug = re.sub(r"[^A-Za-z0-9]+", "-", self.title).strip("-")
        return f"{self.key}_{slug}.pdf"


def under(*prefixes: str):
    """Match repository-relative paths below one of the given prefixes."""

    def matcher(rel: str) -> bool:
        return any(rel == p or rel.startswith(p.rstrip("/") + "/") for p in prefixes)

    return matcher


def exact(*paths: str):
    wanted = set(paths)

    def matcher(rel: str) -> bool:
        return rel in wanted

    return matcher


def any_of(*matchers):
    def matcher(rel: str) -> bool:
        return any(m(rel) for m in matchers)

    return matcher


def architecture_core(rel: str) -> bool:
    if not rel.startswith("docs/architecture/"):
        return False
    remainder = rel[len("docs/architecture/") :]
    return "/" not in remainder and remainder in ARCHITECTURE_ENTERPRISE_CORE


def architecture_rest(rel: str) -> bool:
    if not rel.startswith("docs/architecture/"):
        return False
    if rel in GOOGLE_MARKETING_FILES:
        return False
    return not architecture_core(rel)


def build_bundles() -> list[Bundle]:
    return [
        Bundle(
            key="01",
            title="Executive Overview und Repository Guide",
            subtitle="Einstieg, Leitplanken und Management-Zusammenfassungen",
            summary=(
                "Der Einstiegspunkt in die CAPITAL-AI Plattform: Produktüberblick, "
                "Agenten- und Claude-Leitplanken, Executive Summary sowie die "
                "übergreifenden Berichte und das Datenschutzprotokoll. Dieses "
                "Bündel beantwortet die Frage, was die Plattform ist, wer sie "
                "betreibt und nach welchen Regeln an ihr gearbeitet wird."
            ),
            matches=any_of(
                exact("README.md", "AGENTS.md", "CLAUDE.md"),
                exact("scripts/README.md", ".github/pull_request_template.md"),
                exact("docs/DATENSCHUTZ_PROTOKOLL.md"),
                under("docs/ceo", "docs/reports"),
                under("tests"),
            ),
            lead=(
                "README.md",
                "docs/ceo/EXECUTIVE_SUMMARY.md",
                "AGENTS.md",
                "CLAUDE.md",
            ),
        ),
        Bundle(
            key="02",
            title="Architektur Enterprise Kern",
            subtitle="Fintech-Kernarchitektur, Screening, Scoring und Reifegrad-Audits",
            summary=(
                "Die tragende Architektur der Plattform: Enterprise-Fintech-Audits, "
                "die Master-Architektur für Screening und Scoring, Datenqualität, "
                "Marktdaten-Provider sowie Reifegrad- und Lücken-Berichte. Hier "
                "steht, wie Finanzdaten bewertet werden und wie belastbar die "
                "Architektur dafür ist."
            ),
            matches=architecture_core,
        ),
        Bundle(
            key="03",
            title="Architektur Subsysteme und Plattformdesign",
            subtitle="Documentary Engine, Event Mesh, Vocabulary Governance, AI-Agent-Architektur",
            summary=(
                "Die Subsysteme hinter der Kernarchitektur: die Documentary Engine, "
                "das Enterprise Event Mesh, die Vocabulary Governance, das "
                "AI-Agent-Zielbild mit Bedrohungsmodell und IAM sowie die Render- "
                "und Server-Modularisierung. Dieses Bündel erklärt, wie die "
                "Plattform intern aufgebaut und entkoppelt ist."
            ),
            matches=architecture_rest,
        ),
        Bundle(
            key="04",
            title="Architecture Decision Records",
            subtitle="Vollständige ADR-Historie inklusive Revalidierungen",
            summary=(
                "Sämtliche Architekturentscheidungen der Plattform in "
                "chronologischer Form: aktive ADRs, aufgelöste ADRs und die "
                "zugehörigen Revalidierungs-Nachweise. Jede Entscheidung nennt "
                "Kontext, Alternativen und Konsequenzen und eignet sich als "
                "Erzählgrundlage für die Entwicklungsgeschichte des Systems."
            ),
            matches=under("docs/adr"),
        ),
        Bundle(
            key="05",
            title="ESS Skills und Contracts",
            subtitle="Enterprise Standard Skills als normative Systembeschreibung",
            summary=(
                "Die Enterprise Standard Skills (ESS-0001 bis ESS-0023) mit ihren "
                "Contracts. Sie definieren normativ, welche Rolle jede "
                "Plattformkomponente hat, welche Zusagen sie gibt und welche "
                "Governance für sie gilt. Das ist die verbindlichste Ebene der "
                "Systembeschreibung."
            ),
            matches=under(".ai"),
        ),
        Bundle(
            key="06",
            title="Governance Compliance und Security",
            subtitle="Richtlinien, ISO-27001-Anwendbarkeit, Sicherheitsausnahmen, Qualitätsstandards",
            summary=(
                "Der Regelrahmen der Plattform: Governance-Policies für "
                "Entwicklungskette, PR-Freigaben und Branch-Schutz, die ISO-27001 "
                "Statement of Applicability, akzeptierte Sicherheitsrisiken sowie "
                "Code-Quality- und QA-Standards. Hier steht, wer was freigeben darf "
                "und warum."
            ),
            matches=under(
                "docs/governance",
                "docs/compliance",
                "docs/security",
                "docs/qa",
                "docs/code-quality",
                "docs/contracts",
            ),
        ),
        Bundle(
            key="07",
            title="Roadmaps und Arbeitspakete",
            subtitle="Meilensteinplanung M0 bis M9, Arbeitspakete und Backlog",
            summary=(
                "Die Planungsebene: konsolidierte Roadmaps für AI-Agent, "
                "SystemAdmin, Marketing, Security-Hardening und Marktdaten, die "
                "geschnittenen Arbeitspakete sowie Backlog und Koordinations-Claims. "
                "Dieses Bündel erzählt, wohin sich die Plattform entwickelt und in "
                "welcher Reihenfolge."
            ),
            matches=under("docs/roadmaps", "docs/backlog", "docs/coordination"),
            lead=("docs/roadmaps/ROADMAP_CONSOLIDATION_MASTER_INDEX.md",),
        ),
        Bundle(
            key="08",
            title="Runbooks Betrieb und Release",
            subtitle="Betriebsanleitungen, Produktionskonfiguration, Release und Migration",
            summary=(
                "Die operative Ebene: Runbooks für Betrieb und Incident-Handling, "
                "Produktionsnachweise und Deployment-Verifikation, Release-Prozess "
                "und Migrationsleitfäden. Hier steht, wie das System tatsächlich "
                "betrieben, ausgerollt und im Fehlerfall stabilisiert wird."
            ),
            matches=under(
                "docs/runbooks", "docs/production", "docs/release", "docs/migration"
            ),
        ),
        Bundle(
            key="09",
            title="Traceability und Evidence",
            subtitle="Nachweisketten der Meilensteine M0 bis M9 und Audit-Belege",
            summary=(
                "Die Beweisebene: Traceability-Berichte und die vollständige "
                "Evidence-Sammlung zu Meilensteinen, CI-Härtung, Supabase- und "
                "Stripe-Sicherheit, Kill-Switch-Drills und Provider-Cutovers. Jeder "
                "Eintrag belegt, dass eine geplante Massnahme tatsächlich "
                "umgesetzt und geprüft wurde."
            ),
            matches=under("docs/traceability", "docs/evidence"),
        ),
        Bundle(
            key="10",
            title="Frontend Backend und Plattformmodule",
            subtitle="Komponenteninventar, Design Tokens, Accessibility und Modul-READMEs",
            summary=(
                "Die Implementierungsebene: Frontend-Architektur mit "
                "Komponenteninventar, Design Tokens, Performance-Baseline und "
                "Accessibility-Audit, dazu die READMEs und Changelogs aller "
                "Plattformmodule unter src/platform. Hier steht, woraus die "
                "Anwendung konkret gebaut ist."
            ),
            matches=under("docs/frontend", "docs/backend", "src"),
        ),
        Bundle(
            key="11",
            title="Marketing SEO und Google Consent",
            subtitle="SEO-Programm, Content-Pakete, Social Media und Google-Marketing-Integration",
            summary=(
                "Die Wachstumsebene: SEO-Maßnahmen und Soft-404-Analysen, die "
                "Content-Strategie mit fertigen Content-Paketen inklusive "
                "Voiceover- und Thread-Vorlagen, Social-Media-Publishing sowie die "
                "geschützte Google-Marketing-, Analytics- und Consent-Integration. "
                "Dieses Bündel eignet sich besonders als Vorlage für Podcast- und "
                "Video-Formate."
            ),
            matches=any_of(
                under("docs/seo", "docs/social-media", "docs/content-creator"),
                exact(*GOOGLE_MARKETING_FILES),
            ),
        ),
        Bundle(
            key="12",
            title="Archiv und Historie",
            subtitle="Abgelöste Dokumente, Rohmaterial und historische Audits",
            summary=(
                "Der historische Kontext: abgelöste Architektur-Reviews, alte "
                "Deployment-Guides, frühe Agenten- und Modellentwürfe sowie "
                "archivierte Compliance- und Security-Audits. Diese Dokumente sind "
                "nicht mehr normativ, erklären aber, wie die heutige Lösung "
                "entstanden ist."
            ),
            matches=under("docs/archive"),
        ),
    ]


def discover_markdown_files() -> list[Path]:
    found: set[Path] = set()

    for name in SCAN_ROOT_FILES:
        candidate = REPO_ROOT / name
        if candidate.is_file():
            found.add(candidate)

    for root_name in SCAN_ROOTS:
        root = REPO_ROOT / root_name
        if not root.is_dir():
            continue
        for path in root.rglob("*.md"):
            if any(part in EXCLUDED_DIR_NAMES for part in path.parts):
                continue
            rel = str(path.relative_to(REPO_ROOT))
            if rel.startswith(EXCLUDED_PREFIXES):
                continue
            if path.is_file():
                found.add(path)

    return sorted(found, key=lambda p: str(p.relative_to(REPO_ROOT)).lower())


def assign_documents(bundles: list[Bundle], files: list[Path]) -> None:
    unassigned: list[str] = []
    duplicates: list[str] = []

    for path in files:
        rel = str(path.relative_to(REPO_ROOT))
        owners = [b for b in bundles if b.matches(rel)]
        if not owners:
            unassigned.append(rel)
        elif len(owners) > 1:
            duplicates.append(f"{rel} -> {', '.join(b.key for b in owners)}")
        else:
            owners[0].documents.append(path)

    problems = []
    if unassigned:
        problems.append(
            "Not assigned to any bundle:\n  " + "\n  ".join(unassigned)
        )
    if duplicates:
        problems.append(
            "Claimed by more than one bundle:\n  " + "\n  ".join(duplicates)
        )
    if problems:
        sys.exit(
            "Bundle rules do not cover the repository cleanly.\n\n"
            + "\n\n".join(problems)
        )

    for bundle in bundles:
        bundle.sort_documents()


def document_title(path: Path, raw: str) -> str:
    for line in raw.splitlines():
        stripped = line.strip()
        if stripped.startswith("# "):
            title = stripped[2:].strip()
            if title:
                return title
        if stripped and not stripped.startswith(("---", "<!--")):
            break
    return path.stem.replace("_", " ").replace("-", " ")


FENCE_RE = re.compile(r"^(\s*)(`{3,}|~{3,})")
HEADING_RE = re.compile(r"^(#{1,5})(\s+)")


def demote_headings(raw: str) -> str:
    """Shift Markdown headings one level down, ignoring fenced code blocks.

    The bundle injects the document title as ``<h1>``, so the document's own
    headings must start at ``<h2>`` for a coherent outline.
    """

    out: list[str] = []
    fence: str | None = None

    for line in raw.splitlines():
        fence_match = FENCE_RE.match(line)
        if fence_match:
            marker = fence_match.group(2)[0]
            if fence is None:
                fence = marker
            elif fence == marker:
                fence = None
            out.append(line)
            continue

        if fence is None:
            heading = HEADING_RE.match(line)
            if heading:
                line = "#" + line
        out.append(line)

    return "\n".join(out)


def strip_front_matter(raw: str) -> tuple[str, str | None]:
    """Split off a leading YAML front-matter block, if present."""

    if not raw.startswith("---"):
        return raw, None
    lines = raw.splitlines()
    for index in range(1, min(len(lines), 60)):
        if lines[index].strip() == "---":
            return "\n".join(lines[index + 1 :]), "\n".join(lines[1:index])
    return raw, None


def render_markdown(raw: str) -> str:
    converter = markdown_lib.Markdown(
        extensions=[
            "extra",
            "sane_lists",
            "admonition",
            "codehilite",
        ],
        extension_configs={
            "codehilite": {"noclasses": True, "pygments_style": "friendly"}
        },
    )
    return converter.convert(raw)


def git_revision() -> str:
    try:
        sha = subprocess.run(
            ["git", "-C", str(REPO_ROOT), "rev-parse", "--short", "HEAD"],
            capture_output=True,
            text=True,
            check=True,
        ).stdout.strip()
        branch = subprocess.run(
            ["git", "-C", str(REPO_ROOT), "rev-parse", "--abbrev-ref", "HEAD"],
            capture_output=True,
            text=True,
            check=True,
        ).stdout.strip()
        return f"{branch} @ {sha}"
    except (subprocess.CalledProcessError, FileNotFoundError):
        return "unbekannt"


STYLESHEET = """
@page {
  size: A4;
  margin: 20mm 18mm 18mm 18mm;
  @top-left {
    content: string(bundle-title);
    font-family: "DejaVu Sans", sans-serif;
    font-size: 7.5pt;
    color: #7a8494;
  }
  @top-right {
    content: string(doc-title);
    font-family: "DejaVu Sans", sans-serif;
    font-size: 7.5pt;
    color: #7a8494;
  }
  @bottom-center {
    content: counter(page) " / " counter(pages);
    font-family: "DejaVu Sans", sans-serif;
    font-size: 7.5pt;
    color: #7a8494;
  }
}

@page cover { margin: 0; @top-left { content: none } @top-right { content: none }
  @bottom-center { content: none } }

html { font-size: 10.5pt; }

body {
  font-family: "DejaVu Sans", sans-serif;
  color: #1d2430;
  line-height: 1.55;
  hyphens: auto;
}

/* --- cover ------------------------------------------------------------- */
.cover {
  page: cover;
  page-break-after: always;
  height: 297mm;
  padding: 32mm 22mm 22mm 22mm;
  background: #10233d;
  color: #ffffff;
  box-sizing: border-box;
}
.cover .eyebrow {
  font-size: 9pt;
  letter-spacing: 2.4pt;
  text-transform: uppercase;
  color: #7fb2e5;
}
.cover h1 {
  font-size: 30pt;
  line-height: 1.15;
  margin: 10mm 0 4mm 0;
  color: #ffffff;
  border: none;
  padding: 0;
}
.cover .subtitle { font-size: 13pt; color: #c3d6ec; margin-bottom: 12mm; }
.cover .summary {
  font-size: 10.5pt;
  line-height: 1.65;
  color: #e4edf7;
  border-left: 2pt solid #4f86c6;
  padding-left: 6mm;
  margin-bottom: 14mm;
}
.cover .facts { font-size: 9.5pt; color: #b9cde4; }
.cover .facts div { margin-bottom: 2.2mm; }
.cover .facts b { color: #ffffff; font-weight: normal; }
.cover .usage {
  margin-top: 14mm;
  font-size: 9pt;
  color: #8fb4d9;
  border-top: 0.6pt solid #2f4c72;
  padding-top: 5mm;
}

/* --- table of contents ------------------------------------------------- */
.toc { page-break-after: always; }
.toc h2 {
  font-size: 17pt;
  margin: 0 0 7mm 0;
  padding-bottom: 2.5mm;
  border-bottom: 1.2pt solid #10233d;
  color: #10233d;
}
.toc ol { list-style: none; padding: 0; margin: 0; counter-reset: toc; }
.toc li {
  counter-increment: toc;
  margin-bottom: 2.6mm;
  font-size: 9.8pt;
  border-bottom: 0.4pt dotted #cfd7e2;
  padding-bottom: 1.4mm;
}
.toc a { text-decoration: none; color: #1d2430; }
.toc a::before { content: counter(toc) ". "; color: #7a8494; }
.toc a::after {
  content: target-counter(attr(href), page);
  float: right;
  color: #10233d;
}
.toc .path {
  display: block;
  font-family: "DejaVu Sans Mono", monospace;
  font-size: 7.2pt;
  color: #8a94a4;
  margin-top: 0.6mm;
}

/* --- documents --------------------------------------------------------- */
.doc { page-break-before: always; }
.doc h1 {
  string-set: doc-title content();
  font-size: 19pt;
  line-height: 1.25;
  color: #10233d;
  margin: 0 0 1.5mm 0;
  padding-bottom: 2.5mm;
  border-bottom: 1.2pt solid #10233d;
}
.doc .source {
  font-family: "DejaVu Sans Mono", monospace;
  font-size: 7.8pt;
  color: #6d7688;
  margin-bottom: 7mm;
  word-break: break-all;
}

h2 { font-size: 14pt; color: #16304f; margin: 8mm 0 2.5mm 0; page-break-after: avoid; }
h3 { font-size: 11.8pt; color: #16304f; margin: 6mm 0 2mm 0; page-break-after: avoid; }
h4, h5, h6 { font-size: 10.5pt; color: #35455e; margin: 5mm 0 1.5mm 0; page-break-after: avoid; }

p { margin: 0 0 3mm 0; orphans: 2; widows: 2; }
ul, ol { margin: 0 0 3mm 0; padding-left: 6mm; }
li { margin-bottom: 1.2mm; }

a { color: #1d4f8c; word-break: break-word; }

code {
  font-family: "DejaVu Sans Mono", monospace;
  font-size: 8.6pt;
  background: #eef1f6;
  padding: 0.3mm 1mm;
  border-radius: 1mm;
  word-break: break-word;
}
pre {
  font-family: "DejaVu Sans Mono", monospace;
  font-size: 7.8pt;
  line-height: 1.4;
  background: #f5f7fa;
  border: 0.4pt solid #d8dee8;
  border-left: 2pt solid #4f86c6;
  padding: 2.5mm 3mm;
  margin: 0 0 4mm 0;
  white-space: pre-wrap;
  word-break: break-word;
}
pre code { background: none; padding: 0; font-size: 7.8pt; }

blockquote {
  margin: 0 0 4mm 0;
  padding: 1mm 0 1mm 4mm;
  border-left: 2pt solid #c3ccd9;
  color: #46516a;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 8.2pt;
  margin: 0 0 4mm 0;
  table-layout: fixed;
}
th, td {
  border: 0.4pt solid #ccd4e0;
  padding: 1.4mm 2mm;
  text-align: left;
  vertical-align: top;
  word-break: break-word;
}
th { background: #eaeff6; color: #10233d; }

hr { border: none; border-top: 0.5pt solid #d3dae4; margin: 6mm 0; }

.front-matter {
  font-family: "DejaVu Sans Mono", monospace;
  font-size: 7.6pt;
  background: #f7f8fa;
  border: 0.4pt solid #dfe4ec;
  padding: 2mm 3mm;
  margin: 0 0 5mm 0;
  color: #56607a;
  white-space: pre-wrap;
}
"""


def de_number(value: int) -> str:
    """Format an integer with German thousand separators."""

    return f"{value:,}".replace(",", ".")


def build_html(bundle: Bundle, revision: str, generated_at: str) -> tuple[str, int]:
    entries: list[str] = []
    toc_items: list[str] = []
    total_words = 0

    for index, path in enumerate(bundle.documents, start=1):
        rel = str(path.relative_to(REPO_ROOT))
        raw = path.read_text(encoding="utf-8", errors="replace")
        total_words += len(raw.split())

        body, front_matter = strip_front_matter(raw)
        title = document_title(path, raw)
        anchor = f"doc-{index}"

        toc_items.append(
            f'<li><a href="#{anchor}">{html.escape(title)}</a>'
            f'<span class="path">{html.escape(rel)}</span></li>'
        )

        parts = [
            f'<section class="doc" id="{anchor}">',
            f"<h1>{html.escape(title)}</h1>",
            f'<div class="source">Quelle: {html.escape(rel)}</div>',
        ]
        if front_matter and front_matter.strip():
            parts.append(
                f'<div class="front-matter">{html.escape(front_matter.strip())}</div>'
            )
        parts.append(render_markdown(demote_headings(body)))
        parts.append("</section>")
        entries.append("\n".join(parts))

    cover = f"""
<section class="cover">
  <div class="eyebrow">CAPITAL-AI &middot; NotebookLM Quellpaket {bundle.key}</div>
  <h1>{html.escape(bundle.title)}</h1>
  <div class="subtitle">{html.escape(bundle.subtitle)}</div>
  <div class="summary">{html.escape(bundle.summary)}</div>
  <div class="facts">
    <div>Repository: <b>SvenKulessa/Finance</b></div>
    <div>Stand: <b>{html.escape(revision)}</b></div>
    <div>Erzeugt am: <b>{html.escape(generated_at)}</b></div>
    <div>Enthaltene Dokumente: <b>{len(bundle.documents)}</b></div>
    <div>Umfang: <b>ca. {de_number(total_words)} Wörter</b></div>
  </div>
  <div class="usage">
    Dieses PDF ist eine Quelle für NotebookLM. Jedes eingebettete Dokument
    beginnt auf einer neuen Seite und nennt seinen Repository-Pfad, damit
    erzeugte Podcasts, Video-Skripte und Zusammenfassungen ihre Aussagen exakt
    auf die Originaldatei zurückführen können.
  </div>
</section>
"""

    toc = (
        '<section class="toc"><h2>Inhalt dieses Quellpakets</h2><ol>'
        + "\n".join(toc_items)
        + "</ol></section>"
    )

    document = f"""<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>{html.escape(bundle.title)}</title>
<style>
{STYLESHEET}
body {{ string-set: bundle-title "{html.escape(bundle.title)}"; }}
</style>
</head>
<body>
{cover}
{toc}
{"".join(entries)}
</body>
</html>
"""
    return document, total_words


def write_manifest(
    out_dir: Path, bundles: list[Bundle], stats: dict[str, tuple[int, int]], revision: str, generated_at: str
) -> Path:
    total_docs = sum(len(b.documents) for b in bundles)
    total_words = sum(words for _, words in stats.values())

    lines = [
        "# NotebookLM Quellpakete",
        "",
        "Thematisch gebündelte PDF-Exporte sämtlicher Markdown-Dokumente dieses",
        "Repositories, aufbereitet zur Übergabe an NotebookLM (Google) für die",
        "Erstellung von Podcasts, Video-Skripten und Zusammenfassungen.",
        "",
        f"- Stand: `{revision}`",
        f"- Erzeugt am: {generated_at}",
        f"- Pakete: {len(bundles)}",
        f"- Enthaltene Dokumente: {total_docs}",
        f"- Gesamtumfang: ca. {de_number(total_words)} Wörter",
        "",
        "## Pakete",
        "",
        "| # | Paket | Dokumente | Wörter | Datei |",
        "| --- | --- | ---: | ---: | --- |",
    ]

    for bundle in bundles:
        docs, words = stats.get(bundle.key, (len(bundle.documents), 0))
        lines.append(
            f"| {bundle.key} | {bundle.title} | {docs} | "
            f"{de_number(words)} | `{bundle.filename}` |"
        )

    lines += ["", "## Inhalt der Pakete", ""]
    for bundle in bundles:
        lines += [
            f"### {bundle.key} — {bundle.title}",
            "",
            f"*{bundle.subtitle}*",
            "",
            bundle.summary,
            "",
        ]

    lines += [
        "## Nutzung in NotebookLM",
        "",
        "1. In NotebookLM ein Notebook anlegen (z. B. `CAPITAL-AI Plattform`).",
        "2. Die gewünschten PDFs unter *Quellen hinzufügen* hochladen. Für einen",
        "   Gesamtüberblick reichen die Pakete 01 bis 05; für tiefe Detailfragen",
        "   zusätzlich 06 bis 12.",
        "3. Für einen Podcast die *Audio-Zusammenfassung* starten und im",
        "   Anpassungsdialog die Zielgruppe vorgeben, etwa: *Erkläre die",
        "   Architektur und Governance der CAPITAL-AI Plattform für technische",
        "   Entscheider, mit Fokus auf Screening, Scoring und Compliance.*",
        "4. Für Videos die *Video Overview* nutzen und als Struktur die",
        "   Kapitelfolge des jeweiligen Inhaltsverzeichnisses vorgeben.",
        "",
        "Jedes eingebettete Dokument nennt seinen Repository-Pfad, sodass NotebookLM",
        "seine Aussagen exakt auf die Originaldatei zurückführen kann.",
        "",
        "## Neu erzeugen",
        "",
        "```bash",
        "pip install markdown weasyprint pygments",
        "python3 scripts/docs/export_notebooklm_pdfs.py",
        "```",
        "",
        "Der Generator prüft, dass jede Markdown-Datei des Repositories genau einem",
        "Paket zugeordnet ist, und bricht ab, sobald ein neues Dokument keiner Regel",
        "entspricht. Neue Dokumentation kann dadurch nicht unbemerkt aus dem Export",
        "herausfallen.",
        "",
    ]

    manifest = out_dir / "README.md"
    manifest.write_text("\n".join(lines), encoding="utf-8")
    return manifest


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--out-dir", default=str(DEFAULT_OUT_DIR), help="Zielverzeichnis der PDFs"
    )
    parser.add_argument(
        "--only",
        action="append",
        default=None,
        help="Nur diese Paket-Keys erzeugen (z. B. --only 04). Mehrfach nutzbar.",
    )
    args = parser.parse_args()

    out_dir = Path(args.out_dir).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    bundles = build_bundles()
    files = discover_markdown_files()
    assign_documents(bundles, files)

    revision = git_revision()
    generated_at = dt.datetime.now().strftime("%d.%m.%Y")

    selected = bundles
    if args.only:
        wanted = set(args.only)
        selected = [b for b in bundles if b.key in wanted]
        if not selected:
            sys.exit(f"Keine Pakete passen zu --only {sorted(wanted)}")

    print(f"{len(files)} Markdown-Dokumente in {len(bundles)} Paketen\n")

    stats: dict[str, tuple[int, int]] = {}
    for bundle in bundles:
        if bundle not in selected:
            continue
        if not bundle.documents:
            print(f"  {bundle.key}  übersprungen (keine Dokumente)")
            continue

        document, words = build_html(bundle, revision, generated_at)
        target = out_dir / bundle.filename
        HTML(string=document, base_url=str(REPO_ROOT)).write_pdf(target)
        stats[bundle.key] = (len(bundle.documents), words)

        size_mb = target.stat().st_size / 1_048_576
        print(
            f"  {bundle.key}  {target.name}\n"
            f"      {len(bundle.documents):>3} Dokumente, "
            f"{de_number(words):>9} Wörter, {size_mb:.1f} MB"
        )

    if not args.only:
        manifest = write_manifest(out_dir, bundles, stats, revision, generated_at)
        print(f"\nManifest: {manifest.relative_to(REPO_ROOT)}")

    print(f"\nFertig. Ausgabe: {out_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
