(function () {
  'use strict';
  var gaMeta = document.querySelector('meta[name="ga-measurement-id"]');
  var GA_MEASUREMENT_ID = gaMeta ? String(gaMeta.getAttribute('content') || '').trim() : '';
  var validGaId = /^G-[A-Z0-9]+$/i.test(GA_MEASUREMENT_ID);
  var nonce = document.currentScript ? document.currentScript.nonce : '';
  var gaLoaded = false;
  var privacyReloadScheduled = false;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

  // Owner-approved Variant A: advertising is paused, including after "accept all".
  // A future AdSense/TCF activation requires a separately reviewed protected change.
  function setDefaultConsent() {
    window.gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
      functionality_storage: 'denied',
      personalization_storage: 'denied',
      security_storage: 'granted',
    });
    window.gtag('set', 'ads_data_redaction', true);
    window.gtag('set', 'url_passthrough', false);
  }
  function updateConsent(analyticsAllowed) {
    window.gtag('consent', 'update', {
      analytics_storage: analyticsAllowed ? 'granted' : 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      functionality_storage: 'denied',
      personalization_storage: 'denied',
      security_storage: 'granted',
    });
  }
  function loadGA() {
    if (!validGaId || gaLoaded) return;
    gaLoaded = true;
    window['ga-disable-' + GA_MEASUREMENT_ID] = false;
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, {
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      send_page_view: true,
    });
    if (document.getElementById('capital-ai-ga4-loader')) return;
    var script = document.createElement('script');
    script.id = 'capital-ai-ga4-loader';
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_MEASUREMENT_ID);
    if (nonce) script.nonce = nonce;
    script.setAttribute('data-consent-managed', 'true');
    document.head.appendChild(script);
  }
  function clearGoogleAnalyticsCookies() {
    var host = String(window.location && window.location.hostname || '');
    var labels = host.split('.');
    var domains = [''];
    for (var i = 0; i < labels.length - 1; i += 1) {
      var domain = labels.slice(i).join('.');
      domains.push(domain, '.' + domain);
    }
    var names = String(document.cookie || '').split(';').map(function (entry) {
      var name = entry.split('=')[0].trim();
      try { return decodeURIComponent(name); } catch (_error) { return name; }
    }).filter(function (name) { return name === '_ga' || name.indexOf('_ga_') === 0; });
    names.forEach(function (name) {
      domains.forEach(function (domain) {
        document.cookie = encodeURIComponent(name) + '=; Max-Age=0; path=/; SameSite=Lax' +
          (domain ? '; domain=' + domain : '');
      });
    });
  }
  function disableGA() {
    if (validGaId) window['ga-disable-' + GA_MEASUREMENT_ID] = true;
    clearGoogleAnalyticsCookies();
  }
  function analyticsConsent() {
    try {
      var consent = window.CookieConsent;
      return Boolean(consent &&
        typeof consent.validConsent === 'function' && consent.validConsent() === true &&
        typeof consent.acceptedCategory === 'function' && consent.acceptedCategory('analytics') === true);
    } catch (error) {
      console.error('[Consent] Consent lookup failed closed.', error);
      return false;
    }
  }
  function syncConsent() {
    var allowed = analyticsConsent();
    updateConsent(allowed);
    if (allowed) loadGA();
    else disableGA();
  }
  function handleSavedChange() {
    syncConsent();
    // cc:onChange is emitted after the new choice is saved, not on checkbox edits.
    // Removing a script element cannot undo execution: restart the document once.
    if (gaLoaded && !analyticsConsent() && !privacyReloadScheduled) {
      privacyReloadScheduled = true;
      window.setTimeout(function () { window.location.reload(); }, 0);
    }
  }
  setDefaultConsent();
  // Disable collection during startup without erasing returning opt-in visitors' cookies.
  if (validGaId) window['ga-disable-' + GA_MEASUREMENT_ID] = true;
  // Registered before the deferred SDK/initializer, including returning visitors.
  window.addEventListener('capital-ai:consent-ready', syncConsent);
  window.addEventListener('cc:onConsent', syncConsent);
  window.addEventListener('cc:onChange', handleSavedChange);
})();
