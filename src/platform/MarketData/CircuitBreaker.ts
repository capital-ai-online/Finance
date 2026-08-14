export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  cooldownMs?: number;
  nowMs?: () => number;
}

interface Circuit {
  failures: number;
  state: CircuitState;
  openedAtMs: number | null;
  probeInFlight: boolean;
}

export class CircuitBreaker {
  private readonly circuits = new Map<string, Circuit>();
  private readonly failureThreshold: number;
  private readonly cooldownMs: number;
  private readonly nowMs: () => number;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = Math.max(1, Math.floor(options.failureThreshold ?? 3));
    this.cooldownMs = Math.max(1, Math.floor(options.cooldownMs ?? 30_000));
    this.nowMs = options.nowMs ?? Date.now;
  }

  allow(providerId: string): boolean {
    const circuit = this.get(providerId);
    if (circuit.state === 'CLOSED') return true;
    if (circuit.state === 'OPEN' && circuit.openedAtMs !== null && this.nowMs() - circuit.openedAtMs >= this.cooldownMs) {
      circuit.state = 'HALF_OPEN';
      circuit.probeInFlight = false;
    }
    if (circuit.state === 'HALF_OPEN' && !circuit.probeInFlight) {
      circuit.probeInFlight = true;
      return true;
    }
    return false;
  }

  success(providerId: string): void {
    this.circuits.set(providerId, { failures: 0, state: 'CLOSED', openedAtMs: null, probeInFlight: false });
  }

  failure(providerId: string): void {
    const circuit = this.get(providerId);
    circuit.failures += 1;
    circuit.probeInFlight = false;
    if (circuit.state === 'HALF_OPEN' || circuit.failures >= this.failureThreshold) {
      circuit.state = 'OPEN';
      circuit.openedAtMs = this.nowMs();
    }
  }

  state(providerId: string): CircuitState {
    const circuit = this.get(providerId);
    if (circuit.state === 'OPEN' && circuit.openedAtMs !== null && this.nowMs() - circuit.openedAtMs >= this.cooldownMs) {
      return 'HALF_OPEN';
    }
    return circuit.state;
  }

  private get(providerId: string): Circuit {
    let circuit = this.circuits.get(providerId);
    if (!circuit) {
      circuit = { failures: 0, state: 'CLOSED', openedAtMs: null, probeInFlight: false };
      this.circuits.set(providerId, circuit);
    }
    return circuit;
  }
}
