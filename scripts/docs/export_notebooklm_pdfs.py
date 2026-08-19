#!/usr/bin/env python3
"""Bundle repository Markdown into branded, tagged NotebookLM source PDFs.

The Documentation-as-Code export uses semantic HTML and WeasyPrint PDF/UA-1
output with tags. It intentionally remains separate from client-side jsPDF
reports, whose accessibility profile is metadata-only.

Install the pinned toolchain with:

    pip install -r scripts/docs/requirements-notebooklm-pdf.txt

Usage:

    python3 scripts/docs/export_notebooklm_pdfs.py
    python3 scripts/docs/export_notebooklm_pdfs.py --only 04
    python3 scripts/docs/export_notebooklm_pdfs.py --out-dir /tmp/pdf
    python3 scripts/docs/export_notebooklm_pdfs.py --smoke --out-dir /tmp/pdf

Every Markdown file below the scanned roots must be claimed by exactly one
bundle. The script fails loudly when a file is unassigned or claimed twice, so
new documentation cannot silently disappear from the export.
"""

from __future__ import annotations

import argparse
import datetime as dt
import html
import json
import re
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable

try:
    import markdown as markdown_lib
    import weasyprint
    from weasyprint import HTML
except ModuleNotFoundError as exc:  # pragma: no cover - environment guard
    sys.exit(
        f"Missing dependency: {exc.name}\n"
        "Install with: pip install -r scripts/docs/requirements-notebooklm-pdf.txt"
    )

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUT_DIR = REPO_ROOT / "docs" / "exports" / "notebooklm"
DESIGN_TOKENS_PATH = REPO_ROOT / "docs" / "frontend" / "design-tokens.json"
PDF_VARIANT = "pdf/ua-1"
PDF_TAGS = True

SCAN_ROOTS = ("docs", ".ai", "src", "scripts", "tests", ".github")
SCAN_ROOT_FILES = ("README.md", "AGENTS.md", "CLAUDE.md")
EXCLUDED_DIR_NAMES = {"node_modules", "dist", "build", "coverage", ".git"}
EXCLUDED_PREFIXES = ("docs/exports/",)

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

GOOGLE_MARKETING_FILES = {
    "docs/architecture/CAPITAL_AI_ENTERPRISE_GOOGLE_ANALYTICS_MCP_IMPLEMENTATION.md",
    "docs/architecture/CAPITAL_AI_GOOGLE_MARKETING_MCP_ARCHITECTURE.md",
    "docs/architecture/CAPITAL_AI_GOOGLE_MARKETING_MCP_TOPOLOGY.md",
}


@dataclass
class Bundle:
    key: str
    title: str
    subtitle: str
    summary: str
    matches: Callable[[str], bool]
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


def under(*prefixes: str) -> Callable[[str], bool]:
    def matcher(rel: str) -> bool:
        return any(rel == p or rel.startswith(p.rstrip("/") + "/") for p in prefixes)

    return matcher


def exact(*paths: str) -> Callable[[str], bool]:
    wanted = set(paths)
    return lambda rel: rel in wanted


def any_of(*matchers: Callable[[str], bool]) -> Callable[[str], bool]:
    return lambda rel: any(matcher(rel) for matcher in matchers)


def architecture_core(rel: str) -> bool:
    if not rel.startswith("docs/architecture/"):
        return False
    remainder = rel[len("docs/architecture/") :]
    return "/" not in remainder and remainder in ARCHITECTURE_ENTERPRISE_CORE


def architecture_rest(rel: str) -> bool:
    if not rel.startswith("docs/architecture/") or rel in GOOGLE_MARKETING_FILES:
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
                "übergreifenden Berichte und das Datenschutzprotokoll."
            ),
            matches=any_of(
                exact("README.md", "AGENTS.md", "CLAUDE.md"),
                exact("scripts/README.md", ".github/pull_request_template.md"),
                exact("docs/DATENSCHUTZ_PROTOKOLL.md"),
                under("docs/ceo", "docs/reports"),
                under("tests"),
            ),
            lead=("README.md", "docs/ceo/EXECUTIVE_SUMMARY.md", "AGENTS.md", "CLAUDE.md"),
        ),
        Bundle(
            key="02",
            title="Architektur Enterprise Kern",
            subtitle="Fintech-Kernarchitektur, Screening, Scoring und Reifegrad-Audits",
            summary=(
                "Die tragende Architektur der Plattform: Enterprise-Fintech-Audits, "
                "Screening und Scoring, Datenqualität, Marktdaten-Provider sowie "
                "Reifegrad- und Lücken-Berichte."
            ),
            matches=architecture_core,
        ),
        Bundle(
            key="03",
            title="Architektur Subsysteme und Plattformdesign",
            subtitle="Documentary Engine, Event Mesh, Vocabulary Governance, AI-Agent-Architektur",
            summary=(
                "Die Subsysteme hinter der Kernarchitektur: Documentary Engine, "
                "Enterprise Event Mesh, Vocabulary Governance, AI-Agent-Zielbild, "
                "IAM sowie Render- und Server-Modularisierung."
            ),
            matches=architecture_rest,
        ),
        Bundle(
            key="04",
            title="Architecture Decision Records",
            subtitle="Vollständige ADR-Historie inklusive Revalidierungen",
            summary=(
                "Sämtliche Architekturentscheidungen der Plattform: aktive ADRs, "
                "aufgelöste ADRs und zugehörige Revalidierungs-Nachweise."
            ),
            matches=under("docs/adr"),
        ),
        Bundle(
            key="05",
            title="ESS Skills und Contracts",
            subtitle="Enterprise Standard Skills als normative Systembeschreibung",
            summary=(
                "Die Enterprise Standard Skills und Contracts definieren normativ, "
                "welche Rolle jede Plattformkomponente hat und welche Governance gilt."
            ),
            matches=under(".ai"),
        ),
        Bundle(
            key="06",
            title="Governance Compliance und Security",
            subtitle="Richtlinien, ISO-27001-Anwendbarkeit, Sicherheitsausnahmen, Qualitätsstandards",
            summary=(
                "Der Regelrahmen der Plattform: Governance-Policies, Compliance, "
                "Security, QA, Code-Quality und technische Contracts."
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
            subtitle="Meilensteinplanung, Arbeitspakete und Backlog",
            summary=(
                "Die Planungsebene: konsolidierte Roadmaps, Arbeitspakete, Backlog "
                "und Koordinations-Claims."
            ),
            matches=under("docs/roadmaps", "docs/backlog", "docs/coordination"),
            lead=("docs/roadmaps/ROADMAP_CONSOLIDATION_MASTER_INDEX.md",),
        ),
        Bundle(
            key="08",
            title="Runbooks Betrieb und Release",
            subtitle="Betriebsanleitungen, Produktionskonfiguration, Release und Migration",
            summary=(
                "Die operative Ebene: Runbooks, Produktionsnachweise, Deployment- "
                "Verifikation, Release-Prozess und Migrationsleitfäden."
            ),
            matches=under("docs/runbooks", "docs/production", "docs/release", "docs/migration"),
        ),
        Bundle(
            key="09",
            title="Traceability und Evidence",
            subtitle="Nachweisketten der Meilensteine und Audit-Belege",
            summary=(
                "Die Beweisebene: Traceability-Berichte und Evidence zu CI, "
                "Sicherheit, Provider-Cutovers und umgesetzten Arbeitspaketen."
            ),
            matches=under("docs/traceability", "docs/evidence"),
        ),
        Bundle(
            key="10",
            title="Frontend Backend und Plattformmodule",
            subtitle="Komponenteninventar, Design Tokens, Accessibility und Modul-READMEs",
            summary=(
                "Die Implementierungsebene: Frontend- und Backend-Dokumentation, "
                "Design Tokens, Accessibility sowie Plattformmodule unter src."
            ),
            matches=under("docs/frontend", "docs/backend", "src"),
        ),
        Bundle(
            key="11",
            title="Marketing SEO und Google Consent",
            subtitle="SEO-Programm, Content-Pakete, Social Media und Google-Marketing-Integration",
            summary=(
                "Die Wachstumsebene: SEO, Content-Strategie, Social-Media-Publishing "
                "sowie Google-Marketing-, Analytics- und Consent-Integration."
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
                "Der historische Kontext: abgelöste Architektur-Reviews, Guides, "
                "Entwürfe und archivierte Compliance-/Security-Audits."
            ),
            matches=under("docs/archive"),
        ),
    ]


def load_design_tokens() -> dict[str, object]:
    return json.loads(DESIGN_TOKENS_PATH.read_text(encoding="utf-8"))


def token_value(tokens: dict[str, object], *path_segments: str) -> object:
    current: object = tokens
    for segment in path_segments:
        if not isinstance(current, dict) or segment not in current:
            raise KeyError(f"Missing design token: {'.'.join(path_segments)}")
        current = current[segment]
    if isinstance(current, dict):
        if "$value" in current:
            return current["$value"]
        if "value" in current:
            return current["value"]
    return current


def token_string(tokens: dict[str, object], *path_segments: str) -> str:
    value = token_value(tokens, *path_segments)
    if isinstance(value, str):
        return value
    if isinstance(value, dict) and isinstance(value.get("hex"), str):
        return str(value["hex"])
    raise TypeError(f"Design token must resolve to a string: {'.'.join(path_segments)}")


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
        owners = [bundle for bundle in bundles if bundle.matches(rel)]
        if not owners:
            unassigned.append(rel)
        elif len(owners) > 1:
            duplicates.append(f"{rel} -> {', '.join(bundle.key for bundle in owners)}")
        else:
            owners[0].documents.append(path)

    problems: list[str] = []
    if unassigned:
        problems.append("Not assigned to any bundle:\n  " + "\n  ".join(unassigned))
    if duplicates:
        problems.append("Claimed by more than one bundle:\n  " + "\n  ".join(duplicates))
    if problems:
        sys.exit("Bundle rules do not cover the repository cleanly.\n\n" + "\n\n".join(problems))

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
    """Shift Markdown headings one level down outside fenced code blocks."""

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
        if fence is None and HEADING_RE.match(line):
            line = "#" + line
        out.append(line)
    return "\n".join(out)


def strip_front_matter(raw: str) -> tuple[str, str | None]:
    if not raw.startswith("---"):
        return raw, None
    lines = raw.splitlines()
    for index in range(1, min(len(lines), 60)):
        if lines[index].strip() == "---":
            return "\n".join(lines[index + 1 :]), "\n".join(lines[1:index])
    return raw, None


def render_markdown(raw: str) -> str:
    converter = markdown_lib.Markdown(
        extensions=["extra", "sane_lists", "admonition", "codehilite"],
        extension_configs={"codehilite": {"noclasses": True, "pygments_style": "friendly"}},
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


def brand_svg() -> str:
    """Decorative print-safe network-node emblem aligned with the product logo."""

    return """
<svg class="brand-emblem" viewBox="0 0 100 90" aria-hidden="true">
  <g class="accent-lines">
    <line x1="16" y1="14" x2="84" y2="80" class="purple" />
    <line x1="84" y1="13" x2="16" y2="82" class="purple" />
    <line x1="16" y1="14" x2="84" y2="13" class="cyan" />
    <line x1="20" y1="42" x2="86" y2="46" class="cyan" />
  </g>
  <g class="gold-lines">
    <line x1="16" y1="14" x2="34" y2="48" />
    <line x1="34" y1="48" x2="16" y2="82" />
    <line x1="16" y1="82" x2="50" y2="90" />
    <line x1="50" y1="90" x2="84" y2="80" />
    <line x1="84" y1="80" x2="86" y2="46" />
    <line x1="86" y1="46" x2="84" y2="13" />
    <line x1="84" y1="13" x2="54" y2="18" />
    <line x1="54" y1="18" x2="50" y2="54" />
    <line x1="50" y1="54" x2="50" y2="90" />
    <line x1="50" y1="54" x2="34" y2="48" />
    <line x1="50" y1="54" x2="86" y2="46" />
  </g>
  <g class="nodes">
    <circle cx="50" cy="54" r="7" />
    <circle cx="16" cy="14" r="4" />
    <circle cx="54" cy="18" r="3" />
    <circle cx="84" cy="13" r="4.5" />
    <circle cx="20" cy="42" r="3" />
    <circle cx="34" cy="48" r="3.5" />
    <circle cx="86" cy="46" r="4" />
    <circle cx="16" cy="82" r="4.5" />
    <circle cx="50" cy="90" r="3.5" />
    <circle cx="84" cy="80" r="5" />
  </g>
</svg>
"""


def build_stylesheet(tokens: dict[str, object]) -> str:
    colors = {
        "__CANVAS__": token_string(tokens, "color", "background"),
        "__FOREGROUND__": token_string(tokens, "color", "foreground"),
        "__GOLD_LIGHT__": token_string(tokens, "color", "aif", "gold", "light"),
        "__GOLD__": token_string(tokens, "color", "aif", "gold", "DEFAULT"),
        "__GOLD_DARK__": token_string(tokens, "color", "aif", "gold", "dark"),
        "__CYAN__": token_string(tokens, "color", "aif", "neon", "cyan"),
        "__PURPLE__": token_string(tokens, "color", "aif", "neon", "purple"),
        "__TEXT__": token_string(tokens, "color", "print", "textPrimary"),
        "__MUTED__": token_string(tokens, "color", "print", "textSecondary"),
        "__SURFACE__": token_string(tokens, "color", "print", "surfaceLight"),
        "__BORDER__": token_string(tokens, "color", "print", "borderLight"),
        "__LINK__": token_string(tokens, "color", "print", "link"),
    }

    stylesheet = r"""
@page {
  size: A4;
  margin: 20mm 18mm 18mm 18mm;
  @top-left {
    content: "CAPITAL-AI  ·  " string(bundle-title);
    font-family: "DejaVu Sans", sans-serif;
    font-size: 7.5pt;
    font-weight: bold;
    color: __GOLD_DARK__;
  }
  @top-right {
    content: string(doc-title);
    font-family: "DejaVu Sans", sans-serif;
    font-size: 7.5pt;
    color: __MUTED__;
  }
  @bottom-left {
    content: "INTERNAL SOURCE PACKAGE";
    font-family: "DejaVu Sans", sans-serif;
    font-size: 7pt;
    color: __MUTED__;
  }
  @bottom-right {
    content: counter(page) " / " counter(pages);
    font-family: "DejaVu Sans Mono", monospace;
    font-size: 7pt;
    color: __MUTED__;
  }
}

@page cover {
  margin: 0;
  @top-left { content: none }
  @top-right { content: none }
  @bottom-left { content: none }
  @bottom-right { content: none }
}

html { font-size: 10.5pt; }
body {
  font-family: "DejaVu Sans", sans-serif;
  color: __TEXT__;
  line-height: 1.55;
  hyphens: auto;
}

.cover {
  page: cover;
  page-break-after: always;
  min-height: 297mm;
  padding: 28mm 22mm 22mm 22mm;
  background: __CANVAS__;
  color: __FOREGROUND__;
  box-sizing: border-box;
  position: relative;
}
.brand-lockup { display: flex; align-items: center; gap: 7mm; margin-bottom: 15mm; }
.brand-emblem { width: 31mm; height: 28mm; overflow: visible; }
.brand-emblem .gold-lines { stroke: __GOLD__; stroke-width: 1.7; fill: none; }
.brand-emblem .accent-lines { stroke-width: 0.8; fill: none; opacity: 0.72; }
.brand-emblem .cyan { stroke: __CYAN__; }
.brand-emblem .purple { stroke: __PURPLE__; }
.brand-emblem .nodes { fill: __GOLD__; stroke: __GOLD_DARK__; stroke-width: 0.7; }
.wordmark { color: __GOLD__; font-size: 22pt; font-weight: 800; letter-spacing: 1.8pt; }
.wordmark-sub { color: __FOREGROUND__; font-size: 8pt; letter-spacing: 2.1pt; margin-top: 1mm; }
.cover .eyebrow { font-size: 8.5pt; letter-spacing: 2.3pt; text-transform: uppercase; color: __CYAN__; }
.cover h1 { font-size: 28pt; line-height: 1.15; margin: 9mm 0 4mm 0; color: __FOREGROUND__; border: none; padding: 0; }
.cover .subtitle { font-size: 12.5pt; color: __GOLD_LIGHT__; margin-bottom: 11mm; }
.cover .summary { font-size: 10.5pt; line-height: 1.65; color: #E7E7EA; border-left: 2pt solid __GOLD__; padding-left: 6mm; margin-bottom: 13mm; }
.cover .facts { font-size: 9.3pt; color: #D4D4D8; }
.cover .facts div { margin-bottom: 2.2mm; }
.cover .facts b { color: __FOREGROUND__; font-weight: 600; }
.cover .usage { margin-top: 13mm; font-size: 8.8pt; color: #D4D4D8; border-top: 0.7pt solid __PURPLE__; padding-top: 5mm; }
.cover .profile { margin-top: 6mm; color: __CYAN__; font-size: 7.7pt; letter-spacing: 0.5pt; }

.toc { page-break-after: always; }
.toc h2 { font-size: 17pt; margin: 0 0 7mm 0; padding-bottom: 2.5mm; border-bottom: 1.2pt solid __GOLD__; color: __TEXT__; }
.toc ol { list-style: none; padding: 0; margin: 0; counter-reset: toc; }
.toc li { counter-increment: toc; margin-bottom: 2.6mm; font-size: 9.8pt; border-bottom: 0.4pt dotted __BORDER__; padding-bottom: 1.4mm; }
.toc a { text-decoration: none; color: __TEXT__; }
.toc a::before { content: counter(toc) ". "; color: __GOLD_DARK__; }
.toc a::after { content: target-counter(attr(href), page); float: right; color: __GOLD_DARK__; }
.toc .path { display: block; font-family: "DejaVu Sans Mono", monospace; font-size: 7.2pt; color: __MUTED__; margin-top: 0.6mm; }

.doc { page-break-before: always; }
.doc h1 { string-set: doc-title content(); font-size: 19pt; line-height: 1.25; color: __TEXT__; margin: 0 0 1.5mm 0; padding-bottom: 2.5mm; border-bottom: 1.2pt solid __GOLD__; }
.doc .source { font-family: "DejaVu Sans Mono", monospace; font-size: 7.8pt; color: __MUTED__; margin-bottom: 7mm; word-break: break-all; }
h2 { font-size: 14pt; color: __TEXT__; margin: 8mm 0 2.5mm 0; page-break-after: avoid; border-left: 2pt solid __CYAN__; padding-left: 3mm; }
h3 { font-size: 11.8pt; color: __TEXT__; margin: 6mm 0 2mm 0; page-break-after: avoid; }
h4, h5, h6 { font-size: 10.5pt; color: #3F3F46; margin: 5mm 0 1.5mm 0; page-break-after: avoid; }
p { margin: 0 0 3mm 0; orphans: 2; widows: 2; }
ul, ol { margin: 0 0 3mm 0; padding-left: 6mm; }
li { margin-bottom: 1.2mm; }
a { color: __LINK__; word-break: break-word; text-decoration-thickness: 0.6pt; }
code { font-family: "DejaVu Sans Mono", monospace; font-size: 8.6pt; background: __SURFACE__; padding: 0.3mm 1mm; border-radius: 1mm; word-break: break-word; }
pre { font-family: "DejaVu Sans Mono", monospace; font-size: 7.8pt; line-height: 1.4; background: __SURFACE__; border: 0.4pt solid __BORDER__; border-left: 2pt solid __PURPLE__; padding: 2.5mm 3mm; margin: 0 0 4mm 0; white-space: pre-wrap; word-break: break-word; }
pre code { background: none; padding: 0; font-size: 7.8pt; }
blockquote { margin: 0 0 4mm 0; padding: 1mm 0 1mm 4mm; border-left: 2pt solid __CYAN__; color: #3F3F46; }
table { width: 100%; border-collapse: collapse; font-size: 8.2pt; margin: 0 0 4mm 0; table-layout: fixed; }
th, td { border: 0.4pt solid __BORDER__; padding: 1.4mm 2mm; text-align: left; vertical-align: top; word-break: break-word; }
th { background: __CANVAS__; color: __GOLD_LIGHT__; }
hr { border: none; border-top: 0.5pt solid __BORDER__; margin: 6mm 0; }
.front-matter { font-family: "DejaVu Sans Mono", monospace; font-size: 7.6pt; background: __SURFACE__; border: 0.4pt solid __BORDER__; padding: 2mm 3mm; margin: 0 0 5mm 0; color: #3F3F46; white-space: pre-wrap; }
"""

    for placeholder, value in colors.items():
        stylesheet = stylesheet.replace(placeholder, value)
    return stylesheet


def de_number(value: int) -> str:
    return f"{value:,}".replace(",", ".")


def build_html(bundle: Bundle, revision: str, generated_at: str, tokens: dict[str, object]) -> tuple[str, int]:
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
            f'<article class="doc" id="{anchor}">',
            f"<h1>{html.escape(title)}</h1>",
            f'<p class="source">Quelle: {html.escape(rel)}</p>',
        ]
        if front_matter and front_matter.strip():
            parts.append(f'<div class="front-matter">{html.escape(front_matter.strip())}</div>')
        parts.append(render_markdown(demote_headings(body)))
        parts.append("</article>")
        entries.append("\n".join(parts))

    cover = f"""
<header class="cover">
  <div class="brand-lockup">
    {brand_svg()}
    <div>
      <div class="wordmark">CAPITAL-AI</div>
      <div class="wordmark-sub">QUANTITATIVE FINANCE INTELLIGENCE</div>
    </div>
  </div>
  <div class="eyebrow">NotebookLM Quellpaket {bundle.key}</div>
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
    Dieses PDF ist eine interne CAPITAL-AI Quelle für NotebookLM. Jedes eingebettete
    Dokument beginnt auf einer neuen Seite und nennt seinen Repository-Pfad.
  </div>
  <div class="profile">Accessibility-Profil: documentation-weasyprint · PDF/UA-1 · tagged</div>
</header>
"""

    toc = (
        '<nav class="toc" aria-label="Inhaltsverzeichnis"><h2>Inhalt dieses Quellpakets</h2><ol>'
        + "\n".join(toc_items)
        + "</ol></nav>"
    )

    document = f"""<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="author" content="CAPITAL-AI">
<meta name="description" content="CAPITAL-AI NotebookLM Quellpaket {bundle.key}">
<title>{html.escape(bundle.title)}</title>
<style>
{build_stylesheet(tokens)}
body {{ string-set: bundle-title "{html.escape(bundle.title)}"; }}
</style>
</head>
<body>
{cover}
{toc}
<main>
{"".join(entries)}
</main>
</body>
</html>
"""
    return document, total_words


def build_smoke_html(tokens: dict[str, object]) -> str:
    return f"""<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="author" content="CAPITAL-AI">
<meta name="description" content="CAPITAL-AI PDF/UA renderer smoke">
<title>CAPITAL-AI PDF/UA Smoke</title>
<style>{build_stylesheet(tokens)} body {{ string-set: bundle-title "PDF/UA Smoke"; }}</style>
</head>
<body>
<header class="cover">
  <div class="brand-lockup">{brand_svg()}<div><div class="wordmark">CAPITAL-AI</div><div class="wordmark-sub">PDF RENDERER SMOKE</div></div></div>
  <div class="eyebrow">Accessibility Verification Fixture</div>
  <h1>CAPITAL-AI PDF/UA Smoke</h1>
  <div class="subtitle">Branded semantic Documentation-as-Code output</div>
  <div class="summary">Deterministisches Testartefakt für A4, Text-Extraktion, Branding und Tagged-PDF-Erkennung.</div>
  <div class="profile">Accessibility-Profil: documentation-weasyprint · PDF/UA-1 · tagged</div>
</header>
<main>
  <article class="doc" id="fixture">
    <h1>Semantische Teststruktur</h1>
    <p class="source">Quelle: scripts/docs/export_notebooklm_pdfs.py --smoke</p>
    <h2>Heading-Hierarchie</h2>
    <p>Dieser Text muss durch pdftotext extrahierbar sein.</p>
    <h2>Tabellenstruktur</h2>
    <table><thead><tr><th>Prüfung</th><th>Erwartung</th></tr></thead><tbody><tr><td>Tagged</td><td>yes</td></tr><tr><td>Page size</td><td>A4</td></tr></tbody></table>
  </article>
</main>
</body>
</html>"""


def write_pdf(document: str, target: Path) -> None:
    HTML(string=document, base_url=str(REPO_ROOT)).write_pdf(
        target,
        pdf_variant=PDF_VARIANT,
        pdf_tags=PDF_TAGS,
        custom_metadata=True,
    )


def write_manifest(
    out_dir: Path,
    bundles: list[Bundle],
    stats: dict[str, tuple[int, int]],
    revision: str,
    generated_at: str,
) -> Path:
    total_docs = sum(len(bundle.documents) for bundle in bundles)
    total_words = sum(words for _, words in stats.values())
    lines = [
        "# NotebookLM Quellpakete",
        "",
        "Thematisch gebündelte, CAPITAL-AI gebrandete PDF/UA-1-Exporte sämtlicher Markdown-Dokumente.",
        "",
        f"- Stand: `{revision}`",
        f"- Erzeugt am: {generated_at}",
        f"- Renderer: WeasyPrint {weasyprint.__version__}",
        f"- Accessibility-Profil: `documentation-weasyprint` / `{PDF_VARIANT}` / tagged",
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
        lines.append(f"| {bundle.key} | {bundle.title} | {docs} | {de_number(words)} | `{bundle.filename}` |")

    lines += ["", "## Inhalt der Pakete", ""]
    for bundle in bundles:
        lines += [f"### {bundle.key} — {bundle.title}", "", f"*{bundle.subtitle}*", "", bundle.summary, ""]

    lines += [
        "## Neu erzeugen",
        "",
        "```bash",
        "pip install -r scripts/docs/requirements-notebooklm-pdf.txt",
        "python3 scripts/docs/export_notebooklm_pdfs.py",
        "```",
        "",
        "Kleiner Renderer-Smoke:",
        "",
        "```bash",
        "python3 scripts/docs/export_notebooklm_pdfs.py --smoke --out-dir /tmp/capital-ai-pdf-smoke",
        "python3 scripts/docs/verify_pdf_render.py /tmp/capital-ai-pdf-smoke/CAPITAL_AI_NotebookLM_PDF_UA_Smoke.pdf --expect-tagged yes",
        "```",
        "",
        "Der Generator prüft die vollständige Zuordnung der Markdown-Dateien. PDF/UA-Tagging ersetzt keine externe formale Konformitätszertifizierung; die Artefakt-Verifikation bleibt ein separates Gate.",
        "",
    ]
    manifest = out_dir / "README.md"
    manifest.write_text("\n".join(lines), encoding="utf-8")
    return manifest


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out-dir", default=str(DEFAULT_OUT_DIR), help="Zielverzeichnis der PDFs")
    parser.add_argument("--only", action="append", default=None, help="Nur diese Paket-Keys erzeugen, z. B. --only 04")
    parser.add_argument("--smoke", action="store_true", help="Nur ein kleines deterministisches PDF/UA-Testartefakt erzeugen")
    args = parser.parse_args()

    out_dir = Path(args.out_dir).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    tokens = load_design_tokens()

    if args.smoke:
        target = out_dir / "CAPITAL_AI_NotebookLM_PDF_UA_Smoke.pdf"
        write_pdf(build_smoke_html(tokens), target)
        print(f"Smoke PDF: {target}")
        return 0

    bundles = build_bundles()
    files = discover_markdown_files()
    assign_documents(bundles, files)

    revision = git_revision()
    generated_at = dt.datetime.now().astimezone().strftime("%d.%m.%Y")
    selected = bundles
    if args.only:
        wanted = set(args.only)
        selected = [bundle for bundle in bundles if bundle.key in wanted]
        if not selected:
            sys.exit(f"Keine Pakete passen zu --only {sorted(wanted)}")

    print(f"{len(files)} Markdown-Dokumente in {len(bundles)} Paketen\n")
    stats: dict[str, tuple[int, int]] = {}
    for bundle in selected:
        if not bundle.documents:
            print(f"  {bundle.key}  übersprungen (keine Dokumente)")
            continue
        document, words = build_html(bundle, revision, generated_at, tokens)
        target = out_dir / bundle.filename
        write_pdf(document, target)
        stats[bundle.key] = (len(bundle.documents), words)
        size_mb = target.stat().st_size / 1_048_576
        print(
            f"  {bundle.key}  {target.name}\n"
            f"      {len(bundle.documents):>3} Dokumente, {de_number(words):>9} Wörter, {size_mb:.1f} MB"
        )

    if not args.only:
        manifest = write_manifest(out_dir, bundles, stats, revision, generated_at)
        print(f"\nManifest: {manifest.relative_to(REPO_ROOT)}")

    print(f"\nFertig. Ausgabe: {out_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
