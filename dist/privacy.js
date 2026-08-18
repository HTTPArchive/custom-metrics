//[privacy]
// Uncomment the previous line for testing on webpagetest.org

/**
 * Privacy custom metrics evaluated on page crawl.
 *
 * @typedef {Object} PrivacyMetrics
 * @property {IABTCFv1} iab_tcf_v1 - IAB Transparency and Consent Framework v1 settings and vendor consents. See [IAB TCF v1.1](https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework/blob/master/CMP%20JS%20API%20v1.1%20Final.md).
 * @property {IABTCFv2} iab_tcf_v2 - IAB Transparency and Consent Framework v2 settings and vendor consents. See [IAB TCF v2](https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework/blob/master/TCFv2/IAB%20Tech%20Lab%20-%20CMP%20API%20v2.md).
 * @property {IABGPP} iab_gpp - Global Privacy Platform (GPP) ping response data. See [Global-Privacy-Platform](https://github.com/InteractiveAdvertisingBureau/Global-Privacy-Platform).
 * @property {IABUSP} iab_usp - IAB US Privacy User Signal Mechanism (USP API) data. See [USPrivacy](https://github.com/InteractiveAdvertisingBureau/USPrivacy).
 * @property {boolean} navigator_doNotTrack - Whether the browser's "Do Not Track" setting was accessed or detected in response bodies. See [EFF Do Not Track](https://www.eff.org/issues/do-not-track).
 * @property {boolean} navigator_globalPrivacyControl - Whether the Global Privacy Control (GPC) property was accessed or detected in response bodies. See [Global Privacy Control](https://globalprivacycontrol.org/).
 * @property {boolean} document_permissionsPolicy - Whether document Permissions Policy is referenced in response bodies. See [W3C Permissions Policy](https://www.w3.org/TR/permissions-policy-1/#introspection).
 * @property {boolean} document_featurePolicy - Whether document Feature Policy (legacy Permissions Policy) is referenced in response bodies.
 * @property {ReferrerPolicyData} referrerPolicy - Referrer policy declared for the entire document, subresource requests, or link relations. See [MDN Referrer-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy).
 * @property {Object.<string, string[]>} request_hostnames_with_cname - Mapping of request hostnames to their canonical CNAME chains.
 * @property {CCPAData} ccpa_link - California Consumer Privacy Act (CCPA) compliance links detection. See [CPPA FAQ](https://cppa.ca.gov/faq.html).
 * @property {IABDataDeletionRequest} iab_ddr - IAB Data Deletion Request Framework response data. See [Data Deletion Request Framework](https://github.com/InteractiveAdvertisingBureau/Data-Subject-Rights/blob/main/Data%20Deletion%20Request%20Framework.md).
 */

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
 * IAB Data Deletion Request Framework response
 *
 * @typedef {Object} IABDataDeletionRequest
 * @property {boolean} present - Whether the `/dsrdelete.json` endpoint exists and returns valid JSON.
 * @property {integer} status - HTTP status code of the `/dsrdelete.json` request.
 * @property {boolean} [redirected] - Whether the request was redirected.
 * @property {Object[]} [identifiers] - Sanitized identifiers supported for data deletion requests.
 * @property {string} [endpointOrigin] - Target origin if redirected.
 * @property {boolean} [vendorScriptPresent] - Whether vendor script is declared.
 * @property {boolean} [vendorScriptRequirement] - Whether vendor script requirement is declared.
 * @property {string} [error] - Error message if request or parsing failed.
 */

/**
 * Parses the response from a DSR delete request.
 * @param {string} url - The URL requested.
 * @param {Response} response - The response object from the fetch request.
 * @returns {IABDataDeletionRequest} A promise that resolves to an object containing the parsed response data.
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
   *
   * @typedef {Object} IABTCFv1
   * @property {boolean} present - Whether the `__cmp` API function is present on the window object.
   * @property {Object} [data] - TCF v1 vendor consents data returned by `getVendorConsents`. See [VendorConsents](https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework/blob/master/CMP%20JS%20API%20v1.1%20Final.md#vendorconsents-).
   * @property {boolean} [compliant_setup] - Verifies whether the TCF v1 CMP setup is compliant with IAB standards.
   */
  iab_tcf_v1: (() => {
    let consentData = {
      present: typeof window.__cmp == 'function',
    };
    try {
      if (consentData.present) {
        window.__cmp('getVendorConsents', null, (result, success) => {
          if (success) {
            consentData.data = result;
            consentData.compliant_setup = true;
          } else {
            // special case for consentmanager ('CMP settings are used that are not compliant with the IAB TCF')
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
   *
   * @typedef {Object} IABTCFv2
   * @property {boolean} present - Whether the `__tcfapi` API function is present on the window object.
   * @property {Object} [data] - TCF v2 vendor consents data returned by `getTCData`. See [TCData](https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework/blob/master/TCFv2/IAB%20Tech%20Lab%20-%20CMP%20API%20v2.md#tcdata).
   * @property {boolean} [compliant_setup] - Verifies whether the TCF v2 CMP setup is compliant with IAB standards.
   */
  iab_tcf_v2: (() => {
    let tcData = {
      present: typeof window.__tcfapi == 'function',
    };
    try {
      if (tcData.present) {
        window.__tcfapi('getTCData', 2, (result, success) => {
          if (success) {
            tcData.data = result;
            tcData.compliant_setup = true;
          } else {
            // special case for consentmanager ('CMP settings are used that are not compliant with the IAB TCF')
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
   *
   * @typedef {Object} IABGPP
   * @property {boolean} present - Whether the `__gpp` API function is present on the window object.
   * @property {Object} [data] - Ping response data returned by the `__gpp` API.
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
   *
   * @typedef {Object} IABUSP
   * @property {boolean} present - Whether the `__uspapi` API function is present on the window object.
   * @property {string} [privacy_string] - US Privacy string returned by `getUSPData`.
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
   */
  navigator_doNotTrack: testPropertyStringInResponseBodies('doNotTrack'),

  /**
   * Global Privacy Control
   */
  navigator_globalPrivacyControl: testPropertyStringInResponseBodies(
    'globalPrivacyControl'
  ),

  // Sensitive resources

  /**
   * Permissions policy
   */
  document_permissionsPolicy: testPropertyStringInResponseBodies('document.+permissionsPolicy'),
  document_featurePolicy: testPropertyStringInResponseBodies('document.+featurePolicy'),

  /**
   * @typedef {Object} ReferrerPolicyRequestEntry
   * @property {string} tagName - HTML tag name of the element (e.g., IMG, SCRIPT).
   * @property {string} referrerpolicy - Value of the referrerpolicy attribute.
   * @property {integer} count - Number of occurrences on the page.
   */

  /**
   * Referrer Policy
   *
   * @typedef {Object} ReferrerPolicyData
   * @property {string|null} entire_document_policy - Referrer policy set for the entire document using meta tag.
   * @property {ReferrerPolicyRequestEntry[]|null} individual_requests - Referrer policies specified on individual elements via referrerpolicy attribute.
   * @property {Object.<string, integer>|null} link_relations - Count of elements specifying rel="noreferrer" grouped by HTML tag name.
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

  /**
   * California Consumer Privacy Act (CCPA) compliance
   *
   * @typedef {Object} CCPAData
   * @property {boolean} hasCCPALink - Whether links matching CCPA opt-out criteria were found on the page.
   */
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


let iab_ddr = fetchAndParse("/dsrdelete.json", parseDSRdelete);

return Promise.all([iab_ddr]).then(([iab_ddr]) => {
  return JSON.stringify({
    ...sync_metrics,
    ...{ iab_ddr: iab_ddr }
  });
});
