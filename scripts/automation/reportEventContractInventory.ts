import { buildEventContractInventory } from '../../src/platform/EventMesh/Discovery/EventContractInventory';

const report = buildEventContractInventory();
console.log(JSON.stringify(report, null, 2));

const critical = report.events.filter((event) => event.gaps.includes('UNREGISTERED_EVENT') || event.gaps.includes('NO_AUTHORITY'));
if (critical.length > 0) {
  console.error(`[Event Contract Inventory] ${critical.length} event(s) lack canonical registration or authority.`);
  process.exit(1);
}

console.log(`[Event Contract Inventory] ${report.events.length} canonical event(s), ${report.gapCount} total producer/consumer/authority gap(s).`);
