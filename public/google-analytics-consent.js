(function () {
  'use strict';

  var gaMeta = document.querySelector('meta[name="ga-measurement-id"]');
  var adsMeta = document.querySelector('meta[name="adsense-publisher-id"]');
  var GA_MEASUREMENT_ID = gaMeta ? String(gaMeta.getAttribute('content') || '').trim() : '';
  var ADSENSE_PUBLISHER_ID = adsMeta ? String(adsMeta.getAttribute('content') || '').trim() : '';

  var validGaId = /^G-[A-Z0-9]+$/i.test(GA_MEASUREMENT_ID) && GA_MEASUREMENT_ID.indexOf('%') !== 0;
  var validPublisherId = /^ca-pub-\d+$/i.test(ADSENSE_PUBLISHER_ID) && ADSENSE_PUBLISHER_ID.indexOf('%') !== 0;
  var gaLoaded = false;
  var adsenseLoaded = false;
  var firstConsentSync = true;
  var lastAnalyticsConsent = false;
  var lastMarketingConsent = false;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };

  function setDefaultConsent() {
    window.gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
      functionality_storage: 'denied',
      personalization_storage: 'denied',
      security_storage: 'granted',
      wait_for_update: 2000,
    });
    window.gtag('set', 'ads_data_redaction', true);
    window.gtag('set', 'url_passthrough', false);
  }

  function updateConsent(analyticsAllowed, marketingAllowed) {
    window.gtag('consent', 'update', {
      analytics_storage: analyticsAllowed ? 'granted' : 'denied',
      ad_storage: marketingAllowed ? 'granted' : 'denied',
      ad_user_data: marketingAllowed ? 'granted' : 'denied',
      ad_personalization: marketingAllowed ? 'granted' : 'denied',
      functionality_storage: 'denied',
      personalization_storage: 'denied',
      security_storage: 'granted',
    });
  }

  function appendScript(id, src, crossOrigin) {
    if (document.getElementById(id)) return null;
    var script = document.createElement('script');
    script.id = id;
    script.async = true;
    script.src = src;
    if (crossOrigin) script.crossOrigin = crossOrigin;
    script.setAttribute('data-consent-managed', 'true');
    document.head.appendChild(script);
    return script;
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

    appendScript(
      'capital-ai-ga4-loader',
      'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_MEASUREMENT_ID),
    );
  }

  function loadAdSense() {
    if (!validPublisherId || adsenseLoaded) return;
    adsenseLoaded = true;
    appendScript(
      'capital-ai-adsense-loader',
      'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(ADSENSE_PUBLISHER_ID),
      'anonymous',
    );
  }

  function expireCookie(name, domain) {
    var cookie = encodeURIComponent(name) + '=; Max-Age=0; path=/; SameSite=Lax';
    if (domain) cookie += '; domain=' + domain;
    document.cookie = cookie;
  }

  function decodeCookieName(rawName) {
    try {
      return decodeURIComponent(rawName);
    } catch (_error) {
      return rawName;
    }
  }

  function clearGoogleAnalyticsCookies() {
    if (!validGaId || !document.cookie) return;
    var host = String(window.location && window.location.hostname || '').replace(/^www\./i, '');
    var domains = ['', host, host ? '.' + host : ''];
    var names = document.cookie.split(';').map(function (entry) {
      return decodeCookieName(entry.split('=')[0].trim());
    }).filter(function (name) {
      return name === '_ga' || name.indexOf('_ga_') === 0;
    });

    names.forEach(function (name) {
      domains.forEach(function (domain) {
        expireCookie(name, domain);
      });
    });
  }

  function disableGA() {
    if (!validGaId) return;
    window['ga-disable-' + GA_MEASUREMENT_ID] = true;
    clearGoogleAnalyticsCookies();
  }

  function hasConsented(category) {
    try {
      return Boolean(
        window.cookiehub &&
        typeof window.cookiehub.hasConsented === 'function' &&
        window.cookiehub.hasConsented(category)
      );
    } catch (error) {
      console.error('[Consent] CookieHub consent lookup failed closed.', error);
      return false;
    }
  }

  function schedulePrivacyReload() {
    if (!window.location || typeof window.location.reload !== 'function') return;
    window.setTimeout(function () {
      window.location.reload();
    }, 0);
  }

  function syncConsent() {
    var analyticsAllowed = hasConsented('analytics');
    var marketingAllowed = hasConsented('marketing');

    updateConsent(analyticsAllowed, marketingAllowed);

    if (analyticsAllowed) loadGA();
    else disableGA();

    if (marketingAllowed) loadAdSense();

    if (!firstConsentSync && (
      (lastAnalyticsConsent && !analyticsAllowed) ||
      (lastMarketingConsent && !marketingAllowed)
    )) {
      // Executed third-party scripts cannot be reliably unloaded. Reload after a persisted
      // revocation so the next document starts in fail-closed Basic Consent Mode.
      schedulePrivacyReload();
    }

    lastAnalyticsConsent = analyticsAllowed;
    lastMarketingConsent = marketingAllowed;
    firstConsentSync = false;
  }

  function syncWhenCookieHubReady(attempt) {
    if (window.cookiehub && (
      typeof window.cookiehub.isReady !== 'function' ||
      window.cookiehub.isReady()
    )) {
      syncConsent();
      return;
    }

    if (attempt < 20) {
      window.setTimeout(function () {
        syncWhenCookieHubReady(attempt + 1);
      }, 250);
    }
  }

  setDefaultConsent();

  ['cookiehub_onInitialise', 'cookiehub_onStatusChange', 'cookiehub_onAllow', 'cookiehub_onRevoke']
    .forEach(function (eventName) {
      document.addEventListener(eventName, syncConsent);
    });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      syncWhenCookieHubReady(0);
    }, { once: true });
  } else {
    syncWhenCookieHubReady(0);
  }
})();
