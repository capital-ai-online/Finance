// ESS-0001-CONTRACTS Chapter 8, "Event Payload" — ausschliesslich fachliche
// Information, keine Implementierungsdetails, keine Geschaeftslogik. Generisch
// typisiert statt einer Klasse je Event, da die uebergrosse Mehrheit der ueber 80 in
// Chapter 8-19 definierten Events strukturell identisch behandelt wird (Name +
// Metadata + typisierter Payload).

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EventPayload = Record<string, unknown>;
