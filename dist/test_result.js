// Fails the test if the resulting page was on a different origin from where the test started
const sameOrigin = function(uri1, uri2){
  try {
      uri1 = new URL(uri1);
      uri2 = new URL(uri2);
      return uri1.origin == uri2.origin;
  } catch(e) {
  }
  return false;
}
const testUrl = $WPT_TEST_URL;
const currentUrl = document.location.href.split('#')[0];
if (sameOrigin(testUrl, currentUrl)) {
  return 0;  // No change
}
return 888;
