import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { applyRouteSeo } from './lib/routeSeo';
import './index.css';

// SEO-GM-ROADMAP-0002 / WP-D2: set route-specific title/meta before first paint
// and keep them in sync on browser back/forward (popstate).
if (typeof window !== 'undefined') {
  applyRouteSeo(window.location.pathname);
  window.addEventListener('popstate', () => {
    applyRouteSeo(window.location.pathname);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
