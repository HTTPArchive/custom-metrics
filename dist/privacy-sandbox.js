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
    }
  },
  'federatedCredentialsManager': {
    // navigator.recordFederatedLogin
  },
  'fencedFrames': { // https://developers.google.com/privacy-sandbox/relevance/fenced-frame
    // window.HTMLFencedFrameElement
    // window.FencedFrameConfig
    // FencedFrameConfig.setSharedStorageContext
    // 'setSharedStorageContext': []
  },
  'floc': {// (deprecated API: are some still calling it?)
    'interest-cohort': document.featurePolicy.allowsFeature('interest-cohort'),
    'interestCohort': [],
  },
  'privateAggregation': {
    'private-aggregation': document.featurePolicy.allowsFeature('private-aggregation'),
    'contributeToHistogram': [],
    'contributeToHistogramOnEvent': [],
    'enableDebugMode': []
  },
  'privateStateTokens': {// (previously Trust Tokens)
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
    'hasStorageAccess': [],
    'hasUnpartitionedCookieAccess': [],
    'requestStorageAccess': [],
    'requestStorageAccessFor': []
  },
  'sharedStorage': {
    'shared-storage': document.featurePolicy.allowsFeature('shared-storage'),
    'shared-storage-select-url': document.featurePolicy.allowsFeature('shared-storage-select-url'),
    'append': [],
    'clear': [],
    'delete': [],
    'set': [],
    'run': [],
    'selectURL': [],
    'addModule': [],
    // worklet methods discarded as we will catch who create such worklet by
    // detecting addMoudle, run, etc.
  },
  'storageAccess': {
    'storage-access': document.featurePolicy.allowsFeature('storage-access'),
  },
  'topicsAPI': {
    'browsing-topics': document.featurePolicy.allowsFeature('browsing-topics'),
    'browsingTopicsJs': [],
    'browsingTopicsHeader': [],
  },
  // 'userAgentClientHints': { // privacy chapter decided to implement in BQ
  // https://developer.chrome.com/docs/privacy-security/user-agent-client-hints#user-agent-response-and-request-headers
  // https://wicg.github.io/client-hints-infrastructure/#policy-controlled-features
  // },
}


/**
 * @function checkResponseBody
 * Check if provided pattern or string is present in the response body of the request
 * Check for Script and Document only (JS/HTML)
 *
 * @param {request} request - Request to search in body for pattern
 * @param {string} pattern - Regex pattern to match in response body
 * @param {boolean} isRegex - True, if pattern is regex
 * @return {boolean} - True, if pattern found
 */
function checkResponseBody(request, pattern, isRegex = true) {
  const isScript = request.type === 'Script';
  const isDocument = request.type === 'Document';

  if ((isScript || isDocument) && request.response_body) {
    try {
      if (isRegex) {
        let re = new RegExp(pattern);
        return re.test(request.response_body);
      } else {
        return request.response_body.includes(pattern);
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
 *
 * @param {string} origin - API caller origin
 */
function apiCallerAdd(origin) {
  if (!(origin in result.apiCallersAttestation)) {
    result.apiCallersAttestation[origin] = null;
  }
}

/**
 * @function fetchAttestations
 * Check attestation file and set value to true if there is a request
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
async function fetchAttestations() {
  for (const [origin, _] of Object.entries(result.apiCallersAttestation)) {
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
      apiCallerAdd(requestDomain);
    }

    // Checking if the response header includes
    // 'Attribution-Reporting-Register-Source' or 'Attribution-Reporting-Register-Trigger'
    // to complete registration of source or trigger
    // Source registration happens on seller (e.g., publisher) website where impression is registered and
    // Trigger registration happens on buyer (e.g., advertiser) website where conversion completes.
    // Each entry in result['attributionReportingAPI']['completedRegistrations']['AttributionReportingRegisterSourceHeader']
    // is represented as {requestDomain: {"destination": "", "eventEpsilon": 0}}
    // Higher the epsilon, the more the privacy protection
    if (respHeaders.has('attribution-reporting-register-source')) {
      const { destination, event_level_epsilon } = JSON.parse(respHeaders.get('attribution-reporting-register-source'));
      if (!result['attributionReportingAPI']['completedRegistrations']['AttributionReportingRegisterSourceHeader'][requestDomain]) {
        result['attributionReportingAPI']['completedRegistrations']['AttributionReportingRegisterSourceHeader'][requestDomain] = [];
      }
      result['attributionReportingAPI']['completedRegistrations']['AttributionReportingRegisterSourceHeader'][requestDomain].push({ "destination": destination, "eventEpsilon": event_level_epsilon });
      apiCallerAdd(requestDomain);
    } else if (respHeaders.has('attribution-reporting-register-trigger')) {
      result['attributionReportingAPI']['completedRegistrations']['AttributionReportingRegisterTriggerHeader'].push(requestDomain);
      apiCallerAdd(requestDomain);
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
    if (checkResponseBody(request, 'document.interestCohort\(\s*\)')) {
      // [javascript] 'document.interestCohort()'
      result['floc']['interestCohort'].push(requestDomain);
      apiCallerAdd(requestDomain);
    }

    /***************************************************************************
     * Private Aggregation
     * Documentation: https://developers.google.com/privacy-sandbox/relevance/private-aggregation
     * Test site(s): see https://shared-storage-demo.web.app/
     **************************************************************************/

    if (checkResponseBody(request, 'privateAggregation.contributeToHistogram\(')) {
      // [javascript] 'privateAggregation.contributeToHistogram({ bucket: <bucket>, value: <value> })'
      result['privateAggregation']['contributeToHistogram'].push(requestDomain);
      apiCallerAdd(requestDomain);
    }
    if (checkResponseBody(request, 'privateAggregation.contributeToHistogramOnEvent\(')) {
      // [javascript] 'privateAggregation.reportContributionForEvent(eventType, contribution)'
      result['privateAggregation']['contributeToHistogramOnEvent'].push(requestDomain);
      apiCallerAdd(requestDomain);
    }
    if (checkResponseBody(request, 'privateAggregation.enableDebugMode\(')) {
      // [javascript] 'privateAggregation.enableDebugMode({ <debugKey: debugKey> })'
      result['privateAggregation']['enableDebugMode'].push(requestDomain);
      apiCallerAdd(requestDomain);
    }

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

    if (checkResponseBody(request, 'joinAdInterestGroup', false)) {
      result['protectedAudienceAPI']['interestGroups']['joinAdInterestGroup'].push(requestDomain);
      apiCallerAdd(requestDomain);
    }
    if (checkResponseBody(request, 'leaveAdInterestGroup', false)) {
      result['protectedAudienceAPI']['interestGroups']['leaveAdInterestGroup'].push(requestDomain);
      apiCallerAdd(requestDomain);
    }
    if (checkResponseBody(request, 'updateAdInterestGroups', false)) {
      result['protectedAudienceAPI']['interestGroups']['updateAdInterestGroups'].push(requestDomain);
      apiCallerAdd(requestDomain);
    }
    if (checkResponseBody(request, 'clearOriginJoinedAdInterestGroups', false)) {
      result['protectedAudienceAPI']['interestGroups']['clearOriginJoinedAdInterestGroups'].push(requestDomain);
      apiCallerAdd(requestDomain);
    }
    if (checkResponseBody(request, 'runAdAuction', false)) {
      result['protectedAudienceAPI']['runAdAuction'].push(requestDomain);
      apiCallerAdd(requestDomain);
    }
    if (checkResponseBody(request, 'generateBid', false)) {
      result['protectedAudienceAPI']['generateBid'].push(requestDomain);
      apiCallerAdd(requestDomain);
    }
    if (checkResponseBody(request, 'scoreAd', false)) {
      result['protectedAudienceAPI']['scoreAd'].push(requestDomain);
      apiCallerAdd(requestDomain);
    }
    if (checkResponseBody(request, 'reportWin', false)) {
      result['protectedAudienceAPI']['reportWin'].push(requestDomain);
      apiCallerAdd(requestDomain);
    }
    if (checkResponseBody(request, 'reportResult', false) || request.response_body.includes('sendReportTo', false)) {
      result['protectedAudienceAPI']['reportResult'].push(requestDomain);
      apiCallerAdd(requestDomain);
    }


    /***************************************************************************
     * Related Website Set
     * Documentation: https://developer.mozilla.org/en-US/docs/Web/API/Storage_Access_API
     * Test site(s):
     **************************************************************************/

    if (checkResponseBody(request, 'document.hasStorageAccess\(\s*\)')) {
      // [javascript] document.hasStorageAccess()
      result['relatedWebsiteSet']['hasStorageAccess'].push(requestDomain);
      apiCallerAdd(requestDomain);
    }

    if (checkResponseBody(request, 'document.hasUnpartitionedCookieAccess\(\s*\)')) {
      // [javascript] document.hasUnpartitionedCookieAccess()
      result['relatedWebsiteSet']['hasUnpartitionedCookieAccess'].push(requestDomain);
      apiCallerAdd(requestDomain);
    }

    if (checkResponseBody(request, 'document.requestStorageAccess\(')) {
      // [javascript] document.requestStorageAccess(types: optional)
      result['relatedWebsiteSet']['requestStorageAccess'].push(requestDomain);
      apiCallerAdd(requestDomain);
    }

    if (checkResponseBody(request, 'document.requestStorageAccessFor\(')) {
      // [javascript] document.requestStorageAccessFor(requestedOrigin)
      result['relatedWebsiteSet']['requestStorageAccessFor'].push(requestDomain);
      apiCallerAdd(requestDomain);
    }

    /***************************************************************************
     * Shared Storage
     * Documentation: https://developer.mozilla.org/en-US/docs/Web/API/SharedStorage
     * Test site(s):
     * - https://shared-storage-demo.web.app/
     *
     **************************************************************************/
    // SharedStorage
    if (checkResponseBody(request, 'window.sharedStorage.append\(')) {
      // [javascript] window.sharedStorage.append(key, value)
      result['sharedStorage']['append'].push(requestDomain);
      apiCallerAdd(requestDomain);
    }
    if (checkResponseBody(request, 'window.sharedStorage.clear\(\s*\)')) {
      // [javascript] window.sharedStorage.clear()
      result['sharedStorage']['clear'].push(requestDomain);
      apiCallerAdd(requestDomain);
    }
    if (checkResponseBody(request, 'window.sharedStorage.delete\(')) {
      // [javascript] window.sharedStorage.delete(key)
      result['sharedStorage']['delete'].push(requestDomain);
      apiCallerAdd(requestDomain);
    }
    if (checkResponseBody(request, 'window.sharedStorage.set\(')) {
      // [javascript] window.sharedStorage.set(key, value, options)
      result['sharedStorage']['set'].push(requestDomain);
      apiCallerAdd(requestDomain);
    }

    // WindowSharedStorage
    if (checkResponseBody(request, 'window.sharedStorage.run\(')) {
      // [javascript] window.sharedStorage.run(name, options)
      result['sharedStorage']['run'].push(requestDomain);
      apiCallerAdd(requestDomain);
    }
    if (checkResponseBody(request, 'window.sharedStorage.selectURL\(')) {
      // [javascript] window.sharedStorage.run(name, urls, options)
      result['sharedStorage']['selectURL'].push(requestDomain);
      apiCallerAdd(requestDomain);
    }

    if (checkResponseBody(request, 'window.sharedStorage.worklet.addModule\(')) {
      // [javascript] window.sharedStorage.worklet.addModule()
      result['sharedStorage']['addModule'].push(requestDomain);
      apiCallerAdd(requestDomain);
    }

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

    if (checkResponseBody(request, 'document.browsingTopics\(\s*\)')) {
      // [javascript] 'document.browsingTopics()'
      result['topicsAPI']['browsingTopicsJs'].push({ "origin": requestDomain, "skipObservation": false });
      apiCallerAdd(requestDomain);
    }
    if (checkResponseBody(request, 'document.browsingTopics\(\s*\{\s*skipObservation\s*:\s*true\s*\}\s*\)')) {
      // [javascript] 'document.browsingTopics({skipObservation:true})'
      result['topicsAPI']['browsingTopicsJs'].push({ "origin": requestDomain, "skipObservation": true });
      apiCallerAdd(requestDomain);
    }
    if (checkResponseBody(request, '\{\s*browsingTopics\s*:\s*true\s*\}') || checkResponseBody(request, '\{\s*deprecatedBrowsingTopics\s*:\s*true\s*\}')) {
      // [fetch] '{browsingTopics: true}'
      // [XHR] '{deprecatedBrowsingTopics: true}' (to be deprecated)
      if (respHeaders.has('observe-browsing-topics') && respHeaders.get('observe-browsing-topics') === "?1") {
        // [response header] 'Observe-Browsing-Topics: ?1' to include page in topics calculation
        result['topicsAPI']['browsingTopicsJs'].push({ "origin": requestDomain, "skipObservation": false });
        apiCallerAdd(requestDomain);
      } else {
        result['topicsAPI']['browsingTopicsJs'].push({ "origin": requestDomain, "skipObservation": true });
        apiCallerAdd(requestDomain);
      }
    }

    if (reqHeaders.has('sec-browsing-topics')) {
      // [request header] 'Sec-Browsing-Topics: true'
      if (respHeaders.has('observe-browsing-topics') && respHeaders.get('observe-browsing-topics') === "?1") {
        // [response header] 'Observe-Browsing-Topics: ?1' to include page in topics calculation
        result['topicsAPI']['browsingTopicsHeader'].push({ "origin": requestDomain, "skipObservation": false });
        apiCallerAdd(requestDomain);
      } else {
        result['topicsAPI']['browsingTopicsHeader'].push({ "origin": requestDomain, "skipObservation": true });
        apiCallerAdd(requestDomain);
      }
    }


    /***************************************************************************
     * User Client Hints
     * Documentation:
     * Test site(s):
     **************************************************************************/

    //Todo
    // privacy chapter decided to implement in BQ

  }


  // After going through all requests
  // if "Attribution-Reporting-Eligible" request header is sent to more than one
  // domains, set sentByBrowser to true
  if (result['attributionReportingAPI']['attributionReportingEligibleHeader']['sentTo'].length > 0) {
    result['attributionReportingAPI']['attributionReportingEligibleHeader']['sentByBrowser'] = true;
  }

  //fetch attestation files
  //TODO: check that it actually returns something (figure out promise/async/await, etc.)
  fetchAttestations();

})();

return result;

