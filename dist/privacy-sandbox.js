//[privacy-sandbox]
/*
Topics API Usage Reference: https://developers.google.com/privacy-sandbox/relevance/topics/demo#the-topics-api-demo

Header Usage Reference: https://developers.google.com/privacy-sandbox/relevance/topics/demo#the-topics-api-demo

Required command line flags: --enable-features=BrowsingTopics,InterestGroupStorage,PrivacySandboxAdsAPIsOverride
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
  'protected_audience': {},
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

let seenThirdParties = [];
(async () => {
  for (const request of requests) {
    const url = new URL(request.full_url);
    // FIX THIS --- IS IT request.request_type OR request.type?
    const isScript = request.request_type === 'Script';
    const isDocument = request.request_type === 'Document';
    const cannonicalRequestDomain = getCanonicalDomain(url.hostname);

    let thirdPartyDomain = '';
    // Maps all first party hostnames to the corresponding cannonical first party domain to truly consider only third-parties
    if (cannonicalRequestDomain !== cannonicalFirstPartyDomain) {
      thirdPartyDomain = url.hostname;
    }
    if (thirdPartyDomain && seenThirdParties.includes(thirdPartyDomain)) {
        continue;
    }
    seenThirdParties.push(thirdPartyDomain);

    // If the request is to fetch a javascript file or HTML document, perform string search in the returned file content for usage of Topics API
    // document.browsingTopics() [JS] or fetch() request call includes: {browsingTopics: true} or XHR request call includes: {deprecatedBrowsingTopics: true} (to be deprecated)
    if (isScript || isDocument) {
      if (request.response_body && (request.response_body.includes('browsingTopics') || request.response_body.includes('deprecatedBrowsingTopics'))) {
        result['topicsAPI']['topicsAccessJs'].push(thirdPartyDomain);
      }
    }

    // Checking request header usage of Topics: header: 'Sec-Browsing-Topics: true'
    if ('sec-browsing-topics' in request.request_headers.toLowerCase()) {
      result['topicsAPI']['topicsAccessHeader'].push(thirdPartyDomain);
    }

    // Checking if sent Topics in the request (either via JS or headers) are observed by the receiver using response header 'Observe-Browsing-Topics'
    // If value is ?1 then they are observed else they are not observed
    let respHeaders = new Map(Object.entries(request.response_headers).map(([key, value]) => [key.toLowerCase(), value]));
    if (respHeaders.has('observe-browsing-topics') && respHeaders.get('observe-browsing-topics') === "?1") {
      result['topicsAPI']['observingTopics'].push(thirdPartyDomain);
    }

    const attestationPublished = await fetchAndCheckAttestation(`${url.origin}/.well-known/privacy-sandbox-attestations.json`);
    if (attestationPublished) {
      result.attestationPublished.push(thirdPartyDomain);
    }
  }

  result['topicsAPI']['usingBrowsingTopics'] = Array.from(new Set([
    ...result['topicsAPI']['topicsAccessJs'],
    ...result['topicsAPI']['topicsAccessHeader']
  ]));
})();

return result;
