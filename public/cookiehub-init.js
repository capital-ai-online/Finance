(function () {
  'use strict';

  function initializeCookieHub() {
    if (!window.cookiehub || typeof window.cookiehub.load !== 'function') {
      console.error('[CookieHub] SDK loaded without a usable window.cookiehub.load() API.');
      return;
    }

    window.cookiehub.load({});
  }

  // Register before DOMContentLoaded so CookieHub starts at the same lifecycle point
  // as the vendor-provided installation snippet, without requiring CSP unsafe-inline.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCookieHub, { once: true });
  } else {
    initializeCookieHub();
  }
})();
