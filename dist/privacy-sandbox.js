//[privacy-sandbox]
// Topics API Usage Reference: https://developers.google.com/privacy-sandbox/relevance/topics/demo#the-topics-api-demo
// Header Usage Reference: https://developers.google.com/privacy-sandbox/relevance/topics/demo#the-topics-api-demo

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
  'protected_audience': {
    // Protected Audience API metrics
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

let seenThirdParties = [];
(async () => {
  for (const request of requests) {
    const url = new URL(request.url);
    const isScript = request.type === 'Script';
    const isDocument = request.type === 'Document';
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
    if ('Sec-Browsing-Topics' in request.request_headers) {
      result['topicsAPI']['topicsAccessHeader'].push(thirdPartyDomain);
      // Checking is sent Topics are observed by the receiver using response header 'Observe-Browsing-Topics'
      // If value is ?1 then they are observed else they are not observed
      if (request.response_headers['Observe-Browsing-Topics'] === '?1') {
        result['topicsAPI']['observingTopics'].push(thirdPartyDomain);
      }
    }

    const attestationPublished = await fetchAndCheckAttestation(`${url.origin}/.well-known/privacy-sandbox-attestations.json`);
    if (attestationPublished) {
      result.attestationPublished.push(thirdPartyDomain);
    }
    const tldPlus1AttestationPublished = await fetchAndCheckAttestation(`${'https://'+cannonicalRequestDomain}/.well-known/privacy-sandbox-attestations.json`);
    if (tldPlus1AttestationPublished) {
        result.attestationPublished.push(cannonicalRequestDomain);
    }
  }

  result['topicsAPI']['usingBrowsingTopics'] = Array.from(new Set([
    ...result['topicsAPI']['topicsAccessJs'],
    ...result['topicsAPI']['topicsAccessHeader']
  ]));
})();

return result;
