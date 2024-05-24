//[privacy-sandbox]
// Topics API Usage Reference: https://developers.google.com/privacy-sandbox/relevance/topics/demo#the-topics-api-demo
// Header Usage Reference: https://developers.google.com/privacy-sandbox/relevance/topics/demo#the-topics-api-demo

let requests = $WPT_BODIES;
const firstPartyDomain = document.location.hostname;

let result = {
  topicsAvailable: document.featurePolicy.allowsFeature('browsing-topics'),
  thirdPartiesUsingBrowsingTopics: {}
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

    let thirdPartyDomain = '';
    if (url.hostname !== firstPartyDomain) {
      thirdPartyDomain = url.hostname;
    }
    if (thirdPartyDomain && seenThirdParties.includes(thirdPartyDomain)) {
        continue;
    }
    seenThirdParties.push(thirdPartyDomain);

    let jsUsage = false;
    let headerUsage = false;
    let receiverObserving = false;

    // If the request is to fetch a javascript file or HTML document, perform string search in the returned file content for usage of Topics API
    // document.browsingTopics() [JS] or fetch() request call includes: {browsingTopics: true} or XHR request call includes: {deprecatedBrowsingTopics: true} (to be deprecated)
    if (isScript || isDocument) {
      if (request.response_body && (request.response_body.includes('browsingTopics') || request.response_body.includes('deprecatedBrowsingTopics'))) {
        jsUsage = true;
      }
    }

    // Checking request header usage of Topics: header: 'Sec-Browsing-Topics: true'
    if ('Sec-Browsing-Topics' in request.request_headers) {
      headerUsage = true;
      // Checking is sent Topics are observed by the receiver using response header 'Observe-Browsing-Topics'
      // If value is ?1 then they are observed else they are not observed
      if (request.response_headers['Observe-Browsing-Topics'] === '?1') {
        receiverObserving = true;
      }
    }

    if (thirdPartyDomain && (jsUsage || headerUsage)) {
      // Checking if the third party has published an attestation for Privacy Sandbox
      const tldPlus1Origin = 'https://' + url.hostname.split('.').slice(-2).join('.');
      result.thirdPartiesUsingBrowsingTopics[thirdPartyDomain] = {
        topicsAccessJs: jsUsage,
        topicsAccessHeader: headerUsage,
        observingTopics: receiverObserving,
        attestationPublished: await fetchAndCheckAttestation(`${url.origin}/.well-known/privacy-sandbox-attestations.json`),
        tldPlus1AttestationPublished: await fetchAndCheckAttestation(`${tldPlus1Origin}/.well-known/privacy-sandbox-attestations.json`)
      };
    }
  };
})();

return result;
