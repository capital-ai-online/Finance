export class RequestCoalescer {
  private readonly inFlight = new Map<string, Promise<unknown>>();

  has(key: string): boolean {
    return this.inFlight.has(key);
  }

  run<T>(key: string, operation: () => Promise<T>): Promise<T> {
    const existing = this.inFlight.get(key);
    if (existing) return existing as Promise<T>;

    const promise = operation().finally(() => {
      if (this.inFlight.get(key) === promise) this.inFlight.delete(key);
    });
    this.inFlight.set(key, promise);
    return promise;
  }
}
