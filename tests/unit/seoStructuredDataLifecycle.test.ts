import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ORIGIN = 'https://capital-ai.online';
const ROOT_URL = `${ORIGIN}/`;
const indexPath = path.join(process.cwd(), 'index.html');
const packagePath = path.join(process.cwd(), 'package.json');

const EXPECTED_ENTITY_IDS = {
  organization: `${ORIGIN}/#organization`,
  website: `${ORIGIN}/#website`,
  application: `${ORIGIN}/#app`,
} as const;

const EXPECTED_GRAPH_TYPES = ['Organization', 'SoftwareApplication', 'WebSite'];

interface JsonLdRef {
  '@id'?: string;
}

interface OfferNode {
  '@type'?: string;
  price?: unknown;
  priceCurrency?: unknown;
}

interface GraphEntity {
  '@type'?: string;
  '@id'?: string;
  url?: unknown;
  publisher?: JsonLdRef;
  softwareVersion?: unknown;
  offers?: OfferNode;
}

interface StructuredDataGraph {
  '@context'?: unknown;
  '@graph'?: GraphEntity[];
}

function readStructuredData(): StructuredDataGraph {
  const html = fs.readFileSync(indexPath, 'utf8');
  const scripts = [
    ...html.matchAll(
      /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ];

  expect(scripts).toHaveLength(1);
  const raw = scripts[0]?.[1]?.trim();
  expect(raw).toBeTruthy();

  return JSON.parse(raw ?? '') as StructuredDataGraph;
}

function graphEntities(): GraphEntity[] {
  const data = readStructuredData();
  expect(data['@context']).toBe('https://schema.org');
  expect(Array.isArray(data['@graph'])).toBe(true);
  return data['@graph'] ?? [];
}

function entityById(entities: GraphEntity[], id: string): GraphEntity {
  const entity = entities.find((candidate) => candidate['@id'] === id);
  expect(entity, `Missing JSON-LD entity ${id}`).toBeDefined();
  return entity as GraphEntity;
}

describe('SEO structured-data lifecycle (WP-SEO-SCHEMA)', () => {
  it('contains exactly one valid JSON-LD graph with the intended stable entity inventory', () => {
    const entities = graphEntities();
    const ids = entities.map((entity) => entity['@id']);
    const types = entities.map((entity) => entity['@type']).sort();

    expect(ids.every((id) => typeof id === 'string' && id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual(Object.values(EXPECTED_ENTITY_IDS).sort());
    expect(types).toEqual(EXPECTED_GRAPH_TYPES);
    expect(types).not.toContain('FAQPage');
  });

  it('keeps canonical entity URLs on the production root and publisher references resolvable', () => {
    const entities = graphEntities();
    const knownIds = new Set(entities.map((entity) => entity['@id']));

    for (const id of Object.values(EXPECTED_ENTITY_IDS)) {
      expect(entityById(entities, id).url).toBe(ROOT_URL);
    }

    const website = entityById(entities, EXPECTED_ENTITY_IDS.website);
    const application = entityById(entities, EXPECTED_ENTITY_IDS.application);

    for (const publisher of [website.publisher, application.publisher]) {
      expect(publisher?.['@id']).toBe(EXPECTED_ENTITY_IDS.organization);
      expect(knownIds.has(publisher?.['@id'])).toBe(true);
    }
  });

  it('binds SoftwareApplication.softwareVersion to package.json#version', () => {
    const packageMetadata = JSON.parse(fs.readFileSync(packagePath, 'utf8')) as {
      version?: unknown;
    };
    const application = entityById(graphEntities(), EXPECTED_ENTITY_IDS.application);

    expect(typeof packageMetadata.version).toBe('string');
    expect(application.softwareVersion).toBe(packageMetadata.version);
  });

  it('keeps the declared Offer complete and explicit for the visible zero-price EUR offer', () => {
    const application = entityById(graphEntities(), EXPECTED_ENTITY_IDS.application);
    const offer = application.offers;

    expect(offer?.['@type']).toBe('Offer');
    expect(offer?.price).toBe('0');
    expect(offer?.priceCurrency).toBe('EUR');
    expect(Number.isFinite(Number(offer?.price))).toBe(true);
    expect(Number(offer?.price)).toBeGreaterThanOrEqual(0);
  });
});
