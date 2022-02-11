//[pwa]
const response_bodies = $WPT_BODIES;
const requests = $WPT_REQUESTS;
const serviceWorkerStrictRegistrationPattern = /navigator\.serviceWorker\.register\(['"]([^"']+)/m;

const serviceWorkerURLs = response_bodies.filter(har => {
  return serviceWorkerStrictRegistrationPattern.test(har.response_body);
}).map(har => {
  const base = new URL(location.href).origin;
  const serviceWorkerPath = har.response_body.match(serviceWorkerStrictRegistrationPattern)[1];
  return new URL(serviceWorkerPath, base).href;
}).reduce((set, url) => {
  set.add(url);
  return set;
}, new Set());


const manifestURLs = new Set(Array.from(document.querySelectorAll('link[rel=manifest]')).map(link => {
  const base = new URL(location.href).origin;
  const href = link.getAttribute('href');
  return new URL(href, base).href;
}));


const initiatorMap = requests.reduce((map, request) => {
  const url = request.url;
  let initiator = request.initiator.url;
  if (!initiator) {
    initiator = request.initiator?.stack?.callFrames?.[0]?.url
  }
  map[initiator] = map[initiator] || [];
  map[initiator].push(url);
  return map;
}, {});

function getURLsInitiatedBy(initialURL) {
  let initiatorChain = [initialURL];
  for (let i = 0; i < initiatorChain.length; i++) {
    const url = initiatorChain[i];
    if (url in initiatorMap) {
      initiatorChain = initiatorChain.concat(initiatorMap[url].filter(url => {
        return !initiatorChain.includes(url);
      }));
    }
  }
  return initiatorChain;
}

function getEntriesForURLs(urlSet) {
  return response_bodies.filter(har => {
    return urlSet.has(har.url);
  }).map(har => {
    return [har.url, har.response_body];
  });
}

const serviceWorkers = getEntriesForURLs(serviceWorkerURLs);
const manifests = getEntriesForURLs(manifestURLs).map(([url, body]) => {
  let manifest;
  try {
    manifest = JSON.parse(body);
  } catch (e) {
    manifest = body;
  }
  return [url, manifest];
});


const serviceWorkerInitiatedURLs = new Set(Array.from(serviceWorkerURLs).flatMap(getURLsInitiatedBy));
const serviceWorkerInitiated = getEntriesForURLs(serviceWorkerInitiatedURLs);

// We should use serviceWorkerInitiatedURLs here, but SW detection has some false negatives.
function getInfoForPattern(regexPattern, extractMatchingGroupOnly) {
  return response_bodies.filter(har => {
    return regexPattern.test(har.response_body);
  }).map(har => {
    return [har.url, Array.from(har.response_body.matchAll(regexPattern)).map(m => {
      return (extractMatchingGroupOnly && m.length > 0) ? m[1] : m[0]
    })];
  });
}

// Unlike serviceWorkerStrictRegistrationPattern that only matches SW registration scripts that contain URLs,
// serviceWorkerLaxRegistrationPattern matches any call to the SW registration script (e.g. passing a variable, etc).
const serviceWorkerLaxRegistrationPattern = /navigator\.serviceWorker\.register\(([^)]*)\)/g;
const serviceWorkerRegistrationInfo = getInfoForPattern(serviceWorkerLaxRegistrationPattern, true);

const workboxPattern = /(?:workbox:[a-z\-]+:[\d.]+|workbox\.[a-zA-Z]+\.?[a-zA-Z]*)/g;
const workboxInfo = getInfoForPattern(workboxPattern);

const importScriptsPattern = /importScripts\(([^)]*)\)/g;
const importScriptsInfo = getInfoForPattern(importScriptsPattern, true);

const swEventListenersPattern = /addEventListener\(\s*[\'"](install|activate|push|fetch|notificationclick|notificationclose|sync|canmakepayment|paymentrequest|periodicsync|backgroundfetchsuccess|backgroundfetchfailure|backgroundfetchabort|backgroundfetchclick)[\'"]/g;
const swEventListenersInfo = getInfoForPattern(swEventListenersPattern, true);

const swPropertiesPattern = /\.on(install|activate|push|notificationclick|notificationclose|sync|canmakepayment|paymentrequest|periodicsync|backgroundfetchsuccess|backgroundfetchfailure|backgroundfetchabort|backgroundfetchclick)\s*=/g;
const swPropertiesInfo = getInfoForPattern(swPropertiesPattern, true);

const swMethodsPattern = /skipWaiting\(\)/g;
const swMethodsInfo = getInfoForPattern(swMethodsPattern);

const swObjectsPattern = /clients\.(get|matchAll|openWindow|claim)|client\.(postMessage|id|type|url)|caches\.(match|has|open|delete|keys)|cache\.(match|matchAll|add|addAll|put|keys)/g;
const swObjectsInfo = getInfoForPattern(swObjectsPattern);

const swRegistrationPropertiesPattern = /navigationPreload\.(enable|disable|setHeaderValue|getState)|pushManager\.(getSubscription|permissionState|subscribe)|sync\.(register|getTags)/g;
const swRegistrationPropertiesInfo = getInfoForPattern(swRegistrationPropertiesPattern);

const windowEventListenersPattern = /addEventListener\(\s*[\'"](appinstalled|beforeinstallprompt)[\'"]/g;
const windowEventListenersInfo = getInfoForPattern(windowEventListenersPattern, true);

const windowPropertiesPattern = /\.on(appinstalled|beforeinstallprompt)\s*=/g;
const windowPropertiesInfo = getInfoForPattern(windowPropertiesPattern, true);

// the sw heuristics returns true if a strong service worker indicator (serviceWorkers) exists, or if at least two weak indicators are present.
function calculateServiceWorkerHeuristic() {
  return !isObjectKeyEmpty(serviceWorkers) || containsEnoughWeakMethods();
}

// returns true if the number of "weak" methods to identify service workers is >= 2.
function containsEnoughWeakMethods() {

  var weakMethodCount = 0;

  weakMethodCount+= isObjectKeyEmpty(serviceWorkerRegistrationInfo) ? 0 : 1;
  weakMethodCount+= isObjectKeyEmpty(workboxInfo) ? 0 : 1;
  weakMethodCount+= isObjectKeyEmpty(swEventListenersInfo) ? 0 : 1;
  weakMethodCount+= isObjectKeyEmpty(swMethodsInfo) ? 0 : 1;

  return weakMethodCount >= 2;
}

function isObjectKeyEmpty(field) {
  return field == null || field.length == 0;
}

return {
  serviceWorkers: Object.fromEntries(serviceWorkers),
  manifests: Object.fromEntries(manifests),
  serviceWorkerInitiated: Object.keys(Object.fromEntries(serviceWorkerInitiated)),
  workboxInfo: Object.fromEntries(workboxInfo),
  importScriptsInfo: Object.fromEntries(importScriptsInfo),
  swEventListenersInfo: Object.fromEntries(swEventListenersInfo),
  swPropertiesInfo: Object.fromEntries(swPropertiesInfo),
  swMethodsInfo: Object.fromEntries(swMethodsInfo),
  swObjectsInfo: Object.fromEntries(swObjectsInfo),
  swRegistrationPropertiesInfo: Object.fromEntries(swRegistrationPropertiesInfo),
  windowEventListenersInfo: Object.fromEntries(windowEventListenersInfo),
  windowPropertiesInfo: Object.fromEntries(windowPropertiesInfo),
  serviceWorkerRegistrationInfo: Object.fromEntries(serviceWorkerRegistrationInfo),
  //Experimental field: Heuristic to detect if a site has a service worker even if the 'serviceWorkers' field is empty (false positives).
  serviceWorkerHeuristic: calculateServiceWorkerHeuristic()
};
