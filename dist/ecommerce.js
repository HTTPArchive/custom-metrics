//[ecommerce]
// Uncomment the previous line for testing on webpagetest.org

function fetchWithTimeout(url) {
  var controller = new AbortController();
  setTimeout(() => {controller.abort()}, 5000);
  return fetch(url, {signal: controller.signal});
}

function getShopifyMetadata() {
  return window.Shopify;
}

return Promise.all([
  fetchWithTimeout('/.well-known/assetlinks.json').then(function(r) {
    if(!r.redirected && r.status === 200) {
      return 1;
    } else {
      return 0;
    }
  }),
  fetchWithTimeout('/.well-known/apple-app-site-association').then(function(r) {
    if(!r.redirected && r.status === 200) {
      return 1;
    } else {
      return 0;
    }
  })
]).then(([AndroidAppLinks, iOSUniveralLinks]) => {
  return {
    AndroidAppLinks,
    iOSUniveralLinks
  };
}).catch(error => {
  return {
    message: error.message,
    error: error
  };
}).then(result => {
  return {
    ...result,
    shopify: getShopifyMetadata()
  }
});
