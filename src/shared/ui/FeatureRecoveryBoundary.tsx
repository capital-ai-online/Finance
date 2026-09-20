import React from 'react';

interface FeatureRecoveryBoundaryProps {
  children: React.ReactNode;
  name: string;
  fallback?: (reset: () => void) => React.ReactNode;
}

interface FeatureRecoveryBoundaryState {
  hasError: boolean;
  generation: number;
}

export class FeatureRecoveryBoundary extends React.Component<
  FeatureRecoveryBoundaryProps,
  FeatureRecoveryBoundaryState
> {
  state: FeatureRecoveryBoundaryState = {
    hasError: false,
    generation: 0,
  };

  static getDerivedStateFromError(): Partial<FeatureRecoveryBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[FeatureRecoveryBoundary] Feature render failure', {
      feature: this.props.name,
      errorName: error.name,
      componentStack: info.componentStack,
    });
  }

  private reset = () => {
    this.setState((state) => ({
      hasError: false,
      generation: state.generation + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback(this.reset);

      return (
        <section
          role="alert"
          className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-2xl border border-status-warning/30 bg-status-warning/5 px-6 py-8 text-center text-text-primary"
        >
          <div className="max-w-xl space-y-2">
            <p className="text-sm font-black">{this.props.name} ist vorübergehend nicht verfügbar.</p>
            <p className="text-xs leading-relaxed text-text-secondary">
              Nur dieser Bereich wurde angehalten. Andere Funktionen und Ihre bestehende Sitzung bleiben erhalten.
            </p>
          </div>
          <button
            type="button"
            onClick={this.reset}
            className="ui-hit inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-primary/35 bg-brand-primary/10 px-4 py-2 text-xs font-black text-text-primary transition hover:bg-brand-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            Bereich erneut laden
          </button>
        </section>
      );
    }

    return (
      <React.Fragment key={this.state.generation}>
        {this.props.children}
      </React.Fragment>
    );
  }
}
