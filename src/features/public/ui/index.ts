// Canonical Public / Access UI facade.
export { LandingPage } from './LandingPage';
export { LoginPage } from './LoginPage';
export { LoginPageRedirect } from './LoginPageRedirect';
export { PasskeyLoginPanel } from './PasskeyLoginPanel';

// Transitional legal-page compatibility exports use the direct route adapters so route-level
// splitting and facade imports share one boundary.
export { Datenschutz } from './Datenschutz';
export { ImpressumAgb } from './ImpressumAgb';
