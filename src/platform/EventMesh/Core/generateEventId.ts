// Isomorpher ID-Generator (funktioniert in Node und Browser ohne Import aus
// 'node:crypto', da src/platform/ nicht auf einen Ausfuehrungskontext festgelegt
// ist). Event-IDs und Correlation-IDs sind nicht sicherheitskritisch - lediglich
// Eindeutigkeit ist erforderlich.

export function generateEventId(): string {
  const cryptoObj = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (cryptoObj?.randomUUID) {
    return cryptoObj.randomUUID();
  }
  return `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
