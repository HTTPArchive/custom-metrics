/**
 * Content Visibility Custom Metric - Optimized Version
 * 
 * Analyzes CSS usage of the content-visibility property using efficient
 * regex-based detection with performance optimizations.
 */

//[content-visibility]

(() => {
  /**
   * Extract content-visibility declarations from CSS using regex
   * @param {string} css - The CSS string to analyze
   * @returns {Array} Array of content-visibility values found
   */
  function extractContentVisibilityValues(css) {
    if (!css || typeof css !== 'string') {
      return [];
    }

    const contentVisibilityValues = [];

    // Remove CSS comments first
    css = css.replace(/\/\*[\s\S]*?\*\//g, '');

    // Regex to match content-visibility property declarations
    // Matches: content-visibility: value; or content-visibility: value
    const contentVisibilityRegex = /content-visibility\s*:\s*([^;}\s]+(?:\s+[^;}\s]+)*)/gi;
    let regexMatch;

    while ((regexMatch = contentVisibilityRegex.exec(css)) !== null) {
      const value = regexMatch[1].trim();
      if (value) {
        contentVisibilityValues.push(value);
      }
    }

    return contentVisibilityValues;
  }

  /**
   * Optimized function to get unique values without Set
   * @param {Array} values - Array of values
   * @returns {Array} Array of unique values
   */
  function getUniqueValues(values) {
    const unique = [];
    const seen = {};

    for (let valueIndex = 0; valueIndex < values.length; valueIndex++) {
      const value = values[valueIndex];
      if (!seen[value]) {
        seen[value] = true;
        unique.push(value);
      }
    }

    return unique;
  }

  /**
   * Custom metric to analyze content-visibility usage with optimizations
   * @returns {Object} Content visibility analysis results
   */
  function contentVisibility() {
    const contentVisibilityValues = [];

    // Process stylesheets first (usually largest source)
    const stylesheets = $WPT_BODIES.filter(body => body.type === 'Stylesheet');
    for (let stylesheetIndex = 0; stylesheetIndex < stylesheets.length; stylesheetIndex++) {
      const stylesheet = stylesheets[stylesheetIndex];
      if (stylesheet.response_body) {
        const values = extractContentVisibilityValues(stylesheet.response_body);
        contentVisibilityValues.push(...values);
      }
    }

    // Process style blocks (usually fewer elements)
    const styleElements = document.querySelectorAll('style');
    for (let styleIndex = 0; styleIndex < styleElements.length; styleIndex++) {
      const styleElement = styleElements[styleIndex];
      if (styleElement.innerHTML) {
        const values = extractContentVisibilityValues(styleElement.innerHTML);
        contentVisibilityValues.push(...values);
      }
    }

    // Process inline styles (most expensive - limit scope if possible)
    // Only process if we haven't found any content-visibility yet
    if (contentVisibilityValues.length === 0) {
      const elementsWithStyle = document.querySelectorAll('[style]');
      for (let elementIndex = 0; elementIndex < elementsWithStyle.length; elementIndex++) {
        const elementWithStyle = elementsWithStyle[elementIndex];
        const styleAttr = elementWithStyle.getAttribute('style');
        if (styleAttr && styleAttr.includes('content-visibility')) {
          const values = extractContentVisibilityValues(styleAttr);
          contentVisibilityValues.push(...values);
        }
      }
    }

    return {
      used: contentVisibilityValues.length > 0,
      count: contentVisibilityValues.length,
      values: contentVisibilityValues,
      uniqueValues: getUniqueValues(contentVisibilityValues)
    };
  }

  return contentVisibility();
})();