(function () {
  'use strict';
  var consent = window.CookieConsent;
  if (!consent || typeof consent.run !== 'function') {
    console.error('[Consent] CookieConsent unavailable; optional services remain disabled.');
    return;
  }
  // FE-CONSENT-V3: new cookie/revision never imports a CookieHub choice.
  var configuration = {
    mode: 'opt-in',
    revision: 1,
    autoShow: true,
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
  // Available on every SPA route, independently of React/authentication.
  function installSettingsButton() {
    if (document.getElementById('capital-ai-cookie-settings')) return;
    var button = document.createElement('button');
    button.id = 'capital-ai-cookie-settings';
    button.type = 'button';
    button.textContent = 'Cookie-Einstellungen';
    button.addEventListener('click', function () { consent.showPreferences(); });
    document.body.appendChild(button);
  }
  try {
    Promise.resolve(consent.run(configuration)).then(function () {
      installSettingsButton();
      window.dispatchEvent(new CustomEvent('capital-ai:consent-ready'));
    }).catch(function (error) {
      console.error('[Consent] Initialization failed; optional services remain disabled.', error);
    });
  } catch (error) {
    console.error('[Consent] Initialization failed; optional services remain disabled.', error);
  }
})();
