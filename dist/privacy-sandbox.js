//[privacy-sandbox]
/**
 * Attribution Reporting API
 * Federated Credentials Manager API
 * Fenced Frames API
 * FLoC API
 * Protected Audience API
 * Private Aggregation API
 * Private State Tokens API
 * Shared Storage API
 * Storage Access API
 * Topics API
 * User Client Hints
 *
 * Required command line flags: --enable-features=BrowsingTopics,InterestGroupStorage,PrivacySandboxAdsAPIsOverride
 */

let requests = $WPT_BODIES;

let result = { // alphabetical order for organization
  apiCallersAttestation: {}, // object {domain (string): true/false} Note: true does not especially mean that attestation file is valid (need to check if JSON, compliant with JSON schema, etc.)
  permissionsPolicy: { // Documentation Permissions Policy: https://developers.google.com/privacy-sandbox/relevance/setup/web/permissions-policy
    'attribution-reporting': document.featurePolicy.allowsFeature('attribution-reporting'),
    'browsing-topics': document.featurePolicy.allowsFeature('browsing-topics'),
    'identity-credentials-get': document.featurePolicy.allowsFeature('identity-credentials-get'),
    'interest-cohort': document.featurePolicy.allowsFeature('interest-cohort'),
    'join-ad-interest-group': document.featurePolicy.allowsFeature('join-ad-interest-group'),
    'private-aggregation': document.featurePolicy.allowsFeature('private-aggregation'),
    'run-ad-auction': document.featurePolicy.allowsFeature('run-ad-auction'),
    'shared-storage': document.featurePolicy.allowsFeature('shared-storage'),
    'shared-storage-select-url': document.featurePolicy.allowsFeature('shared-storage-select-url'),
    'storage-access': document.featurePolicy.allowsFeature('storage-access'),
    'top-level-storage-access': document.featurePolicy.allowsFeature('top-level-storage-access'),
  },
  'attributionReportingAPI': {
    'attributionReportingEligibleHeader': {
      'sentByBrowser': false,
      'sentTo': [],
    },
    'completedRegistrations': {
      'AttributionReportingRegisterSourceHeader': {},
      'AttributionReportingRegisterTriggerHeader': []
    }
  },
  'fedCM': [],
  'fencedFrames': [],
  'floc': [],// (deprecated API: are some still calling it?)
  'privateAggregation': [],
  'privateStateTokens': [], // (previously Trust Tokens)
  'protectedAudienceAPI': { // (previously FLEDGE)
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
  'sharedStorage': [],
  'storageAccess': [],
  'topicsAPI': [],
  'userAgentClientHints': [] // privacy chapter decided to implement in BQ, but it could be easier to do it here directly
  // https://developer.chrome.com/docs/privacy-security/user-agent-client-hints#user-agent-response-and-request-headers
  // https://wicg.github.io/client-hints-infrastructure/#policy-controlled-features
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
 * @function getDomain
 * Get cannonical domain from URL for attestation check
 *
 * @param {string} url - request URL to get domain from
 */
function getDomain(url) {
  const hostname = new URL(url).hostname;
  const parts = hostname.split('.');

  // Second level labels with >150K requests in all.requests
  const secondLevelLabels = ['com', 'co', 'edu', 'gov', 'org', 'ac', 'or', 'go', 'gob', 'net', 'ne', 'sch', 'in'];

  if (parts.length <= 2) {
    return hostname;
  } else if (secondLevelLabels.includes(parts.at(-2))) {
    return parts.slice(-3).join('.');
  } else {
    return parts.slice(-2).join('.');
  }
}



/**
 * @function apiCallerAdd
 * Add provided caller API domain to results if not already present
 *
 * @param {string} domain - API caller domain
 */
function apiCallerAdd(domain) {
  if (!(domain in result.apiCallersAttestation)) {
    result.apiCallersAttestation[domain] = null;
  }
}



/**
 * @function fetchAttestations
 * Check attestation file and set value to true if there is a request
 * response (note: does not especially mean that attestation file is valid)
 * Attestation is supposed to be under same https://domain than API caller, no redirect
 * https://github.com/privacysandbox/attestation
 * only required for attribution reporting, topics, protected audience, shared
 * storage, and private aggregation APIs so far
 * we check anyway if response returned for any caller of any API we detect (if
 * they call 1 API they are likely to call others too and so have that file published)
 *
 * @param {string} domain - API caller domain
 */
async function fetchAttestations() {
  for (const [domain, _] of Object.entries(result.apiCallersAttestation)) {
    const attestation = fetchAndCheckResponse(`${'https://' + domain}/.well-known/privacy-sandbox-attestations.json`);
    result.apiCallersAttestation[domain] = attestation;
  }
}



(async () => {
  for (const request of requests) {
    const url = new URL(request.url);
    const requestDomain = url.hostname; //hostname of API caller is supposed to be website enrolled too for attestation
    const cannonicalRequestDomain = getDomain(url);
    apiCallerAdd(cannonicalRequestDomain);

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
    } else if (respHeaders.has('attribution-reporting-register-trigger')) {
      result['attributionReportingAPI']['completedRegistrations']['AttributionReportingRegisterTriggerHeader'].push(requestDomain);
    }

    /***************************************************************************
     * Federated Credentials Manager
     * Documentation: https://developer.mozilla.org/en-US/docs/Web/API/FedCM_API
     * Test site(s):
     * - https://fedcm-rp-demo.glitch.me/
     * - https://fedcm-idp-demo.glitch.me/
     **************************************************************************/

    if (checkResponseBody(request, 'navigator.credentials.get\(')) {
      // [javascript] 'navigator.credentials.get(options)'
      result['fedCM'].push({ "domain": requestDomain, "api": 'get' });
    }
    if (checkResponseBody(request, 'IdentityProvider.getUserInfo\(')) {
      // [javascript] 'IdentityProvider.getUserInfo(config)'
      result['fedCM'].push({ "domain": requestDomain, "api": 'getUserInfo' });
    }
    if (checkResponseBody(request, 'IdentityProvider.close\(\s*\)')) {
      // [javascript] 'IdentityProvider.close()'
      result['fedCM'].push({ "domain": requestDomain, "api": 'close' });
    }
    if (checkResponseBody(request, 'navigator.login.setStatus\(')) {
      // [javascript] 'navigator.login.setStatus(status)'
      result['fedCM'].push({ "domain": requestDomain, "api": 'setStatus' });
    }

    /***************************************************************************
     * Fenced Frames
     * Documentation: https://developer.mozilla.org/en-US/docs/Web/API/Fenced_frame_API
     * Test site(s):
     * - check on sharedStorage demo https://shared-storage-demo.web.app/
     **************************************************************************/

    if (checkResponseBody(request, 'document.createElement\("fencedframe"\)')) {
      // [javascript] 'document.createElement("fencedframe");'
      result['fencedFrame'].push({ "domain": requestDomain, "api": 'fencedFrameJs' });
    }
    if (checkResponseBody(request, 'setSharedStorageContext\(')) {
      // [javascript] 'FencedFrameConfig.setSharedStorageContext(context)'
      result['fencedFrame'].push({ "domain": requestDomain, "api": 'setSharedStorageContext' });
    }

    if (reqHeaders.has('sec-fetch-dest') && reqHeaders.get('sec-fetch-dest') === "fencedframe") {
      // [request header] 'Sec-Fetch-Dest: fencedframe'
      if (respHeaders.has('supports-loading-mode') && respHeaders.get('supports-loading-mode') === "fenced-frame") {
        // [response header] 'Supports-Loading-Mode: fenced-frame' for document
        // to be loaded in fencedframe
        result['fencedFrame'].push({ "domain": requestDomain, "api": 'fencedFrameHeader' });
      }
    }

    if (checkResponseBody(request, 'window.fence.getNestedConfigs\(\s*\)')) {
      // [javascript] 'window.fence.getNestedConfigs()'
      result['fencedFrame'].push({ "domain": requestDomain, "api": 'getNestedConfigs' });
    }

    if (checkResponseBody(request, 'window.fence.reportEvent\(')) {
      // [javascript] 'window.fence.reportEvent(event)'
      result['fencedFrame'].push({ "domain": requestDomain, "api": 'reportEvent' });
    }

    if (checkResponseBody(request, 'window.fence.setReportEventDataForAutomaticBeacons\(')) {
      // [javascript] 'window.fence.setReportEventDataForAutomaticBeacons(event)'
      result['fencedFrame'].push({ "domain": requestDomain, "api": 'setReportEventDataForAutomaticBeacons' });
    }

    /***************************************************************************
     * FLoC (deprecated - are some still calling it?))
     * Documentation: https://web.dev/articles/floc
     * Test site: https://floc.glitch.me/
     **************************************************************************/
    if (checkResponseBody(request, 'document.interestCohort\(\s*\)')) {
      // [javascript] 'document.interestCohort()'
      result['floc'].push({ "domain": requestDomain, "api": 'interestCohort' });
    }

    /***************************************************************************
     * Private Aggregation
     * Documentation: https://developers.google.com/privacy-sandbox/relevance/private-aggregation
     * Test site(s): see several use cases at https://shared-storage-demo.web.app/
     **************************************************************************/

    if (checkResponseBody(request, 'privateAggregation.contributeToHistogram\(')) {
      // [javascript] 'privateAggregation.contributeToHistogram({ bucket: <bucket>, value: <value> })'
      result['privateAggregation'].push({ "domain": requestDomain, "api": 'contributeToHistogram' });
    }
    if (checkResponseBody(request, 'privateAggregation.contributeToHistogramOnEvent\(')) {
      // [javascript] 'privateAggregation.reportContributionForEvent(eventType, contribution)'
      result['privateAggregation'].push({ "domain": requestDomain, "api": 'contributeToHistogramOnEvent' });
    }
    if (checkResponseBody(request, 'privateAggregation.enableDebugMode\(')) {
      // [javascript] 'privateAggregation.enableDebugMode({ <debugKey: debugKey> })'
      result['privateAggregation'].push({ "domain": requestDomain, "api": 'enableDebugMode' });
    }

    /***************************************************************************
     * Private State Tokens
     * Documentation: https://github.com/WICG/trust-token-api/blob/main/README.md
     * Test site(s):
     * - https://private-state-token-redeemer.glitch.me/
     * - https://private-state-token-issuer.glitch.me/
     **************************************************************************/

    if (checkResponseBody(request, 'document.hasPrivateToken\(')) {
      // [javascript] 'document.hasPrivateToken(<issuer>>)'
      result['privateStateTokens'].push({ "domain": requestDomain, "api": 'hasPrivateToken' });
    }

    if (checkResponseBody(request, 'document.hasRedemptionRecord\(')) {
      // [javascript] 'document.hasRedemptionRecord(<issuer>>)'
      result['privateStateTokens'].push({ "domain": requestDomain, "api": 'hasRedemptionRecord' });
    }
    if (reqHeaders.has('sec-private-state-token')) {
      // [header] 'Sec-Private-State-Token'
      result['privateStateTokens'].push({ "domain": requestDomain, "api": 'Sec-Private-State-Token' });
    }
    if (reqHeaders.has('sec-redemption-record')) {
      // [header] 'Sec-Redemption-Record'
      result['privateStateTokens'].push({ "domain": requestDomain, "api": 'Sec-Redemption-Record' });
    }

    //other headers discarded as they only *may* be included (to pass more
    //metadata)

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
    }
    if (checkResponseBody(request, 'leaveAdInterestGroup', false)) {
      result['protectedAudienceAPI']['interestGroups']['leaveAdInterestGroup'].push(requestDomain);
    }
    if (checkResponseBody(request, 'updateAdInterestGroups', false)) {
      result['protectedAudienceAPI']['interestGroups']['updateAdInterestGroups'].push(requestDomain);
    }
    if (checkResponseBody(request, 'clearOriginJoinedAdInterestGroups', false)) {
      result['protectedAudienceAPI']['interestGroups']['clearOriginJoinedAdInterestGroups'].push(requestDomain);
    }
    if (checkResponseBody(request, 'runAdAuction', false)) {
      result['protectedAudienceAPI']['runAdAuction'].push(requestDomain);
    }
    if (checkResponseBody(request, 'generateBid', false)) {
      result['protectedAudienceAPI']['generateBid'].push(requestDomain);
    }
    if (checkResponseBody(request, 'scoreAd', false)) {
      result['protectedAudienceAPI']['scoreAd'].push(requestDomain);
    }
    if (checkResponseBody(request, 'reportWin', false)) {
      result['protectedAudienceAPI']['reportWin'].push(requestDomain);
    }
    if (checkResponseBody(request, 'reportResult', false) || request.response_body.includes('sendReportTo', false)) {
      result['protectedAudienceAPI']['reportResult'].push(requestDomain);
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
      result['sharedStorage'].push({ "domain": requestDomain, "api": 'append' });
    }
    if (checkResponseBody(request, 'window.sharedStorage.clear\(\s*\)')) {
      // [javascript] window.sharedStorage.clear()
      result['sharedStorage'].push({ "domain": requestDomain, "api": 'clear' });
    }
    if (checkResponseBody(request, 'window.sharedStorage.delete\(')) {
      // [javascript] window.sharedStorage.delete(key)
      result['sharedStorage'].push({ "domain": requestDomain, "api": 'delete' });
    }
    if (checkResponseBody(request, 'window.sharedStorage.set\(')) {
      // [javascript] window.sharedStorage.set(key, value, options)
      result['sharedStorage'].push({ "domain": requestDomain, "api": 'set' });
    }

    // WindowSharedStorage
    if (checkResponseBody(request, 'window.sharedStorage.run\(')) {
      // [javascript] window.sharedStorage.run(name, options)
      result['sharedStorage'].push({ "domain": requestDomain, "api": 'run' });
    }
    if (checkResponseBody(request, 'window.sharedStorage.selectURL\(')) {
      // [javascript] window.sharedStorage.run(name, urls, options)
      result['sharedStorage'].push({ "domain": requestDomain, "api": 'selectURL' });
    }

    if (checkResponseBody(request, 'window.sharedStorage.worklet.addModule\(')) {
      // [javascript] window.sharedStorage.worklet.addModule()
      result['sharedStorage'].push({ "domain": requestDomain, "api": 'addModule' });
    }

    // worklet methods discarded as we will catch who create such worklet by
    // detecting addMoudle, run, etc.

    /***************************************************************************
     * Storage Access
     * Documentation: https://developer.mozilla.org/en-US/docs/Web/API/Storage_Access_API
     * Test site(s):
     **************************************************************************/

    if (checkResponseBody(request, 'document.hasStorageAccess\(\s*\)')) {
      // [javascript] document.hasStorageAccess()
      result['relatedWebsiteSet'].push({ "domain": requestDomain, "api": 'hasStorageAccess' });
    }

    if (checkResponseBody(request, 'document.hasUnpartitionedCookieAccess\(\s*\)')) {
      // [javascript] document.hasUnpartitionedCookieAccess()
      result['relatedWebsiteSet'].push({ "domain": requestDomain, "api": 'hasUnpartitionedCookieAccess' });
    }

    if (checkResponseBody(request, 'document.requestStorageAccess\(')) {
      // [javascript] document.requestStorageAccess(types: optional)
      result['relatedWebsiteSet'].push({ "domain": requestDomain, "api": 'requestStorageAccess' });
    }

    if (checkResponseBody(request, 'document.requestStorageAccessFor\(')) {
      // [javascript] document.requestStorageAccessFor(requestedOrigin)
      result['relatedWebsiteSet'].push({ "domain": requestDomain, "api": 'requestStorageAccessFor' });
    }

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
      result['topicsAPI'].push({ "domain": requestDomain, "api": 'browsingTopicsJs', "skipObservation": false });
    }
    if (checkResponseBody(request, 'document.browsingTopics\(\s*\{\s*skipObservation\s*:\s*true\s*\}\s*\)')) {
      // [javascript] 'document.browsingTopics({skipObservation:true})'
      result['topicsAPI'].push({ "domain": requestDomain, "api": 'browsingTopicsJs', "skipObservation": true });
    }
    if (checkResponseBody(request, '\{\s*browsingTopics\s*:\s*true\s*\}') || checkResponseBody(request, '\{\s*deprecatedBrowsingTopics\s*:\s*true\s*\}')) {
      // [fetch] '{browsingTopics: true}'
      // [XHR] '{deprecatedBrowsingTopics: true}' (to be deprecated)
      if (respHeaders.has('observe-browsing-topics') && respHeaders.get('observe-browsing-topics') === "?1") {
        // [response header] 'Observe-Browsing-Topics: ?1' to include page in topics calculation
        result['topicsAPI'].push({ "domain": requestDomain, "api": 'browsingTopicsJs', "skipObservation": false });
      } else {
        result['topicsAPI'].push({ "domain": requestDomain, "api": 'browsingTopicsJs', "skipObservation": true });
      }
    }

    if (reqHeaders.has('sec-browsing-topics')) {
      // [request header] 'Sec-Browsing-Topics: true'
      if (respHeaders.has('observe-browsing-topics') && respHeaders.get('observe-browsing-topics') === "?1") {
        // [response header] 'Observe-Browsing-Topics: ?1' to include page in topics calculation
        result['topicsAPI'].push({ "domain": requestDomain, "api": 'browsingTopicsHeader', "skipObservation": false });
      } else {
        result['topicsAPI'].push({ "domain": requestDomain, "api": 'browsingTopicsHeader', "skipObservation": true });
      }
    }

    /***************************************************************************
     * User Client Hints
     * Documentation: https://developer.chrome.com/docs/privacy-security/user-agent-client-hints
     * Test site(s):
     * - https://user-agent-client-hints.glitch.me/
     * - https://user-agent-client-hints.glitch.me/headers
     **************************************************************************/

    if (checkResponseBody(request, 'navigator.userAgentData.getHighEntropyValues\(')) {
      // [javascript] 'navigator.userAgentData.getHighEntropyValues([])
      result['userAgentClientHints'].push({ "domain": requestDomain, "api": 'getHighEntropyValues' });
    }
  }


  // After going through all requests
  // if "Attribution-Reporting-Eligible" request header is sent to more than one domains,
  // then set sentByBrowser to true
  if (result['attributionReportingAPI']['attributionReportingEligibleHeader']['sentTo'].length > 0) {
    result['attributionReportingAPI']['attributionReportingEligibleHeader']['sentByBrowser'] = true;
  }

  // Fetch attestation files
  // TODO: check that it actually returns something (figure out promise/async/await, etc.)
  fetchAttestations();

})();

return result;

