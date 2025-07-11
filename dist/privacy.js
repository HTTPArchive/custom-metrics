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

/**
   * @param {string} url - The URL to fetch.
   * @param {function} parser - The function to parse the response.
   * @returns {Promise<Object>} The parsed response or an error object.
   */
const fetchAndParse = async (url, parser) => {
  const timeout = 5000;
  const controller = new AbortController();
  const { signal } = controller;
  setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal });
    return parser(url, await response);
  } catch (error) {
    return {
      status: -1,
      present: false,
      error: error.message
    };
  }
};

/**
 * Parses the response from a DSR delete request.
 * @param {Response} response - The response object from the fetch request.
 * @returns {Promise<Object>} A promise that resolves to an object containing the parsed response data.
 */
const parseDSRdelete = (url, response) => {
  let result = {
    present: response.ok && response.url.endsWith(url) && response.headers.get('content-type') === 'application/json',
    status: response.status,
  };
  Object.assign(result, result.present ? { redirected: response.redirected } : {});

  try {
    let content = JSON.parse(response.text());
    if (result.present && content) {
      for (const element of content.identifiers) {
        delete element.id;
      }
      Object.assign(result, content.identifiers ? { identifiers: content.identifiers } : {});
      Object.assign(result, response.redirected ? { endpointOrigin: new URL(content.endpoint).origin } : {});
      Object.assign(result, content.vendorScript ? { vendorScriptPresent: true } : {});
      Object.assign(result, content.vendorScriptRequirement ? { vendorScriptRequirement: true } : {});
    }
  } catch (error) {
    Object.assign(result, result.present ? { error: error.message } : {});
  }

  return result;
}

let sync_metrics = {
  // Consent Management Platforms

  /**
   * IAB Transparency and Consent Framework v1
   * https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework/blob/master/CMP%20JS%20API%20v1.1%20Final.md
   */
  iab_tcf_v1: (() => {
    let consentData = {
      present: typeof window.__cmp == 'function',
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
    } catch {
      // continue regardless of error
    }

    return consentData;
  })(),

  /**
   * IAB Transparency and Consent Framework v2
   * https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework/blob/master/TCFv2
   */
  iab_tcf_v2: (() => {
    let tcData = {
      present: typeof window.__tcfapi == 'function',
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
    } catch {
      // continue regardless of error
    }

    return tcData;

  })(),

  /**
   * Global Privacy Protocol (GPP)
   * https://github.com/InteractiveAdvertisingBureau/Global-Privacy-Platform
   */
  iab_gpp: (() => {
    let gppData = {
      present: typeof window.__gpp == 'function',
    };
    try {
      if (gppData.present) {
        window.__gpp('ping', (result, success) => {
          if (success) {
            gppData.data = result;
          }
        });
      }
    } catch {
      // continue regardless of error
    }

    return gppData;
  })(),

  /**
   * IAB US Privacy User Signal Mechanism “USP API”
   * https://github.com/InteractiveAdvertisingBureau/USPrivacy
   */
  iab_usp: (() => {
    let uspData = {
      present: typeof window.__uspapi == 'function',
    };
    try {
      if (uspData.present) {
        window.__uspapi('getUSPData', 1, (result, success) => {
          if (success) {
            uspData.privacy_string = result;
          }
        });
      }
    } catch {
      // continue regardless of error
    }

    return uspData;
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
   * List of hostnames with CNAME record
   */
  request_hostnames_with_cname: (() => {
    let results = {};

    for (const request of $WPT_REQUESTS) {
      // Add try/catch in case "new URL" throws an exception
      try {
        let request_hostname = (new URL(request.url)).hostname;

        for (const [origin, dns_info] of Object.entries($WPT_DNS)) {
          let dns_hostname = (new URL(origin)).hostname;

          if (request_hostname == dns_hostname && request_hostname !== dns_info.results.canonical_names[0]) {
            results[dns_hostname] = dns_info.results.canonical_names;
          }
        }
      } catch {
        // continue regardless of error
      }
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

    let CCPAdata = {
      hasCCPALink: CCPALinks.length > 0,
    };

    return CCPAdata
  })()

};


/**
  * IAB: Data Deletion Request Framework
  * https://github.com/InteractiveAdvertisingBureau/Data-Subject-Rights/blob/main/Data%20Deletion%20Request%20Framework.md
  */
let iab_ddr = fetchAndParse("/dsrdelete.json", parseDSRdelete);

return Promise.all([iab_ddr]).then(([iab_ddr]) => {
  return JSON.stringify({
    ...sync_metrics,
    ...{ iab_ddr: iab_ddr }
  });
});
