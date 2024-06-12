//[privacy-sandbox]
/**
 * Attribution Reporting API
 * Federated Credentials Manager API
 * Fenced Frames API
 * FLoC API (deprecated API: are some still calling it?)
 * Protected Audience API (previously FLEDGE)
 * Private Aggregation API
 * Private State Tokens API (previously Trust Tokens)
 * Shared Storage API
 * Storage Access API
 * Topics API
 * User Client Hints API
 *
 * Required command line flags: --enable-features=BrowsingTopics,InterestGroupStorage,PrivacySandboxAdsAPIsOverride
 */

let requests = $WPT_BODIES;

let result = {
  'featuresDisabled': [],
  'privacySandBoxAPIUsage': {}
}

/**
 * @function checkIfFeaturePolicyIsAllowed
 * Check if Feature Policy is allowed
 * If not, record it
 *
 * @param {string} feature - Feature policy to look for if allowed or no
 */
function checkIfFeaturePolicyIsAllowed(feature) {
  if (!document.featurePolicy.allowsFeature(feature)) {
    result['featuresDisabled'].push({ [feature]: document.featurePolicy.getAllowlistForFeature(feature) });
  }
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

// Documentation Permissions Policy for Privacy Sandbox:
// https://developers.google.com/privacy-sandbox/relevance/setup/web/permissions-policy
// there is a bunch for User-Agent client hints to allow on cross-origin
// requests, we do not check for these
const featurePolicies = ['attribution-reporting', 'browsing-topics', 'identity-credentials-get', 'interest-cohort', 'join-ad-interest-group', 'private-aggregation', 'run-ad-auction', 'shared-storage', 'shared-storage-select-url', 'storage-access', 'top-level-storage-access']
featurePolicies.forEach(checkIfFeaturePolicyIsAllowed);


(async () => {
  for (const request of requests) {
    try {
      const url = new URL(request.url);
      const requestDomain = url.hostname;
      let reqHeaders = new Map(Object.entries(request.request_headers).map(([key, value]) => [key.toLowerCase(), value]));
      let respHeaders = new Map(Object.entries(request.response_headers).map(([key, value]) => [key.toLowerCase(), value]));
      let apiUsed = [];

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
        apiUsed.push('attribution-reporting-eligible');
      }
      // Source registration happens on seller (e.g., publisher) website where impression is registered
      if (respHeaders.has('attribution-reporting-register-source')) {
        // Higher the epsilon, the more the privacy protection
        const { destination, event_level_epsilon } = JSON.parse(respHeaders.get('attribution-reporting-register-source'));
        apiUsed.push('attribution-reporting-register-source' + '|destination=' + destination + '|epsilon=' + event_level_epsilon);
      }
      // Trigger registration happens on buyer (e.g., advertiser) website where conversion completes
      if (respHeaders.has('attribution-reporting-register-trigger')) {
        apiUsed.push('attribution-reporting-register-trigger');
      }

      /***************************************************************************
       * Federated Credentials Manager
       * Documentation: https://developer.mozilla.org/en-US/docs/Web/API/FedCM_API
       * Test site(s):
       * - https://fedcm-rp-demo.glitch.me/
       * - https://fedcm-idp-demo.glitch.me/
       **************************************************************************/

      if (checkResponseBody(request, 'navigator.credentials.get\\(')) {
        // [javascript] 'navigator.credentials.get(options)'
        apiUsed.push('navigator.credentials.get');
      }
      if (checkResponseBody(request, 'IdentityProvider.getUserInfo\\(')) {
        // [javascript] 'IdentityProvider.getUserInfo(config)'
        apiUsed.push('IdentityProvider.getUserInfo');
      }
      if (checkResponseBody(request, 'IdentityProvider.close\\(\\s*\\)')) {
        // [javascript] 'IdentityProvider.close()'
        apiUsed.push('IdentityProvider.close');
      }
      if (checkResponseBody(request, 'navigator.login.setStatus\\(')) {
        // [javascript] 'navigator.login.setStatus(status)'
        apiUsed.push('navigator.login.setStatus');
      }

      /***************************************************************************
       * Fenced Frames
       * Documentation: https://developer.mozilla.org/en-US/docs/Web/API/Fenced_frame_API
       * Test site(s):
       * - check on sharedStorage demo https://shared-storage-demo.web.app/
       **************************************************************************/

      if (checkResponseBody(request, 'document.createElement\\("fencedframe"\\)')) {
        // [javascript] 'document.createElement("fencedframe");'
        apiUsed.push('fencedFrameJs');
      }
      if (checkResponseBody(request, 'setSharedStorageContext\\(')) {
        // [javascript] 'FencedFrameConfig.setSharedStorageContext(context)'
        apiUsed.push('FencedFrameConfig.setSharedStorageContext');
      }
      if (checkResponseBody(request, 'window.fence.getNestedConfigs\\(\\s*\\)')) {
        // [javascript] 'window.fence.getNestedConfigs()'
        apiUsed.push('window.fence.getNestedConfigs');
      }
      if (checkResponseBody(request, 'window.fence.reportEvent\\(')) {
        // [javascript] 'window.fence.reportEvent(event)'
        apiUsed.push('window.fence.reportEvent');
      }
      if (checkResponseBody(request, 'window.fence.setReportEventDataForAutomaticBeacons\\(')) {
        // [javascript] 'window.fence.setReportEventDataForAutomaticBeacons(event)'
        apiUsed.push('window.fence.setReportEventDataForAutomaticBeacons');
      }
      if (reqHeaders.has('sec-fetch-dest') && reqHeaders.get('sec-fetch-dest') === "fencedframe") {
        // [request header] 'Sec-Fetch-Dest: fencedframe'
        if (respHeaders.has('supports-loading-mode') && respHeaders.get('supports-loading-mode') === "fenced-frame") {
          // [response header] 'Supports-Loading-Mode: fenced-frame' for document
          // to be loaded in fencedframe
          apiUsed.push('fenced-frame');
        }
      }

      /***************************************************************************
       * FLoC (deprecated - are some still calling it?))
       * Documentation: https://web.dev/articles/floc
       * Test site: https://floc.glitch.me/
       **************************************************************************/
      if (checkResponseBody(request, 'document.interestCohort\\(\\s*\\)')) {
        // [javascript] 'document.interestCohort()'
        apiUsed.push('document.interestCohort');
      }

      /***************************************************************************
       * Private Aggregation
       * Documentation: https://developers.google.com/privacy-sandbox/relevance/private-aggregation
       * Test site(s): see several use cases at https://shared-storage-demo.web.app/
       **************************************************************************/

      if (checkResponseBody(request, 'privateAggregation.contributeToHistogram\\(')) {
        // [javascript] 'privateAggregation.contributeToHistogram({ bucket: <bucket>, value: <value> })'
        apiUsed.push('privateAggregation.contributeToHistogram');
      }
      if (checkResponseBody(request, 'privateAggregation.contributeToHistogramOnEvent\\(')) {
        // [javascript] 'privateAggregation.reportContributionForEvent(eventType, contribution)'
        apiUsed.push('privateAggregation.contributeToHistogramOnEvent');
      }
      if (checkResponseBody(request, 'privateAggregation.enableDebugMode\\(')) {
        // [javascript] 'privateAggregation.enableDebugMode({ <debugKey: debugKey> })'
        apiUsed.push('privateAggregation.enableDebugMode');
      }

      /***************************************************************************
       * Private State Tokens
       * Documentation: https://github.com/WICG/trust-token-api/blob/main/README.md
       * Test site(s):
       * - https://private-state-token-redeemer.glitch.me/
       * - https://private-state-token-issuer.glitch.me/
       **************************************************************************/

      if (checkResponseBody(request, 'document.hasPrivateToken\\(')) {
        // [javascript] 'document.hasPrivateToken(<issuer>>)'
        apiUsed.push('document.hasPrivateToken');
      }
      if (checkResponseBody(request, 'document.hasRedemptionRecord\\(')) {
        // [javascript] 'document.hasRedemptionRecord(<issuer>>)'
        apiUsed.push('document.hasRedemptionRecord');
      }
      if (reqHeaders.has('sec-private-state-token')) {
        // [header] 'Sec-Private-State-Token'
        apiUsed.push('sec-private-state-token');
      }
      if (reqHeaders.has('sec-redemption-record')) {
        // [header] 'Sec-Redemption-Record'
        apiUsed.push('sec-redemption-record');
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
        apiUsed.push('joinAdInterestGroup');
      }
      if (checkResponseBody(request, 'leaveAdInterestGroup', false)) {
        apiUsed.push('leaveAdInterestGroup');
      }
      if (checkResponseBody(request, 'updateAdInterestGroups', false)) {
        apiUsed.push('updateAdInterestGroups');
      }
      if (checkResponseBody(request, 'clearOriginJoinedAdInterestGroups', false)) {
        apiUsed.push('clearOriginJoinedAdInterestGroups');
      }
      if (checkResponseBody(request, 'runAdAuction', false)) {
        apiUsed.push('runAdAuction');
      }
      if (checkResponseBody(request, 'generateBid', false)) {
        apiUsed.push('generateBid');
      }
      if (checkResponseBody(request, 'scoreAd', false)) {
        apiUsed.push('scoreAd');
      }
      if (checkResponseBody(request, 'reportWin', false)) {
        apiUsed.push('reportWin');
      }
      if (checkResponseBody(request, 'reportResult', false) || checkResponseBody(request, 'sendReportTo', false)) {
        apiUsed.push('reportResult');
      }

      /***************************************************************************
       * Shared Storage
       * Documentation: https://developer.mozilla.org/en-US/docs/Web/API/SharedStorage
       * Test site(s):
       * - https://shared-storage-demo.web.app/
       *
       **************************************************************************/
      // SharedStorage
      if (checkResponseBody(request, 'window.sharedStorage.append\\(')) {
        // [javascript] window.sharedStorage.append(key, value)
        apiUsed.push('window.sharedStorage.append');
      }
      if (checkResponseBody(request, 'window.sharedStorage.clear\\(\\s*\\)')) {
        // [javascript] window.sharedStorage.clear()
        apiUsed.push('window.sharedStorage.clear');
      }
      if (checkResponseBody(request, 'window.sharedStorage.delete\\(')) {
        // [javascript] window.sharedStorage.delete(key)
        apiUsed.push('window.sharedStorage.delete');
      }
      if (checkResponseBody(request, 'window.sharedStorage.set\\(')) {
        // [javascript] window.sharedStorage.set(key, value, options)
        apiUsed.push('window.sharedStorage.set');
      }
      // WindowSharedStorage
      if (checkResponseBody(request, 'window.sharedStorage.run\\(')) {
        // [javascript] window.sharedStorage.run(name, options)
        apiUsed.push('window.sharedStorage.run');
      }
      if (checkResponseBody(request, 'window.sharedStorage.selectURL\\(')) {
        // [javascript] window.sharedStorage.run(name, urls, options)
        apiUsed.push('window.sharedStorage.selectURL');
      }
      if (checkResponseBody(request, 'window.sharedStorage.worklet.addModule\\(')) {
        // [javascript] window.sharedStorage.worklet.addModule()
        apiUsed.push('window.sharedStorage.worklet.addModule');
      }

      // worklet methods discarded as we will catch who create such worklet by
      // detecting addMoudle, run, etc.

      /***************************************************************************
       * Storage Access
       * Documentation: https://developer.mozilla.org/en-US/docs/Web/API/Storage_Access_API
       * Test site(s):
       **************************************************************************/

      if (checkResponseBody(request, 'document.hasStorageAccess\\(\\s*\\)')) {
        // [javascript] document.hasStorageAccess()
        apiUsed.push('document.hasStorageAccess');
      }
      if (checkResponseBody(request, 'document.hasUnpartitionedCookieAccess\\(\\s*\\)')) {
        // [javascript] document.hasUnpartitionedCookieAccess()
        apiUsed.push('document.hasUnpartitionedCookieAccess');
      }
      if (checkResponseBody(request, 'document.requestStorageAccess\\(')) {
        // [javascript] document.requestStorageAccess(types: optional)
        apiUsed.push('document.requestStorageAccess');
      }
      if (checkResponseBody(request, 'document.requestStorageAccessFor\\(')) {
        // [javascript] document.requestStorageAccessFor(requestedOrigin)
        apiUsed.push('document.requestStorageAccessFor');
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

      if (checkResponseBody(request, 'document.browsingTopics\\(\\s*\\)')) {
        // [javascript] 'document.browsingTopics()'
        apiUsed.push('document.browsingTopics|false');
      }
      if (checkResponseBody(request, 'document.browsingTopics\\(\\s*\\{\\s*skipObservation\\s*:\\s*true\\s*\\}\\s*\\)')) {
        // [javascript] 'document.browsingTopics({skipObservation:true})'
        apiUsed.push('document.browsingTopics|true');
      }
      if (checkResponseBody(request, '\\{\\s*browsingTopics\\s*:\\s*true\\s*\\}') || checkResponseBody(request, '\\{\\s*deprecatedBrowsingTopics\\s*:\\s*true\\s*\\}')) {
        // [fetch] '{browsingTopics: true}'
        // [XHR] '{deprecatedBrowsingTopics: true}' (to be deprecated)
        if (respHeaders.has('observe-browsing-topics') && respHeaders.get('observe-browsing-topics') === "?1") {
          // [response header] 'Observe-Browsing-Topics: ?1' to include page in topics calculation
          apiUsed.push('document.browsingTopics|false');
        } else {
          apiUsed.push('document.browsingTopics|true');
        }
      }
      if (reqHeaders.has('sec-browsing-topics')) {
        // [request header] 'Sec-Browsing-Topics: true'
        if (respHeaders.has('observe-browsing-topics') && respHeaders.get('observe-browsing-topics') === "?1") {
          // [response header] 'Observe-Browsing-Topics: ?1' to include page in topics calculation
          apiUsed.push('sec-browsing-topics|false');
        } else {
          apiUsed.push('sec-browsing-topics|true');
        }
      }

      /***************************************************************************
       * User Client Hints
       * Documentation: https://developer.chrome.com/docs/privacy-security/user-agent-client-hints
       * Header Usage: https://developer.chrome.com/docs/privacy-security/user-agent-client-hints#user-agent-response-and-request-headers
       * Other Usage: https://wicg.github.io/client-hints-infrastructure/#policy-controlled-features
       * Test site(s):
       * - https://user-agent-client-hints.glitch.me/
       * - https://user-agent-client-hints.glitch.me/headers
       **************************************************************************/

      if (checkResponseBody(request, 'navigator.userAgentData.getHighEntropyValues\\(')) {
        // [javascript] 'navigator.userAgentData.getHighEntropyValues([])
        apiUsed.push('navigator.userAgentData.getHighEntropyValues');
      }
      // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-CH
      if (respHeaders.has('accept-ch')) {
        apiUsed.push(`accept-ch|${respHeaders.get('accept-ch')}`);
      }

      if (apiUsed.length > 0) {
        if (!result.privacySandBoxAPIUsage[requestDomain]) {
          result.privacySandBoxAPIUsage[requestDomain] = [];
        }
        result.privacySandBoxAPIUsage[requestDomain] = [...new Set([...result.privacySandBoxAPIUsage[requestDomain], ...apiUsed])];
      }
    } catch (e) {
      // invalid URL (should not happen), catch other error while detecting an API
      // continue and skip request
      continue;
    }
  }
})();

return result;
