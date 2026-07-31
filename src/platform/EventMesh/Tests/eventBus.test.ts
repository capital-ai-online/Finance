// Vertrags- und Kompatibilitaetstests fuer den Event Bus (ESS-0013, Struktur
// "Tests/"). Kein Testframework registriert (package.json besitzt keinen
// "test"-Script, Audit-Befund "0 Testdateien") - bewusst als eigenstaendiges,
// mit node:assert lauffaehiges Skript, statt eine neue Abhaengigkeit einzufuehren.
//
// Ausfuehrung: npx tsx src/platform/EventMesh/Tests/eventBus.test.ts

import assert from 'node:assert/strict';
import { EventBus } from '../Core/EventBus';
import { EventCompatibilityValidator } from '../Validators/EventCompatibilityValidator';
import { EventVersionValidator } from '../Validators/EventVersionValidator';
import type { EventSchema } from '../Contracts/EventSchema';

let passed = 0;
function test(name: string, fn: () => void | Promise<void>) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      passed += 1;
      console.log(`  ok - ${name}`);
    })
    .catch((err) => {
      console.error(`  FAIL - ${name}`);
      console.error(err);
      process.exitCode = 1;
    });
}

async function run() {
  console.log('EventMesh Tests/eventBus.test.ts');

  await test('publish() liefert an registrierten Consumer aus', async () => {
    const bus = new EventBus();
    let received: unknown = null;
    bus.subscribe('DocumentationGeneratedEvent', 'Documentary', (event) => {
      received = event.payload;
    });
    bus.publish('DocumentationGeneratedEvent', { filesGenerated: 3 }, {
      sourceComponent: 'Documentary',
      essReferences: ['ESS-0010'],
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.deepEqual(received, { filesGenerated: 3 });
  });

  await test('publish() registriert den Producer in der Registry', () => {
    const bus = new EventBus();
    bus.publish('DocumentationGeneratedEvent', {}, {
      sourceComponent: 'Documentary',
      essReferences: ['ESS-0010'],
    });
    const entry = bus.registry.getCatalogEntry('DocumentationGeneratedEvent');
    assert.ok(entry, 'Event sollte im Katalog registriert sein');
    assert.ok(entry!.producers.includes('Documentary'));
  });

  await test('publish() ohne essReferences wirft (EventContractValidator)', () => {
    const bus = new EventBus();
    assert.throws(() => {
      bus.publish('DocumentationGeneratedEvent', {}, {
        sourceComponent: 'Documentary',
        essReferences: [],
      });
    });
  });

  await test('unsubscribe() beendet die Zustellung', async () => {
    const bus = new EventBus();
    let callCount = 0;
    const unsubscribe = bus.subscribe('DocumentationGeneratedEvent', 'Documentary', () => {
      callCount += 1;
    });
    unsubscribe();
    bus.publish('DocumentationGeneratedEvent', {}, {
      sourceComponent: 'Documentary',
      essReferences: ['ESS-0010'],
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(callCount, 0);
  });

  await test('EventVersionValidator erkennt gueltige Versionssprünge', () => {
    const validator = new EventVersionValidator();
    assert.equal(validator.isValidBump({ major: 1, minor: 0, patch: 0 }, { major: 1, minor: 1, patch: 0 }), true);
    assert.equal(validator.isValidBump({ major: 1, minor: 0, patch: 0 }, { major: 1, minor: 0, patch: 0 }), false);
    assert.equal(validator.isValidBump({ major: 1, minor: 2, patch: 0 }, { major: 2, minor: 0, patch: 0 }), true);
    assert.equal(validator.isValidBump({ major: 1, minor: 2, patch: 0 }, { major: 2, minor: 1, patch: 0 }), false);
  });

  await test('EventCompatibilityValidator erkennt Breaking Change bei neuem Pflichtfeld', () => {
    const validator = new EventCompatibilityValidator();
    const previous: EventSchema = { fields: { symbol: { type: 'string', required: true } } };
    const next: EventSchema = {
      fields: {
        symbol: { type: 'string', required: true },
        score: { type: 'number', required: true },
      },
    };
    const result = validator.compare(previous, next);
    assert.equal(result.bump, 'major');
    assert.equal(result.requiresAdr, true);
  });

  await test('EventCompatibilityValidator stuft neues optionales Feld als Minor ein', () => {
    const validator = new EventCompatibilityValidator();
    const previous: EventSchema = { fields: { symbol: { type: 'string', required: true } } };
    const next: EventSchema = {
      fields: {
        symbol: { type: 'string', required: true },
        note: { type: 'string', required: false },
      },
    };
    const result = validator.compare(previous, next);
    assert.equal(result.bump, 'minor');
    assert.equal(result.requiresAdr, false);
  });

  console.log(`\n${passed} Test(s) bestanden.`);
  if (process.exitCode) {
    console.error('Mindestens ein Test ist fehlgeschlagen.');
  }
}

run();
