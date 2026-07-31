// ESS-0013-CONTRACTS Abschnitt 5, Routing Contract — EventRouter ist der einzige Ort,
// an dem eine Zustellentscheidung getroffen wird.

import type { EventContract } from '../Contracts/EventContract';
import type { EventPayload } from '../Contracts/EventPayload';

export interface RoutingResult {
  delivered: string[];
  failed: { consumer: string; reason: string }[];
}

export interface IEventRouter {
  route<TPayload extends EventPayload>(event: EventContract<TPayload>): Promise<RoutingResult>;
}
