(function () {
  'use strict';

  var meta = document.querySelector('meta[name="ga-measurement-id"]');
  var GA_MEASUREMENT_ID = meta ? meta.getAttribute('content') : '';

  if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID.indexOf('%') === 0) {
    return;
  }

  var gaLoaded = false;

  function loadGA() {
    if (gaLoaded) return;
    gaLoaded = true;

    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_MEASUREMENT_ID);
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }

    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true });
  }

  function unloadGA() {
    window['ga-disable-' + GA_MEASUREMENT_ID] = true;
  }

  function syncConsent() {
    if (window.cookiehub && typeof window.cookiehub.hasConsented === 'function' && window.cookiehub.hasConsented('analytics')) {
      loadGA();
    } else {
      unloadGA();
    }
  }

  // These listeners are registered during <head> parsing, before CookieHub's
  // DOMContentLoaded initialization fires, preserving the original event ordering.
  window.addEventListener('cookiehub_onInitialise', syncConsent);
  window.addEventListener('cookiehub_onStatusChange', syncConsent);
})();
