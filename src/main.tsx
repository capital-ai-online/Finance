import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { applyRouteSeo } from './lib/routeSeo';
import './index.css';

// SEO-ROADMAP-0001 / D2: set route-specific title/meta before first paint where possible.
if (typeof window !== 'undefined') {
  applyRouteSeo(window.location.pathname);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
