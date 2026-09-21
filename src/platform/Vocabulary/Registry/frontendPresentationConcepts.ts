import type { VocabularyCategory, VocabularyConcept } from '../Domain/VocabularyConcept';

const authorityRefs = ['ESS-0017', 'ESS-0017-CONTRACTS'];
const vocabularyAuthority = ['ADR-0078'];
const frontendTraceability = [
  'docs/frontend/FRONTEND_ARCH.md',
  'docs/frontend/COMPONENT_INVENTORY.md',
];

function frontendConcept(
  id: string,
  canonicalCodeTerm: string,
  displayNameDE: string,
  displayNameEN: string,
  definitionDE: string,
  definitionEN: string,
  category: VocabularyCategory = 'product',
): VocabularyConcept {
  return {
    id,
    canonicalCodeTerm,
    displayNameDE,
    displayNameEN,
    definitionDE,
    definitionEN,
    aliases: [],
    forbiddenTerms: [],
    category,
    status: 'approved',
    version: '1.0.0',
    essReferences: authorityRefs,
    adrReferences: vocabularyAuthority,
    traceabilityReferences: frontendTraceability,
  };
}

/**
 * Canonical terminology for graphical Frontend elements and presentation patterns.
 *
 * This vocabulary names UI concepts only. It does not rename source files by itself,
 * create a second design system, or acquire domain/runtime authority. Physical code
 * renames remain subject to the ESS-0017 Safe Rename Gate and FRONTEND_ARCH.
 */
export const frontendPresentationConcepts: VocabularyConcept[] = [
  frontendConcept('VOC-FRONTEND-0001', 'ApplicationShell', 'Anwendungsshell', 'Application shell', 'Oberste fachneutrale Präsentationshülle, die globale Layout-, Navigations- und Inhaltsbereiche zusammensetzt.', 'Top-level domain-neutral presentation shell composing global layout, navigation and content regions.', 'architecture'),
  frontendConcept('VOC-FRONTEND-0002', 'PageContainer', 'Seitencontainer', 'Page container', 'Layout-Container, der Breite, Außenabstände und responsiven Inhaltsfluss einer Seite begrenzt.', 'Layout container constraining page width, outer spacing and responsive content flow.', 'architecture'),
  frontendConcept('VOC-FRONTEND-0003', 'DevicePreviewFrame', 'Geräte-Vorschaurahmen', 'Device preview frame', 'Rein präsentative Rahmung zur Vorschau einer Oberfläche in einer definierten Gerätegeometrie; kein Bestandteil der produktiven Geräteerkennung.', 'Presentation-only frame previewing an interface in a defined device geometry; it is not productive device detection.', 'architecture'),
  frontendConcept('VOC-FRONTEND-0004', 'SiteHeader', 'Webseitenkopf', 'Site header', 'Oberer Bereich einer öffentlichen Seite für Marke, primäre Navigation, Status und zentrale Aktionen.', 'Top region of a public page containing brand, primary navigation, status and key actions.', 'architecture'),
  frontendConcept('VOC-FRONTEND-0005', 'ApplicationHeader', 'Anwendungskopf', 'Application header', 'Oberer Bereich einer Anwendungsansicht für Kontext, Navigation, Status und anwendungsbezogene Aktionen.', 'Top region of an application view containing context, navigation, status and application actions.', 'architecture'),
  frontendConcept('VOC-FRONTEND-0006', 'BrandLogo', 'Markenlogo', 'Brand logo', 'Kanonische visuelle Markenkennung aus Wort-/Bildmarke oder definierter Logo-Geometrie.', 'Canonical visual brand identifier using a wordmark, symbol or defined logo geometry.'),
  frontendConcept('VOC-FRONTEND-0007', 'PrimaryNavigation', 'Primärnavigation', 'Primary navigation', 'Hauptnavigation zur Orientierung zwischen den wichtigsten Bereichen einer Oberfläche.', 'Main navigation used to move among the primary areas of an interface.', 'architecture'),
  frontendConcept('VOC-FRONTEND-0008', 'NavigationDrawer', 'Navigations-Drawer', 'Navigation drawer', 'Seitlich ein- und ausblendbares Navigationspanel, das primäre oder ergänzende Navigationsziele enthält.', 'Side panel that slides in and out and contains primary or supplementary navigation destinations.', 'architecture'),
  frontendConcept('VOC-FRONTEND-0009', 'NavigationItem', 'Navigationseintrag', 'Navigation item', 'Ein einzelnes auswählbares Ziel innerhalb einer Navigation.', 'Single selectable destination within navigation.'),
  frontendConcept('VOC-FRONTEND-0010', 'BackdropScrim', 'Hintergrund-Scrim', 'Backdrop scrim', 'Flächige, meist halbtransparente Abdunklung hinter einem überlagernden Element zur visuellen Fokusführung.', 'Usually translucent overlay behind an elevated surface used to focus attention.', 'architecture'),
  frontendConcept('VOC-FRONTEND-0011', 'StatusBar', 'Statusleiste', 'Status bar', 'Kompakte horizontale Anzeige für System-, Geräte- oder Laufzeitstatus ohne eigene Domain-Entscheidungslogik.', 'Compact horizontal display for system, device or runtime status without domain decision logic.'),
  frontendConcept('VOC-FRONTEND-0012', 'ActionButton', 'Aktionsschaltfläche', 'Action button', 'Interaktives Steuerelement zum Auslösen genau einer klar benannten Benutzeraktion.', 'Interactive control that triggers one clearly named user action.'),
  frontendConcept('VOC-FRONTEND-0013', 'IconButton', 'Icon-Schaltfläche', 'Icon button', 'Aktionsschaltfläche, deren sichtbarer Inhalt primär aus einem Icon besteht und die eine zugängliche Bezeichnung benötigt.', 'Action button whose visible content is primarily an icon and therefore requires an accessible name.'),
  frontendConcept('VOC-FRONTEND-0014', 'PrimaryCallToAction', 'Primäre Handlungsaufforderung', 'Primary call to action', 'Visuell hervorgehobene Hauptaktion eines Inhaltsbereichs oder einer Nutzeraufgabe.', 'Visually emphasized primary action of a content region or user task.'),
  frontendConcept('VOC-FRONTEND-0015', 'SecondaryCallToAction', 'Sekundäre Handlungsaufforderung', 'Secondary call to action', 'Nachgeordnete, visuell weniger dominante Alternative zur primären Handlungsaufforderung.', 'Secondary action with less visual emphasis than the primary call to action.'),
  frontendConcept('VOC-FRONTEND-0016', 'ContentCard', 'Inhaltskarte', 'Content card', 'Abgegrenzter Container, der zusammengehörige Informationen und optionale Aktionen als eine visuelle Einheit gruppiert.', 'Bounded container grouping related information and optional actions as one visual unit.'),
  frontendConcept('VOC-FRONTEND-0017', 'TextInput', 'Texteingabefeld', 'Text input', 'Formularsteuerelement zur Eingabe oder Bearbeitung textueller Werte.', 'Form control for entering or editing textual values.'),
  frontendConcept('VOC-FRONTEND-0018', 'Tooltip', 'Tooltip', 'Tooltip', 'Kurzzeitige kontextuelle Zusatzinformation, die einem fokussierten oder gezeigten Element zugeordnet ist.', 'Transient contextual information associated with a focused or pointed-at element.'),
  frontendConcept('VOC-FRONTEND-0019', 'ModalDialog', 'Modaler Dialog', 'Modal dialog', 'Dialog, der den Interaktionsfokus vorübergehend bindet und vor Rückkehr zum Hintergrund geschlossen oder abgeschlossen werden muss.', 'Dialog that temporarily captures interaction focus and must be closed or completed before returning to the background.'),
  frontendConcept('VOC-FRONTEND-0020', 'HeroSection', 'Hero-Bereich', 'Hero section', 'Prominenter Einstiegsbereich einer Seite mit zentraler Botschaft, visueller Leitkomponente und primären Aktionen.', 'Prominent introductory page region containing the core message, lead visual and primary actions.', 'architecture'),
  frontendConcept('VOC-FRONTEND-0021', 'EyebrowText', 'Einordnungszeile', 'Eyebrow text', 'Kurze typografische Zeile oberhalb einer Überschrift zur Kategorie-, Status- oder Kontextkennzeichnung.', 'Short typographic line above a heading used for category, status or contextual framing.'),
  frontendConcept('VOC-FRONTEND-0022', 'HeroVisual', 'Hero-Visual', 'Hero visual', 'Dominante Illustration, Grafik oder Medienkomponente innerhalb des Hero-Bereichs.', 'Dominant illustration, graphic or media element within a hero section.'),
  frontendConcept('VOC-FRONTEND-0023', 'SectionHeader', 'Abschnittskopf', 'Section header', 'Überschriftsbereich, der einen Inhaltsabschnitt benennt und optional Kontext oder Aktionen ergänzt.', 'Heading region naming a content section and optionally adding context or actions.', 'architecture'),
  frontendConcept('VOC-FRONTEND-0024', 'FeatureGrid', 'Funktionsraster', 'Feature grid', 'Responsives Raster zur gleichrangigen Anordnung mehrerer Funktions- oder Nutzenkarten.', 'Responsive grid arranging multiple feature or benefit cards at the same hierarchy level.', 'architecture'),
  frontendConcept('VOC-FRONTEND-0025', 'FeatureCard', 'Funktionskarte', 'Feature card', 'Inhaltskarte zur kompakten Darstellung einer Produktfunktion, eines Nutzens oder einer Fähigkeit.', 'Content card compactly presenting a product feature, benefit or capability.'),
  frontendConcept('VOC-FRONTEND-0026', 'MarketOverview', 'Marktübersicht', 'Market overview', 'Präsentationsbereich zur zusammengefassten Anzeige bereits autorisierter Markt- und Asset-Zustände.', 'Presentation region summarizing already-authorized market and asset states.'),
  frontendConcept('VOC-FRONTEND-0027', 'MarketDataCard', 'Marktdatenkarte', 'Market data card', 'Inhaltskarte zur Anzeige gelieferter Markt- oder Asset-Daten einschließlich ihrer vorhandenen Status- und Evidence-Metadaten.', 'Content card displaying supplied market or asset data together with available status and evidence metadata.'),
  frontendConcept('VOC-FRONTEND-0028', 'ModuleGrid', 'Modulraster', 'Module grid', 'Responsives Raster zur Anordnung mehrerer Produkt- oder Funktionsmodule.', 'Responsive grid arranging multiple product or functional modules.', 'architecture'),
  frontendConcept('VOC-FRONTEND-0029', 'ModuleCard', 'Modulkarte', 'Module card', 'Inhaltskarte als Einstieg oder Zusammenfassung für ein klar abgegrenztes Produktmodul.', 'Content card serving as entry point or summary for a bounded product module.'),
  frontendConcept('VOC-FRONTEND-0030', 'PageFooter', 'Seitenfuß', 'Page footer', 'Unterer Seitenbereich für ergänzende Navigation, rechtliche Hinweise, Metadaten oder Markenabschluss.', 'Bottom page region containing secondary navigation, legal information, metadata or brand closure.', 'architecture'),
  frontendConcept('VOC-FRONTEND-0031', 'StatusChip', 'Status-Chip', 'Status chip', 'Kompakte pillenförmige Status- oder Kontextanzeige; Interaktivität muss explizit erkennbar sein.', 'Compact pill-shaped status or context indicator; interactivity must be explicitly perceivable.'),
  frontendConcept('VOC-FRONTEND-0032', 'StatusBadge', 'Status-Badge', 'Status badge', 'Kompakte, grundsätzlich nicht-interaktive Kennzeichnung eines gelieferten Zustands mit Text oder Icon zusätzlich zu Farbe.', 'Compact, normally non-interactive label for a supplied state using text or icon in addition to color.'),
  frontendConcept('VOC-FRONTEND-0033', 'AuthorityBadge', 'Authority-Badge', 'Authority badge', 'Präsentationskennzeichnung der gelieferten Herkunfts- oder Authority-Rolle ohne diese Authority selbst zu erzeugen.', 'Presentation label for a supplied provenance or authority role without creating that authority.'),
  frontendConcept('VOC-FRONTEND-0034', 'FreshnessBadge', 'Aktualitäts-Badge', 'Freshness badge', 'Präsentationskennzeichnung eines gelieferten Freshness- oder Zeitbezugs ohne clientseitig erfundene Aktualitätslogik.', 'Presentation label for supplied freshness or timing information without client-invented freshness logic.'),
  frontendConcept('VOC-FRONTEND-0035', 'EvidenceStateIndicator', 'Evidence-Statusanzeige', 'Evidence state indicator', 'Visuelle und textuelle Anzeige eines gelieferten Evidence-Zustands ohne Evidence zu synthetisieren oder aufzuwerten.', 'Visual and textual indicator of a supplied evidence state without synthesizing or upgrading evidence.'),
  frontendConcept('VOC-FRONTEND-0036', 'ResearchOnlyBanner', 'Research-only-Hinweisbanner', 'Research-only banner', 'Prominenter Hinweis, dass Inhalte ausschließlich Research-/Analysecharakter besitzen und keine kanonische Score- oder Execution-Authority darstellen.', 'Prominent notice that content is research or analysis only and carries no canonical score or execution authority.'),
  frontendConcept('VOC-FRONTEND-0037', 'EmptyState', 'Leerzustand', 'Empty state', 'Definierter UI-Zustand für eine gültige Ansicht ohne darstellbare Inhalte, typischerweise mit Erklärung und möglicher nächster Aktion.', 'Defined UI state for a valid view with no displayable content, typically including explanation and an optional next action.'),
  frontendConcept('VOC-FRONTEND-0038', 'LoadingSkeleton', 'Lade-Skelett', 'Loading skeleton', 'Temporärer Platzhalter, der die erwartete Inhaltsstruktur während eines Ladevorgangs andeutet.', 'Temporary placeholder suggesting expected content structure while data is loading.'),
  frontendConcept('VOC-FRONTEND-0039', 'DataVisualization', 'Datenvisualisierung', 'Data visualization', 'Grafische Darstellung bereits gelieferter Daten oder Ergebnisse ohne eigene fachliche Neuberechnung.', 'Graphical representation of supplied data or results without independent domain recomputation.', 'architecture'),
  frontendConcept('VOC-FRONTEND-0040', 'ChartFrame', 'Diagrammrahmen', 'Chart frame', 'Wiederverwendbare Präsentationshülle um ein Diagramm mit Titel, Status, Metadaten, Zustands- und Accessibility-Flächen.', 'Reusable presentation wrapper around a chart providing title, status, metadata, state and accessibility regions.', 'architecture'),
  frontendConcept('VOC-FRONTEND-0041', 'VisualizationLegend', 'Visualisierungslegende', 'Visualization legend', 'Zuordnung visueller Kodierungen wie Serien, Symbole oder Muster zu ihrer textlichen Bedeutung.', 'Mapping of visual encodings such as series, symbols or patterns to their textual meaning.', 'architecture'),
  frontendConcept('VOC-FRONTEND-0042', 'DecorativeBackground', 'Dekorativer Hintergrund', 'Decorative background', 'Nicht-inhaltliche visuelle Ebene zur Atmosphäre und Markenwirkung, die keine Information allein tragen darf.', 'Non-content visual layer for atmosphere and brand expression that must not carry information by itself.', 'architecture'),
  frontendConcept('VOC-FRONTEND-0043', 'NeuralBackground', 'Neuronaler Hintergrund', 'Neural background', 'Kanonisches dekoratives Neural-/Netzwerk-Hintergrundmuster als wiederverwendbare Visual-Identity-Komponente.', 'Canonical decorative neural or network background pattern used as a reusable visual-identity component.', 'architecture'),
];
