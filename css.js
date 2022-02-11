//[css]
// Uncomment the previous line for testing on webpagetest.org

const PREFERS_COLOR_SCHEME_REGEXP =
  /(?:@media\s*\(\s*prefers-color-scheme\s*:\s*(?:dark|light)\s*\)\s*\{[^\}]*\}|matchMedia\s*\(\s*['"]\s*\(\s*prefers-color-scheme\s*:\s*(?:dark|light)\s*\)\s*['"]\s*\))/gms;

const bodies = $WPT_BODIES;

return JSON.stringify({
  css_in_js: (() => {
    const CssInJsMap = {
      'Styled Components': !!document.querySelector(
        'style[data-styled],style[data-styled-components]',
      ),
      Radium: !!document.querySelector('[data-radium]'),
      JSS: !!document.querySelector('[data-jss]'),
      Emotion: !!document.querySelector('[data-emotion]'),
      Goober: !!document.getElementById('_goober'),
      'Merge Styles': !!document.querySelector('[data-merge-styles]'),
      'Styled Jsx': !!document.querySelector('style[id*="__jsx-"]'),
      Aphrodite: !!document.querySelector('[data-aphrodite]'),
      Fela: !!document.querySelector('[data-fela-stylesheet]'),
      Styletron: !!document.querySelector(
        '[data-styletron],._styletron_hydrate_',
      ),
      'React Native for Web': !!document.querySelector(
        '#react-native-stylesheet',
      ),
      Glamor: !!document.querySelector('[data-glamor]'),
    };

    const usedLibraries = [];
    for (l in CssInJsMap) {
      if (CssInJsMap[l]) {
        usedLibraries.push(l);
      }
    }

    return usedLibraries;
  })(),
  // Checks in two passes:
  // 1. The response bodies.
  // 2. The `link[media]` attribute of conditionally loaded stylesheets in the
  //    ternary expression if step 1. returns `false`.
  prefersColorScheme:
    bodies.some((request) => {
      return (
        (request.type === 'Stylesheet' || request.type === 'Script') &&
        PREFERS_COLOR_SCHEME_REGEXP.test(request.response_body || '')
      );
    }) ||
    // If none of the response bodies match, alternatively check if any of the
    // stylesheet `link`s load conditionally based on `prefers-color-scheme`.
    document.querySelectorAll(
      'link[rel="stylesheet"][media*="prefers-color-scheme"]',
    ).length > 0,
});
