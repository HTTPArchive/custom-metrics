//[privacy-sandbox]
/**
 * Topics API
 * Protected Audience API
 * Attribution Reporting API
 * Required command line flags: --enable-features=BrowsingTopics,InterestGroupStorage,PrivacySandboxAdsAPIsOverride
*/

let requests = $WPT_BODIES;
const cannonicalFirstPartyDomain = getCanonicalDomain(document.location.hostname);

let result = {
  'topicsAPI': {
    'topicsAvailable': document.featurePolicy.allowsFeature('browsing-topics'),
    'usingBrowsingTopics': [],
    'topicsAccessJs': [],
    'topicsAccessHeader': [],
    'observingTopics': []
  },
  'protectedAudienceAPI': {
    'protectedAudienceAvailable': document.featurePolicy.allowsFeature('join-ad-interest-group'),
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
  'attributionReportingAPI': {
    'attributionReportingAvailable': document.featurePolicy.allowsFeature('attribution-reporting'),
    'attributionReportingEligibleHeader': {
      'sentByBrowser': false,
      'sentTo': [],
    },
    'completedRegistrations': {
      'AttributionReportingRegisterSourceHeader': {},
      'AttributionReportingRegisterTriggerHeader': []
    },
  },
  attestationPublished: []
}

function getCanonicalDomain(hostname) {
  const parts = hostname.split('.').reverse();
  if (parts.length >= 2) {
    return `${parts[1]}.${parts[0]}`;
  } else {
    return hostname;
  }
}

async function fetchAndCheckAttestation(url) {
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

let seenDomains = [];
(async () => {
  for (const request of requests) {
    const url = new URL(request.full_url);
    const isScript = request.type === 'Script';
    const isDocument = request.type === 'Document';
    const cannonicalRequestDomain = getCanonicalDomain(url.hostname);
    if (cannonicalRequestDomain !== cannonicalFirstPartyDomain) {
      cannonicalRequestDomain = url.hostname;
    }
    let reqHeaders = new Map(Object.entries(request.request_headers).map(([key, value]) => [key.toLowerCase(), value]));
    let respHeaders = new Map(Object.entries(request.response_headers).map(([key, value]) => [key.toLowerCase(), value]));
    

    /***********************************************************************************************************************
     * Topics API
     * API Usage Reference: https://developers.google.com/privacy-sandbox/relevance/topics/demo#the-topics-api-demo
     * Header Usage Reference: https://developers.google.com/privacy-sandbox/relevance/topics/demo#the-topics-api-demo
     * 
     * Test sites:
     * - https://www.operafootball.com/
     ***********************************************************************************************************************/

    // If the request is to fetch a javascript file or HTML document, perform string search in the returned file content for usage of Topics API
    // document.browsingTopics() [JS] or fetch() request call includes: {browsingTopics: true} or XHR request call includes: {deprecatedBrowsingTopics: true} (to be deprecated)
    if (isScript || isDocument) {
      if (request.response_body && (request.response_body.includes('browsingTopics') || request.response_body.includes('deprecatedBrowsingTopics'))) {
        result['topicsAPI']['topicsAccessJs'].push(cannonicalRequestDomain);
      }
    }

    // Checking request header usage of Topics: header: 'Sec-Browsing-Topics: true'
    if (respHeaders.has('sec-browsing-topicss')) {
      result['topicsAPI']['topicsAccessHeader'].push(cannonicalRequestDomain);
    }

    // Checking if sent Topics in the request (either via JS or headers) are observed by the receiver using response header 'Observe-Browsing-Topics'
    // If value is ?1 then they are observed else they are not observed
    if (respHeaders.has('observe-browsing-topics') && respHeaders.get('observe-browsing-topics') === "?1") {
      result['topicsAPI']['observingTopics'].push(cannonicalRequestDomain);
    }

    // Limiting checking attestation only once per hostname
    if (!seenDomains.includes) {
      const attestationPublished = await fetchAndCheckAttestation(`${url.origin}/.well-known/privacy-sandbox-attestations.json`);
      if (attestationPublished) {
        result.attestationPublished.push(cannonicalRequestDomain);
      }
      seenDomains.push(cannonicalRequestDomain);
    }

    /***********************************************************************************************************************
     * Protected Audience API
     * https://github.com/WICG/turtledove/blob/main/FLEDGE.md
     * https://developers.google.com/privacy-sandbox/relevance/protected-audience
     ***********************************************************************************************************************/

    if ((isScript || isDocument) && request.response_body) {
      if (request.response_body.includes('joinAdInterestGroup')) {
        result['protectedAudienceAPI']['interestGroups']['joinAdInterestGroup'].push(cannonicalRequestDomain);
      }
      if (request.response_body.includes('leaveAdInterestGroup')) {
        result['protectedAudienceAPI']['interestGroups']['leaveAdInterestGroup'].push(cannonicalRequestDomain);
      }
      if (request.response_body.includes('updateAdInterestGroups')) {
        result['protectedAudienceAPI']['interestGroups']['updateAdInterestGroups'].push(cannonicalRequestDomain);
      }
      if (request.response_body.includes('clearOriginJoinedAdInterestGroups')) {
        result['protectedAudienceAPI']['interestGroups']['clearOriginJoinedAdInterestGroups'].push(cannonicalRequestDomain);
      }
      if (request.response_body.includes('runAdAuction')) {
        result['protectedAudienceAPI']['runAdAuction'].push(cannonicalRequestDomain);
      }
      if (request.response_body.includes('generateBid')) {
        result['protectedAudienceAPI']['generateBid'].push(cannonicalRequestDomain);
      }
      if (request.response_body.includes('scoreAd')) {
        result['protectedAudienceAPI']['scoreAd'].push(cannonicalRequestDomain);
      }
      if (request.response_body.includes('reportWin')) {
        result['protectedAudienceAPI']['reportWin'].push(cannonicalRequestDomain);
      }
      if (request.response_body.includes('reportResult') || request.response_body.includes('sendReportTo')) {
        result['protectedAudienceAPI']['reportResult'].push(cannonicalRequestDomain);
      }
    }

    /***********************************************************************************************************************
     * Attribution Reporting API
     * https://developer.mozilla.org/en-US/docs/Web/API/Attribution_Reporting_API
     ***********************************************************************************************************************/

    // Checking if the request header includes 'Attribution-Reporting-Eligible' to initiate the registration of source or trigger
    if (reqHeaders.has('attribution-reporting-eligible')) {
      result['attributionReportingAPI']['attributionReportingEligibleHeader']['sentTo'].push(cannonicalRequestDomain);
    }

    // Checking if the response header includes 'Attribution-Reporting-Register-Source' or 'Attribution-Reporting-Register-Trigger' to complete registration of source or trigger
    // Source registration happens on seller (e.g., publisher) website where impression is registered and trigger registration happens on buyer (e.g., advertiser) website where conversion completes.
    // Each entry in result['attributionReportingAPI']['completedRegistrations']['AttributionReportingRegisterSourceHeader'] is represented as {cannonicalRequestDomain: {"destination": "", "eventEpsilon": 0}}
    // Higher the epsilon, the more the privacy protection
    if (respHeaders.has('attribution-reporting-register-source')) {
      jsonString = respHeaders.get('attribution-reporting-register-source');
      const { destination, event_level_epsilon } = JSON.parse(jsonString);
      if (!result['attributionReportingAPI']['completedRegistrations']['AttributionReportingRegisterSourceHeader'][cannonicalRequestDomain]) {
        result['attributionReportingAPI']['completedRegistrations']['AttributionReportingRegisterSourceHeader'][cannonicalRequestDomain] = [];
      }
      result['attributionReportingAPI']['completedRegistrations']['AttributionReportingRegisterSourceHeader'][cannonicalRequestDomain].push({"destination": destination, "eventEpsilon": event_level_epsilon});
    } else if (respHeaders.has('attribution-reporting-register-trigger')) {
      result['attributionReportingAPI']['completedRegistrations']['AttributionReportingRegisterTriggerHeader'].push(cannonicalRequestDomain);
    }
  }

  result['topicsAPI']['usingBrowsingTopics'] = Array.from(new Set([
    ...result['topicsAPI']['topicsAccessJs'],
    ...result['topicsAPI']['topicsAccessHeader']
  ]));

  // if "Attribution-Reporting-Eligible" request header is sent to more than one domains, set sentByBrowser to true
  if (result['attributionReportingAPI']['attributionReportingEligibleHeader']['sentTo'].length > 0) {
    result['attributionReportingAPI']['attributionReportingEligibleHeader']['sentByBrowser'] = true;
  }

})();

return result;
