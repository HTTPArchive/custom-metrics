//[privacy-sandbox]
/**
 * Topics API
 * Protected Audience API
 * Attribution Reporting API
 *
 *
 * List of APIs verified by @yohhaan:
 * - FLoC API
 * - Topics API
 *
 * Required command line flags: --enable-features=BrowsingTopics,InterestGroupStorage,PrivacySandboxAdsAPIsOverride
 *
 * Documentation Permissions Policy: https://developers.google.com/privacy-sandbox/relevance/setup/web/permissions-policy
*/

let requests = $WPT_BODIES;

let result = { // alphabetical order for organization
  apiCallersAttestation: {}, // object {origin (string): true/false} Note: true does not especially mean that attestation file is valid (need to check if JSON, compliant with JSON schema, etc.)
  'attributionReportingAPI': {
    'attribution-reporting': document.featurePolicy.allowsFeature('attribution-reporting'),
    'attributionReportingEligibleHeader': {
      'sentByBrowser': false,
      'sentTo': [],
    },
    'completedRegistrations': {
      'AttributionReportingRegisterSourceHeader': {},
      'AttributionReportingRegisterTriggerHeader': []
    },
  },
  'federatedCredentialsManager': {
    // navigator.recordFederatedLogin
  },
  'fencedFrames': { // https://developers.google.com/privacy-sandbox/relevance/fenced-frame
    // window.HTMLFencedFrameElement
    // window.FencedFrameConfig
    // FencedFrameConfig.setSharedStorageContext
  },
  'floc': {// (deprecated API: are some still calling it?)
    'interest-cohort': document.featurePolicy.allowsFeature('interest-cohort'),
    'interestCohort': [],
  },
  'privateAggregation': {
    'private-aggregation': document.featurePolicy.allowsFeature('private-aggregation'),
  },
  'privateStateTokens': {// (previously Trust Tokens)
    'accessJs': []
    // document.hasTrustToken
    // document.hasRedemptionRecord
  },
  'protectedAudienceAPI': { // (previously FLEDGE)
    'join-ad-interest-group': document.featurePolicy.allowsFeature('join-ad-interest-group'),
    'run-ad-auction': document.featurePolicy.allowsFeature('run-ad-auction'),
    'interestGroups': {
      'joinAdInterestGroup': [],
      'leaveAdInterestGroup': [],
      'updateAdInterestGroups': [],
      'clearOriginJoinedAdInterestGroups': []
    },
    'runAdAuction': [],
    'generateBid': [],
    'scoreAd': [],
    'reportWin': [],
    'reportResult': []
  },
  'relatedWebsiteSet': {
    'top-level-storage-access': document.featurePolicy.allowsFeature('top-level-storage-access'),
    // document.hasStorageAccess
    // document.requestStorageAccess
    // document.requestStorageAccessFor
  },
  'sharedStorage': {
    'shared-storage': document.featurePolicy.allowsFeature('shared-storage'),
    'shared-storage-select-url': document.featurePolicy.allowsFeature('shared-storage-select-url'),
    //window.sharedStorage
  },
  'storageAccess': {
    'storage-access': document.featurePolicy.allowsFeature('storage-access'),
  },
  'topicsAPI': {
    'browsing-topics': document.featurePolicy.allowsFeature('browsing-topics'),
    'browsingTopicsJs': [],
    'browsingTopicsHeader': [],
    'skipObservation': []
  },
  'userAgentClientHints': {
    // https://developer.chrome.com/docs/privacy-security/user-agent-client-hints#user-agent-response-and-request-headers
    // https://wicg.github.io/client-hints-infrastructure/#policy-controlled-features
  },
}


/**
 * @function checkResponseBody
 * Check if provided pattern is present in the response body of the request
 * Check for Script and Document only (JS/HTML)
 *
 * @param {request} request - Request to search in body for pattern
 * @param {string} pattern - Regex pattern to match in response body.
 * @return {boolean} - True, if pattern found.
 */
function checkResponseBody(request, pattern) {
  const isScript = request.type === 'Script';
  const isDocument = request.type === 'Document';

  if (isScript || isDocument) {
    try {
      let re = new RegExp(pattern);
      if (request.response_body) {
        return re.test(request.response_body);
      } else {
        return false;
      }
    } catch (error) {
      return error.toString();
    }
  } else {
    return false;
  }
}

/**
 * @function fetchAndCheckResponse
 * Fetch url and if response returns true
 *
 * @param {string} url - url to fetch.
 * @return {boolean} - True, if response.
 */
async function fetchAndCheckResponse(url) {
  const controller = new AbortController();
  const { signal } = controller;
  setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, { signal, mode: 'no-cors' });
    return response ? true : false;
  } catch (error) {
    return false;
  }
}


/**
 * @function apiCallerAdd
 * Add provided caller API origin to results if not already present
 * Also check attestation file and set value to true if there is a request
 * response (note: does not especially mean that attestation file is valid)
 * Attestation is supposed to be under same https://origin than API caller, no redirect
 * https://github.com/privacysandbox/attestation
 * only required for attribution reporting, topics, protected audience, shared
 * storage, and private aggregation APIs so far
 * we check anyway if response returned for any caller of any API we detect (if
 * they call 1 API they are likely to call others too and so have that file published)
 *
 * @param {string} origin - API caller origin
 */
async function apiCallerAdd(origin) {
  if (!(origin in result.apiCallersAttestation)) {
    const attestation = fetchAndCheckResponse(`${'https://' + origin}/.well-known/privacy-sandbox-attestations.json`);
    result.apiCallersAttestation[origin] = attestation;
  }
}


(async () => {
  for (const request of requests) {
    const url = new URL(request.url);
    const requestDomain = url.hostname; //hostname of API caller is supposed to be website enrolled too for attestation

    let reqHeaders = new Map(Object.entries(request.request_headers).map(([key, value]) => [key.toLowerCase(), value]));
    let respHeaders = new Map(Object.entries(request.response_headers).map(([key, value]) => [key.toLowerCase(), value]));

    /***************************************************************************
     * For each API:
     * Name API
     * Documentation:
     * Test site(s):
     **************************************************************************/

    /***************************************************************************
     * Attribution Reporting API
     * https://developer.mozilla.org/en-US/docs/Web/API/Attribution_Reporting_API
     **************************************************************************/


    // Checking if the request header includes 'Attribution-Reporting-Eligible' to initiate the registration of source or trigger
    if (reqHeaders.has('attribution-reporting-eligible')) {
      result['attributionReportingAPI']['attributionReportingEligibleHeader']['sentTo'].push(requestDomain);
      await apiCallerAdd(requestDomain);
    }

    // Checking if the response header includes
    // 'Attribution-Reporting-Register-Source' or
    // 'Attribution-Reporting-Register-Trigger' to complete registration of
    // source or trigger Source registration happens on seller (e.g., publisher)
    // website where impression is registered and trigger registration happens
    // on buyer (e.g., advertiser) website where conversion completes. Each
    // entry in
    // result['attributionReportingAPI']['completedRegistrations']['AttributionReportingRegisterSourceHeader']
    // is represented as {requestDomain: {"destination": "", "eventEpsilon": 0}}
    // Higher the epsilon, the more the privacy protection
    if (respHeaders.has('attribution-reporting-register-source')) {
      jsonString = respHeaders.get('attribution-reporting-register-source');
      const { destination, event_level_epsilon } = JSON.parse(jsonString);
      if (!result['attributionReportingAPI']['completedRegistrations']['AttributionReportingRegisterSourceHeader'][requestDomain]) {
        result['attributionReportingAPI']['completedRegistrations']['AttributionReportingRegisterSourceHeader'][requestDomain] = [];
      }
      result['attributionReportingAPI']['completedRegistrations']['AttributionReportingRegisterSourceHeader'][requestDomain].push({ "destination": destination, "eventEpsilon": event_level_epsilon });
      await apiCallerAdd(requestDomain);
    } else if (respHeaders.has('attribution-reporting-register-trigger')) {
      result['attributionReportingAPI']['completedRegistrations']['AttributionReportingRegisterTriggerHeader'].push(requestDomain);
      await apiCallerAdd(requestDomain);
    }

    /***************************************************************************
     * Federated Credentials Manager
     * Documentation:
     * Test site(s):
     **************************************************************************/

    //Todo


    /***************************************************************************
     * Fenced Frames
     * Documentation:
     * Test site(s):
     **************************************************************************/

    //Todo

    /***************************************************************************
     * FLoC (deprecated - are some still calling it?))
     * Documentation: https://web.dev/articles/floc
     * Test site: https://floc.glitch.me/
     **************************************************************************/
    if (checkResponseBody(request, 'document.interestCohort')) {
      // [javascript] 'document.interestCohort()'
      result['floc']['interestCohort'].push(requestDomain);
      await apiCallerAdd(requestDomain);
    }

    /***************************************************************************
     * Private Aggregation
     * Documentation:
     * Test site(s):
     **************************************************************************/

    //Todo

    /***************************************************************************
     * Private State Tokens
     * Documentation:
     * Test site(s):
     **************************************************************************/

    //Todo

    /***************************************************************************
     * Protected Audience API (previously FLEDGE)
     * https://github.com/WICG/turtledove/blob/main/FLEDGE.md
     * https://developers.google.com/privacy-sandbox/relevance/protected-audience
     *
     * Test sites:
     * - https://protected-audience-demo.web.app/
     * - https://protected-audience-demo-advertiser.web.app/
     * - https://protected-audience-demo-publisher.web.app/
     **************************************************************************/

    if (checkResponseBody(request, 'joinAdInterestGroup')) {
      result['protectedAudienceAPI']['interestGroups']['joinAdInterestGroup'].push(requestDomain);
    }
    if (checkResponseBody(request, 'leaveAdInterestGroup')) {
      result['protectedAudienceAPI']['interestGroups']['leaveAdInterestGroup'].push(requestDomain);
    }
    if (checkResponseBody(request, 'updateAdInterestGroups')) {
      result['protectedAudienceAPI']['interestGroups']['updateAdInterestGroups'].push(requestDomain);
    }
    if (checkResponseBody(request, 'clearOriginJoinedAdInterestGroups')) {
      result['protectedAudienceAPI']['interestGroups']['clearOriginJoinedAdInterestGroups'].push(requestDomain);
    }
    if (checkResponseBody(request, 'runAdAuction')) {
      result['protectedAudienceAPI']['runAdAuction'].push(requestDomain);
    }
    if (checkResponseBody(request, 'generateBid')) {
      result['protectedAudienceAPI']['generateBid'].push(requestDomain);
    }
    if (checkResponseBody(request, 'scoreAd')) {
      result['protectedAudienceAPI']['scoreAd'].push(requestDomain);
    }
    if (checkResponseBody(request, 'reportWin')) {
      result['protectedAudienceAPI']['reportWin'].push(requestDomain);
    }
    if (checkResponseBody(request, 'reportResult') || request.response_body.includes('sendReportTo')) {
      result['protectedAudienceAPI']['reportResult'].push(requestDomain);
    }


    /***************************************************************************
     * Related Website Set
     * Documentation:
     * Test site(s):
     **************************************************************************/

    //Todo

    /***************************************************************************
     * Shared Storage
     * Documentation:
     * Test site(s):
     **************************************************************************/

    //Todo

    /***************************************************************************
     * Storage Access
     * Documentation:
     * Test site(s):
     **************************************************************************/

    //Todo

    /***************************************************************************
     * Topics API
     * API Usage Reference: https://developers.google.com/privacy-sandbox/relevance/topics/demo#the-topics-api-demo
     * Header Usage Reference: https://developers.google.com/privacy-sandbox/relevance/topics/demo#the-topics-api-demo
     * Test sites:
     *  - https://pets-animals-pets-cats.glitch.me/
     *  - https://tennis-tennis.glitch.me/
     *  - https://www.operafootball.com/
     **************************************************************************/
    let topicsCallJs = false;
    let topicsCallHeader = false;
    let skipObservation = true;

    if (checkResponseBody(request, 'document.browsingTopics\(\s*\)')) {
      // [javascript] 'document.browsingTopics()'
      topicsCallJs = true;
    } else if (checkResponseBody(request, 'document.browsingTopics\(\s*{\s*skipObservation\s*:\s*true\s*}\s*\)')) {
      // [javascript] 'document.browsingTopics({skipObservation:true})'
      topicsCallJs = true;
    } else if (checkResponseBody(request, 'browsingTopics') || checkResponseBody(request, 'deprecatedBrowsingTopics')) {
      // [fetch] '{browsingTopics: true}'
      // [XHR] '{deprecatedBrowsingTopics: true}' (to be deprecated)
      topicsCallJs = true;
    } else if (reqHeaders.has('sec-browsing-topics')) {
      // [request header] 'Sec-Browsing-Topics: true'
      topicsCallHeader = true;
    }
    // [response header] 'Observe-Browsing-Topics: ?1' to include page in topics calculation
    if (respHeaders.has('observe-browsing-topics') && respHeaders.get('observe-browsing-topics') === "?1") {
        skipObservation = false;
    }

    /** Update result
     * Todo / Note: we may want to switch to object instead of array, so that API
     * caller appears only once ? if so, we could also get rid of skipObservation
     * by encoding in object for key = requestDomain, the value = skipObservation
     * (same for other APIs)
     */
    if (topicsCallJs) {
      result['topicsAPI']['browsingTopicsJs'].push(requestDomain)
      await apiCallerAdd(requestDomain);
    }
    if (topicsCallHeader) {
      result['topicsAPI']['browsingTopicsHeader'].push(requestDomain)
      await apiCallerAdd(requestDomain);
    }
    if (skipObservation) {
      result['topicsAPI']['skipObservation'].push(requestDomain)
    }

    /***************************************************************************
     * User Client Hints
     * Documentation:
     * Test site(s):
     **************************************************************************/

    //Todo

  }


  // After going through all requests
  // if "Attribution-Reporting-Eligible" request header is sent to more than one
  // domains, set sentByBrowser to true
  if (result['attributionReportingAPI']['attributionReportingEligibleHeader']['sentTo'].length > 0) {
    result['attributionReportingAPI']['attributionReportingEligibleHeader']['sentByBrowser'] = true;
  }


})();

return result;
