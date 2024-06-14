//[privacy]
// Uncomment the previous line for testing on webpagetest.org

// README! Instructions for adding a new custom metric for the Web Almanac.
// 2. If the value requires more than one line of code, evaluate it in an IIFE, eg `(() => { ... })()`. See `link-nodes`.
// 3. Test your change by following the instructions at https://github.com/HTTPArchive/almanac.httparchive.org/issues/33#issuecomment-502288773.
// 4. Submit a PR to update this file.

const response_bodies = $WPT_BODIES.filter(body => (body.response_body && (body.type === 'Document' || body.type === 'Script')))

/**
 * @function testPropertyStringInResponseBodies
 * Test that a JS property string is accessed in response bodies
 * inspired by https://github.com/HTTPArchive/legacy.httparchive.org/blob/master/custom_metrics/event-names.js
 *
 * @param {string} pattern - Regex pattern to match in the response bodies.
 * @return {boolean} - True, if pattern was matched.
 */
function testPropertyStringInResponseBodies(pattern) {
  try {
    let re = new RegExp(pattern);
    return response_bodies.some(body => body.response_body ? re.test(body.response_body) : false);
  } catch (error) {
    return error.toString();
  }
}

return JSON.stringify({
  /**
   * Privacy policies
   * Wording sourced from: https://github.com/RUB-SysSec/we-value-your-privacy/blob/master/privacy_wording.json
   * words = privacy_wording.map(country => country.words).filter((v, i, a) => a.indexOf(v) === i).flat().sort().join('|');
   */
  privacy_wording_links: (() => {
    const languageKeywords = {
      af: "beskyttelse af personlige oplysninger|privatlivspolitik|persondata",
      ar: "الخصوصية|سياسة البيانات|سياسة الخصوصية|سياسة الخصوصية والبيانات",
      az: "məxfilik|şəxsi məlumatlar",
      be: "абарона дадзеных|палітыка прыватнасці",
      bg: "поверителност|политика за бисквитки|политика за данни|условия|условия за ползване|политика за поверителност",
      bn: "গোপনীয়তা|ডেটা নীতি|গোপনীয়তা নীতি",
      bs: "privatnost|politika privatnosti|politika podataka|pravila o privatnosti",
      ca: "protecció de dades|política de privacitat",
      cs: "ochrana dat|ochrana osobních údajů|ochrana soukromí|ochrana súkromia|ochrana udaju|ochrana údajov|ochrany osobných údajov|podmínky|soukromi|soukromí|zásady používání dat|zásady používání cookies",
      da: "cookiepolitik|datapolicy|beskyttelse af personlige oplysninger|personlige data|personoplysninger|privatlivspolitik|regler om fortrolighed",
      de: "datenrichtlinie|datenschutz|datenschutzbestimmungen|datenschutzrichtlinie|privatssphäre|cookie-richtlinie|privatsphärenerklärung",
      el: "απόρρητο|πολιτική απορρήτου|πολιτική δεδομένων|προσωπικά δεδομένα|όροι και γνωστοποιήσεις|πολιτική cookies",
      en: "cookie policy|cookies|data policy|datapolicy|privacy|privacy policy|cookiepolicy",
      es: "aviso legal|confidencialidad|confidencialite|confidentialité|política de datos|privacidad|privacidad|politica de datos|política de privacidad|política de cookies",
      et: "andmekaitsetingimused|isikuandmete|isikuandmete töötlemise|kasutustingimused|privaatsuspoliitika|andmepoliitika|küpsisepoliitika",
      eu: "privatua|datu pertsonalen babesa|datu pertsonalen politika",
      fa: "حریم خصوصی|سیاست حفظ حریم خصوصی|سیاست داده|داده های شخصی",
      fi: "yksityisyyden suoja|yksityisyydensuoja|yksityisyys|tietokäytäntö|tietosuoja|tietosuojakäytäntö|tietosuojaseloste|evästekäytäntö",
      fil: "patakaran sa cookies",
      fr: "cgu|cgv|confidentialité|mentions légales|politique d’utilisation des données|rgpd|vie privée|politique de confidentialité|politique de données|politique de cookie",
      ga: "beartas príobháideachta|beartas sonraí|beartas fianán|beartas sonraí pearsanta",
      he: "מדיניות נתונים|פרטיות",
      hi: "गोपनीयता|डेटा नीति|गोपनीयता नीति",
      hr: "privatnost|pravila o privatnosti|pravila o podacima|pravila o kolačićima",
      hu: "adatvédelem|adatvédelmi|személyes adatok védelme|adatvédelmi nyilatkozat|adatkezelési tájékoztató|cookie-kra vonatkozó irányelv",
      id: "integritetspolicy|piškotki|kebijakan privasi",
      is: "persónuvernd|persónuverndarstefna",
      it: "normativa sui dati|privatezza|informativa sulla privacy|informativa sui dati|informativa sui cookie|politica dei dati|politica dei cookies",
      ja: "プライバシー|データポリシー|個人情報保護",
      ko: "개인정보|개인정보 처리방침|개인정보 보호정책|개인정보 보호|정보 처리 방침",
      ka: "კერძო წამყვანი|პირადი ინფორმაციის დაცვა|პირადი ინფორმაციის პოლიტიკა",
      lt: "privatumas|privatumo|slapukai|slapukkih|privatumo politika|duomenų politika|slapukų politika|privatumo pareiškimas",
      lv: "sīkdatne|sīkdatņu|privātuma|privātums|privātuma politika|datu politika|sīkdatņu politika|privātuma politikas paziņojums",
      mt: "politika dwar il-privatezza|politika tad-data|politika tal-cookies|politika dwar id-dati",
      ms: "privasi|polisi data|polisi privasi|data peribadi|terma dan syarat",
      nb: "personvern|informasjonskapselregler",
      nl: "gegevensbeleid|privacybeleid|cookiebeleid|privacyverklaring",
      no: "personvern|personvernerklæring|informasjonskapsler|personvernspolicy",
      pl: "prywatnosci|prywatności|prywatność|zasady dotyczące danych|polityka prywatności|polityka danych|polityka plików cookie",
      pt: "privacidade|política de privacidade|política de dados|política de cookies",
      ro: "confidențialitate|politica de utilizare|protectia datelor|politica de confidențialitate|politica de date|politica cookie",
      ru: "конфиденциальность|политика использования данных|политика конфиденциальности|политика данных|политика файлов cookie|персональных данных",
      si: "piškotki",
      sk: "ochrana osobných údajov|zásady ochrany osobných|zásady používání dat|zásady využívania údajov|zásady ochrany osobných údajov|zásady používania údajov|zásady používania cookies|ochrana údajov",
      sl: "piškotki|varstvo podatkov|zasebnost|pravilnik o zasebnosti|pravilnik o podatkih|pravilnik o piškotkih|politika zasebnosti",
      sq: "konfidencialiteti|politika e privatësisë|politika e të dhënave personale",
      sr: "konfidentsiaalsuse|pravila o upotrebi podataka|privatnost|privatnosti|prywatnosci|prywatności|prywatność|protecţia datelor|политика о подацима|приватност|защита података",
      sv: "integritetspolicy|personuppgifter|privatlivspolitik|sekretess|webbplatsen|yksityisyyden suoja|yksityisyydensuoja|yksityisyys|datapolitik",
      sw: "política de datos",
      tr: "gizlilik|kişisel verilerin korunması|politika e të dhënave|politikat e privatesise|politikat e privatësisë|veri i̇lkesi|veri politikası|gizlilik politikası|veri politikası|çerez politikası",
      th: "ความเป็นส่วนตัว|นโยบายความเป็นส่วนตัว|นโยบายข้อมูล|ข้อมูลส่วนบุคคล|เงื่อนไข",
      vi: "quyền riêng tư|chính sách bảo mật|chính sách dữ liệu|dữ liệu cá nhân|điều khoản và điều kiện",
      uk: "конфіденційність|конфіденційності|політика даних|файлів cookie|персональних даних|захисту даних",
      zh: "数据使用政策|隐私政策|数据保护政策|隐私保护政策|數據使用政策|隱私政策|數據保護政策|隱私保護政策"
    }
    const websiteLanguage = document.documentElement.lang.slice(0, 2).toLowerCase();
    if (websiteLanguage == 'en') {
      keywords = languageKeywords[websiteLanguage]
    } else if (!(websiteLanguage in languageKeywords)) {
      keywords = Object.values(languageKeywords).join('|');
    } else {
      keywords = languageKeywords[websiteLanguage] + '|' + languageKeywords['en']
    }
    const pattern = new RegExp(`(?:${keywords})`, 'gi');

    const privacy_links = Array.from(document.querySelectorAll('a')).filter(a =>
      pattern.test(a.innerText)
    ).map(
      a => ({
        text: a.innerText,
      })
    );

    return privacy_links;
  })(),

  // Consent Management Platforms

  /**
   * IAB Transparency and Consent Framework v1
   * https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework/blob/master/CMP%20JS%20API%20v1.1%20Final.md
   */
  iab_tcf_v1: (() => {
    let consentData = {
      present: typeof window.__cmp == 'function',
      data: null,
      compliant_setup: null,
    };
    // description of `__cmp`: https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework/blob/master/CMP%20JS%20API%20v1.1%20Final.md#what-api-will-need-to-be-provided-by-the-cmp-
    try {
      if (consentData.present) {
        // Standard command: 'getVendorConsents'
        // cf. https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework/blob/master/CMP%20JS%20API%20v1.1%20Final.md#what-api-will-need-to-be-provided-by-the-cmp-
        window.__cmp('getVendorConsents', null, (result, success) => {
          if (success) {
            consentData.data = result;
            consentData.compliant_setup = true;
          } else {
            // special case for consentmanager ('CMP settings are used that are not compliant with the IAB TCF')
            // see warning at the top of https://help.consentmanager.net/books/cmp/page/changes-to-the-iab-cmp-framework-js-api
            // cf. https://help.consentmanager.net/books/cmp/page/javascript-api
            // Test site: https://www.pokellector.com/
            window.__cmp('noncompliant_getVendorConsents', null, (result, success) => {
              if (success) {
                consentData.data = result;
                consentData.compliant_setup = false;
              }
            });
          }
        });
      }
    } finally {
      return consentData;
    }
  })(),

  /**
   * IAB Transparency and Consent Framework v2
   * docs v2: https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework/blob/master/TCFv2
   */
  iab_tcf_v2: (() => {
    let tcData = {
      present: typeof window.__tcfapi == 'function',
      data: null,
      compliant_setup: null,
    };
    // description of `__tcfapi`: https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework/blob/master/TCFv2/IAB%20Tech%20Lab%20-%20CMP%20API%20v2.md#how-does-the-cmp-provide-the-api
    try {
      if (tcData.present) {
        // based on https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework/blob/master/TCFv2/IAB%20Tech%20Lab%20-%20CMP%20API%20v2.md#gettcdata
        window.__tcfapi('getTCData', 2, (result, success) => {
          if (success) {
            tcData.data = result;
            tcData.compliant_setup = true;
          } else {
            // special case for consentmanager ('CMP settings are used that are not compliant with the IAB TCF')
            // see warning at the top of https://help.consentmanager.net/books/cmp/page/changes-to-the-iab-cmp-framework-js-api
            // cf. https://help.consentmanager.net/books/cmp/page/javascript-api
            // Test site: https://www.pokellector.com/
            window.__tcfapi('noncompliant_getTCData', 2, (result, success) => {
              if (success) {
                tcData.data = result;
                tcData.compliant_setup = false;
              }
            });
          }
        });
      }
    } finally {
      return tcData;
    }
  })(),

  /**
   * IAB US Privacy User Signal Mechanism “USP API”
   * https://github.com/InteractiveAdvertisingBureau/USPrivacy
   */
  iab_usp: (() => {
    let uspData = {
      present: typeof window.__uspapi == 'function',
      privacy_string: null,
    };
    try {
      if (uspData.present) {
        window.__uspapi('getUSPData', 1, (result, success) => {
          if (success) {
            uspData.privacy_string = result;
          }
        });
      }
    } finally {
      return uspData;
    }
  })(),

  /**
   * Do Not Track (DNT)
   * https://www.eff.org/issues/do-not-track
   */
  navigator_doNotTrack: testPropertyStringInResponseBodies('doNotTrack'),

  /**
   * Global Privacy Control
   * https://globalprivacycontrol.org/
   */
  navigator_globalPrivacyControl: testPropertyStringInResponseBodies(
    'globalPrivacyControl'
  ),

  // Sensitive resources

  /**
   * Permissions policy
   * https://www.w3.org/TR/permissions-policy-1/#introspection
   * Previously known as Feature policy
   * iframes properties in `almanac` and `security` custom metrics.
   */
  document_permissionsPolicy: testPropertyStringInResponseBodies('document.+permissionsPolicy'),
  document_featurePolicy: testPropertyStringInResponseBodies('document.+featurePolicy'),

  /**
   * Referrer Policy
   * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy
   */
  referrerPolicy: (() => {
    let rp = {
      entire_document_policy: null,
      individual_requests: null,
      link_relations: null,
    };
    // Referrer policy set for entire document using `meta` tag
    let referrer_meta_tag = document.querySelector('meta[name="referrer"]');
    if (referrer_meta_tag) {
      rp.entire_document_policy = referrer_meta_tag.content; // Get policy value
    }
    // Referrer policy set for individual requests with the `referrerpolicy` attribute
    let referrerpolicy_attributes = document.querySelectorAll('[referrerpolicy]');
    // Leave `individual_requests` at `null` if no attributes are found.
    if (referrerpolicy_attributes.length > 0) {
      // Build dictionary of occurrences of tag-value pairs.
      rp.individual_requests = Array.from(referrerpolicy_attributes)
        .map(x => ({
          tagName: x.tagName,
          referrerpolicy: x.getAttribute('referrerpolicy'),
        }))
        .reduce(
          // https://stackoverflow.com/a/51935632/7391782
          (acc, e) => {
            const found = acc.find(
              a => a.tagName === e.tagName && a.referrerpolicy === e.referrerpolicy
            );
            if (!found) {
              acc.push({ ...e, count: 1 });
            } else {
              found.count += 1;
            }
            return acc;
          },
          []
        );
    }

    // Referrer policy set for a link using `noreferrer` link relation
    let noreferrer_link_relations = document.querySelectorAll('[rel*="noreferrer"]');
    // Leave `link_relations` at `null` if no attributes are found.
    if (noreferrer_link_relations.length > 0) {
      // Build dictionary of occurrences of tags.
      rp.link_relations = Object.fromEntries(
        Array.from(noreferrer_link_relations)
          .map(x => x.tagName)
          .reduce(
            // https://stackoverflow.com/a/57028486/7391782
            (acc, e) => acc.set(e, (acc.get(e) || 0) + 1),
            new Map()
          )
      );
    }
    return rp;
  })(),

  /**
   * Media devices
   * https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices
   */
  media_devices: {
    navigator_mediaDevices_enumerateDevices: testPropertyStringInResponseBodies(
      'mediaDevices.+enumerateDevices'
    ),
    navigator_mediaDevices_getUserMedia: testPropertyStringInResponseBodies(
      'mediaDevices.+getUserMedia'
    ),
    navigator_mediaDevices_getDisplayMedia: testPropertyStringInResponseBodies(
      'mediaDevices.+getDisplayMedia'
    ),
  },

  /**
   * Geolocation API
   * https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
   */
  geolocation: {
    navigator_geolocation_getCurrentPosition: testPropertyStringInResponseBodies(
      'geolocation.+getCurrentPosition'
    ),
    navigator_geolocation_watchPosition: testPropertyStringInResponseBodies(
      'geolocation.+watchPosition'
    ),
  },

  fingerprinting: (() => {
    //These are determined by looking at the tests in https://github.com/fingerprintjs/fingerprintjs
    const fingerprintingAPIs = [
      'ApplePaySession.canMakePayments',
      'getChannelData', //audioContext
      'toDataURL', //canvas
      'getImageData', //canvas, not actually used by fingerprintJS
      'screen.colorDepth',
      'color-gamut',
      'prefers-contrast',
      'cpuClass',
      'deviceMemory',
      'forced-colors',
      'hardwareConcurrency',
      'dynamic-range',
      'indexedDB',
      'inverted-colors',
      'navigator.language', //"language" would be too generic here
      'navigator.userLanguage', //TODO exists?
      'localStorage',
      'min-monochrome',
      'max-monochrome',
      'openDatabase',
      'navigator.oscpu',
      'pdfViewerEnabled',
      'navigator.platform', //"platform" would be too generic
      'navigator.plugins',
      'attributionSourceId',
      'prefers-reduced-motion',
      'prefers-reduced-transparency',
      'availWidth',
      'availHeight',
      'screen.width',
      'screen.height',
      'sessionStorage',
      'resolvedOptions().timeZone',
      'getTimezoneOffset',
      'maxTouchPoints',
      'ontouchstart',
      'navigator.vendor',
      'vendorUnmasked',
      'rendererUnmasked',
      'shadingLanguageVersion',
      'WEBGL_debug_renderer_info',
      'getShaderPrecisionFormat'
    ].map(api => api.toLowerCase())

    const response_bodies = $WPT_BODIES.filter(body => (body.response_body && (body.type === 'Document' || body.type === 'Script')))

    let fingerprintingUsageCounts = {}
    let likelyFingerprintingScripts = []

    response_bodies.forEach(req => {
      let total_occurrences = 0

      let body = req.response_body.toLowerCase()

      fingerprintingAPIs.forEach(api => {
        let api_occurrences = 0
        let index = body.indexOf(api)
        while (index !== -1) {
          api_occurrences++
          index = body.indexOf(api, index + 1)
        }

        if (api_occurrences > 0) {
          fingerprintingUsageCounts[api] = (fingerprintingUsageCounts[api] || 0) + api_occurrences
        }
        total_occurrences += api_occurrences
      })

      if (total_occurrences >= 5) { //TODO what should this threshold be?
        likelyFingerprintingScripts.push(req.url)
      }
    })

    return { counts: fingerprintingUsageCounts, likelyFingerprintingScripts }
  })(),

  /**
   * List of hostnames with CNAME record
   */
  request_hostnames_with_cname: (() => {
    let results = {};

    for (const request of $WPT_REQUESTS) {
      // Add try/catch in case "new URL" throws an exception
      try {
        request_hostname = (new URL(request.url)).hostname;

        for (const [origin, dns_info] of Object.entries($WPT_DNS)) {
          dns_hostname = (new URL(origin)).hostname;

          if (request_hostname == dns_hostname && request_hostname !== dns_info.results.canonical_names[0]) {
            results[dns_hostname] = dns_info.results.canonical_names;
          }
        }
      } catch { }
    }

    return results;
  })(),

  ccpa_link: (() => {
    const allowedCCPALinkPhrases = [
      //https://petsymposium.org/popets/2022/popets-2022-0030.pdf page 612
      'do not sell my personal information',
      'do not sell my information',
      'do not sell my info',
      'do not sell my personal info',
      'do not sell or share my personal information',
      'do not sell or share my information',
      'do not sell or share my info',
      'do not sell or share my personal info',
      //https://cppa.ca.gov/faq.html
      'your privacy choices',
      'your california privacy choices'
    ]

    // https://petsymposium.org/popets/2022/popets-2022-0030.pdf page 627
    const CCPAExclusionPhrases = [
      'terms',
      'user agreement',
      'service agreement',
      'conditions of use',
      'terms of usage',
      'privacy notice',
      'privacy policy',
      'privacy & cookies',
      'preferences',
      'terms of sale',
      'login',
      'terms and conditions apply',
      'accessibility',
      'your data in search',
      'shield',
      'promo',
      'campaign',
      'deal',
      'ad choice',
      'january',
      'february',
      'march',
      'april',
      'may',
      'june',
      'july',
      'august',
      'september',
      'october',
      'november',
      'december',
      'archive',
      'previous',
      'versions',
      'settings'
    ]

    const CCPALinks = Array.from(document.querySelectorAll('a')).filter(link => {
      const text = link.textContent.toLowerCase()
      return allowedCCPALinkPhrases.some(phrase => text.includes(phrase)) && !CCPAExclusionPhrases.some(phrase => text.includes(phrase))
    })

    return {
      hasCCPALink: CCPALinks.length > 0,
      CCPALinkPhrases: CCPALinks.map(link => link.textContent.trim().toLowerCase())
    }
  })()

});
