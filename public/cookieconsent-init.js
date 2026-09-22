(function () {
  'use strict';
  var consent = window.CookieConsent;
  if (!consent || typeof consent.run !== 'function') {
    console.error('[Consent] CookieConsent unavailable; optional services remain disabled.');
    return;
  }

  var requiredStyleIds = [
    'cookieconsent-vendor-style',
    'cookieconsent-theme-style',
  ];

  function waitForStylesheet(id) {
    var link = document.getElementById(id);
    if (!link) {
      return Promise.reject(new Error('[Consent] Required stylesheet missing: ' + id));
    }
    if (link.sheet) return Promise.resolve();

    return new Promise(function (resolve, reject) {
      var settled = false;
      function finish(error) {
        if (settled) return;
        settled = true;
        link.removeEventListener('load', onLoad);
        link.removeEventListener('error', onError);
        if (error) reject(error);
        else resolve();
      }
      function onLoad() { finish(); }
      function onError() {
        finish(new Error('[Consent] Required stylesheet failed to load: ' + id));
      }

      link.addEventListener('load', onLoad);
      link.addEventListener('error', onError);

      // Close the race where the sheet becomes ready between the first check
      // and listener registration.
      if (link.sheet) finish();
    });
  }

  function waitForConsentStyles() {
    return Promise.all(requiredStyleIds.map(waitForStylesheet));
  }

  // FE-CONSENT-V3: new cookie/revision never imports a CookieHub choice.
  var configuration = {
    mode: 'opt-in',
    revision: 1,
    autoShow: false,
    lazyHtmlGeneration: true,
    hideFromBots: false,
    disablePageInteraction: false,
    manageScriptTags: false,
    autoClearCookies: false,
    cookie: {
      name: 'capital_ai_consent_v3',
      domain: '',
      path: '/',
      sameSite: 'Lax',
      secure: true,
      expiresAfterDays: 182,
    },
    guiOptions: {
      consentModal: { layout: 'box', position: 'bottom center', equalWeightButtons: true },
      preferencesModal: { layout: 'box', equalWeightButtons: true },
    },
    categories: {
      necessary: { enabled: true, readOnly: true },
      analytics: { enabled: false },
    },
    language: {
      default: 'de',
      translations: {
        de: {
          consentModal: {
            title: 'Deine Cookie-Auswahl',
            description: 'Wir speichern deine Auswahl mit einem notwendigen Cookie. Mit deiner freiwilligen Zustimmung verwenden wir Google Analytics zur Reichweitenmessung. Du kannst deine Auswahl jederzeit über „Cookie-Einstellungen“ ändern. Werbung über Google AdSense ist derzeit deaktiviert.',
            acceptAllBtn: 'Alle akzeptieren',
            acceptNecessaryBtn: 'Nur notwendige',
            showPreferencesBtn: 'Einstellungen',
            footer: '<a href="/datenschutz">Datenschutz</a> · <a href="/impressum">Impressum</a>',
          },
          preferencesModal: {
            title: 'Cookie-Einstellungen',
            acceptAllBtn: 'Alle akzeptieren',
            acceptNecessaryBtn: 'Nur notwendige',
            savePreferencesBtn: 'Auswahl speichern',
            closeIconLabel: 'Schließen',
            sections: [
              {
                title: 'Notwendige Funktionen',
                description: 'Erforderlich für Anmeldung, Sicherheit und das Speichern deiner Cookie-Auswahl. Das Auswahl-Cookie wird höchstens 182 Tage gespeichert.',
                linkedCategory: 'necessary',
              },
              {
                title: 'Reichweitenmessung mit Google Analytics',
                description: 'Nach Zustimmung werden Nutzungs- und Geräteinformationen an Google übertragen. Dabei kann eine Verarbeitung außerhalb der EU erfolgen. Details findest du in der Datenschutzerklärung. Beim Widerruf wird die Messung deaktiviert, erreichbare Analytics-Cookies werden gelöscht und die Seite wird gegebenenfalls neu geladen.',
                linkedCategory: 'analytics',
              },
              {
                title: 'Werbung pausiert',
                description: 'Google AdSense wird derzeit nicht geladen. Deine Zustimmung zur Reichweitenmessung aktiviert keine Werbung.',
              },
              {
                title: 'Weitere Informationen',
                description: '<a href="/datenschutz">Datenschutzerklärung</a> · <a href="/impressum">Impressum</a>',
              },
            ],
          },
        },
      },
    },
  };
  var initializationPromise = null;

  function hasStoredConsentCookie() {
    var cookieName = configuration.cookie.name + '=';
    return String(document.cookie || '')
      .split(';')
      .some(function (entry) { return entry.trim().indexOf(cookieName) === 0; });
  }

  function initializeConsent() {
    if (initializationPromise) return initializationPromise;

    initializationPromise = waitForConsentStyles()
      .then(function () { return consent.run(configuration); })
      .then(function () {
        window.dispatchEvent(new CustomEvent('capital-ai:consent-ready'));
      })
      .catch(function (error) {
        initializationPromise = null;
        console.error('[Consent] Initialization failed; optional services remain disabled.', error);
        throw error;
      });

    return initializationPromise;
  }

  // Available on every SPA route, independently of React/authentication.
  function installSettingsButton() {
    if (document.getElementById('capital-ai-cookie-settings')) return;
    var button = document.createElement('button');
    button.id = 'capital-ai-cookie-settings';
    button.type = 'button';
    button.textContent = 'Cookie-Einstellungen';
    button.addEventListener('click', function () {
      initializeConsent()
        .then(function () { consent.showPreferences(); })
        .catch(function () {
          // Initialization already logged the error; optional services stay disabled.
        });
    });
    document.body.appendChild(button);
  }
  installSettingsButton();

  if (hasStoredConsentCookie()) {
    void initializeConsent();
  } else {
    // A fresh/private visit remains completely independent from the vendor DOM.
    // The GA bridge still receives its fail-closed readiness signal and keeps
    // optional measurement disabled until the user opens settings and consents.
    window.dispatchEvent(new CustomEvent('capital-ai:consent-ready'));
  }
})();
