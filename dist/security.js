//[security]
// Uncomment the previous line for testing on webpagetest.org

const response_bodies = $WPT_BODIES.filter(body => body.type === 'Document' || body.type === 'Script')

/**
 * @function testPropertyStringInResponseBodies
 * Test that a JS property string is accessed in response bodies
 * (given that wrapping properties to log accesses is not possible as metrics run at the end)
 * only in Document and Script resources (HTML/JS)
 * inspired by https://github.com/HTTPArchive/legacy.httparchive.org/blob/master/custom_metrics/event-names.js
 * From: https://github.com/HTTPArchive/custom-metrics/blob/main/dist/privacy.js#L11
 *
 * @param {string} pattern - Regex pattern to match in the response bodies.
 * @return {boolean} - True, if pattern was matched.
 */
function testPropertyStringInResponseBodies(pattern) {
  try {
    let re = new RegExp(pattern);
    return response_bodies
      .some(body => {
        if (body.response_body) {
          return re.test(body.response_body);
        } else {
          return false;
        }
      });
  } catch (error) {
    return error.toString();
  }
}

return JSON.stringify({
  "iframe-allow-sandbox": (() => {
    const link = document.createElement('a');
    return Array.from(document.querySelectorAll('iframe[allow], iframe[sandbox]')).map((iframe) => {
      link.href = iframe.src;
      return {
        "allow": iframe.getAttribute('allow'),
        "sandbox": iframe.getAttribute('sandbox'),
        "hostname": link.origin
      }
    })
  })(),
  "sri-integrity": Array.from(document.querySelectorAll('[integrity]')).map((element) => {
    return {
      "integrity": element.getAttribute('integrity'),
      "src": element.getAttribute('src') || element.getAttribute('href'),
      "tagname": element.tagName.toLowerCase()
    }
  }),
  "visibility-observer": testPropertyStringInResponseBodies("VisibilityObserver")
});
