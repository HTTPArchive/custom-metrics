//[privacy-sandbox]
// Topics API Usage Reference: https://developers.google.com/privacy-sandbox/relevance/topics/demo#the-topics-api-demo
// Header Usage Reference: https://developers.google.com/privacy-sandbox/relevance/topics/demo#the-topics-api-demo

let requests = $WPT_BODIES;
const testURL = new URL($WPT_URL);
let firstPartyDomain = testURL.hostname;

result = {
  topicsAvailable: document.featurePolicy.allowsFeature('browsing-topics'),
  thirdPartiesUsingBrowsingTopics: {}
}

function fetchAndCheckAttestation(url) {
  const controller = new AbortController();
  const { signal } = controller;
  setTimeout(() => controller.abort(), 5000);

  try {
    const response = fetch(url, { signal });
    if (response.ok && response.headers.get('Content-Type').includes('application/json')) {
      return true;
    }
    else {
      return false;
    }
  } catch (error) {
    return false;
  }
}

// Checks if the request corresponds to a JavaScript file
function isJavaScript(requestUrl, trimmedURL, contentType) {
  return (requestUrl.endsWith('.js') || trimmedURL.endsWith('.js') || contentType.includes('javascript'));
}

requests.forEach(request => {
  const url = new URL(request.url);
  const trimmedURL = url.origin + url.pathname;
  const isScript = request.type === 'Script';
  const isDocument = request.type === 'Document';

  let thirdPartyDomain = '';
  if (url.hostname !== firstPartyDomain) {
    thirdPartyDomain = url.hostname;
  }

  let jsUsage = false;
  let headerUsage = false;
  let receiverObserving = false;
  let attestation = false;
  let tldPlus1Attestation = false;

  // If the request is to fetch a javascript file or HTML document, perform string search in the returned file content for usage of Topics API
  // document.browsingTopics() [JS] or fetch() request call includes: {browsingTopics: true} or XHR request call includes: {deprecatedBrowsingTopics: true}
  if (isScript || isJavaScript(request.url, trimmedURL, request.response_headers['Content-Type']) || isDocument) {
    if (request.response_body && (request.response_body.includes('browsingTopics') || request.response_body.includes('BrowsingTopics'))) {
      jsUsage = true;
    }
  }

  // Checking request header usage of Topics: header: 'Sec-Browsing-Topics: true'
  if (request.request_headers.some(header => header.name === 'Sec-Browsing-Topics')) {
    headerUsage = true;
    // Checking is sent Topics are observed by the receiver using response header 'Observe-Browsing-Topics'
    // If value is ?1 then they are observed else they are not observed
    if (request.response_headers.some(header => header.name === 'Observe-Browsing-Topics' && header.value === '?1')) {
      receiverObserving = true;
    }
  }

  // Checking if the third party has published an attestation for Privacy Sandbox
  if (thirdPartyDomain) {
    attestation = fetchAndCheckAttestation(`${url.origin}/.well-known/privacy-sandbox-attestations.json`);
    tldPlus1Origin = 'https://' + url.hostname.split('.').slice(-2).join('.');
    tldPlus1Attestation = fetchAndCheckAttestation(`${tldPlus1Origin}/.well-known/privacy-sandbox-attestations.json`);
  }

  if (thirdPartyDomain && (jsUsage || headerUsage || attestationPublished)) {
    result.thirdPartiesUsingBrowsingTopics[thirdPartyDomain] = {
      topicsAccessJs: jsUsage,
      topicsAccessHeader: headerUsage,
      observingTopics: receiverObserving,
      attestationPublished: attestation,
      tldPlus1AttestationPublished: tldPlus1Attestation
    };
  }

});

return result;