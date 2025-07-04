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

    try {
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
    } catch (error) {
      // Return empty array if regex processing fails
      return [];
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

    try {
      for (let valueIndex = 0; valueIndex < values.length; valueIndex++) {
        const value = values[valueIndex];
        if (!seen[value]) {
          seen[value] = true;
          unique.push(value);
        }
      }
    } catch (error) {
      // Return original array if deduplication fails
      return values;
    }

    return unique;
  }

  /**
   * Custom metric to analyze content-visibility usage with optimizations
   * @returns {Object} Content visibility analysis results
   */
  function contentVisibility() {
    const contentVisibilityValues = [];
    let debugInfo = {
      stylesheetsProcessed: 0,
      styleBlocksProcessed: 0,
      inlineStylesProcessed: 0,
      errors: []
    };

    try {
      // Process stylesheets first (usually largest source)
      if (typeof $WPT_BODIES !== 'undefined' && Array.isArray($WPT_BODIES)) {
        const stylesheets = $WPT_BODIES.filter(body => body.type === 'Stylesheet');
        debugInfo.stylesheetsProcessed = stylesheets.length;

        for (let stylesheetIndex = 0; stylesheetIndex < stylesheets.length; stylesheetIndex++) {
          const stylesheet = stylesheets[stylesheetIndex];
          if (stylesheet && stylesheet.response_body) {
            const values = extractContentVisibilityValues(stylesheet.response_body);
            contentVisibilityValues.push(...values);
          }
        }
      }

      // Process style blocks (usually fewer elements)
      if (typeof document !== 'undefined' && document.querySelectorAll) {
        try {
          const styleElements = document.querySelectorAll('style');
          debugInfo.styleBlocksProcessed = styleElements.length;

          for (let styleIndex = 0; styleIndex < styleElements.length; styleIndex++) {
            const styleElement = styleElements[styleIndex];
            if (styleElement && styleElement.innerHTML) {
              const values = extractContentVisibilityValues(styleElement.innerHTML);
              contentVisibilityValues.push(...values);
            }
          }
        } catch (error) {
          debugInfo.errors.push('style_blocks_error: ' + error.message);
        }
      }

      // Process inline styles (most expensive - limit scope if possible)
      // Only process if we haven't found any content-visibility yet
      if (contentVisibilityValues.length === 0 && typeof document !== 'undefined' && document.querySelectorAll) {
        try {
          const elementsWithStyle = document.querySelectorAll('[style]');
          debugInfo.inlineStylesProcessed = elementsWithStyle.length;

          for (let elementIndex = 0; elementIndex < elementsWithStyle.length; elementIndex++) {
            const elementWithStyle = elementsWithStyle[elementIndex];
            if (elementWithStyle) {
              const styleAttr = elementWithStyle.getAttribute('style');
              if (styleAttr && styleAttr.includes('content-visibility')) {
                const values = extractContentVisibilityValues(styleAttr);
                contentVisibilityValues.push(...values);
              }
            }
          }
        } catch (error) {
          debugInfo.errors.push('inline_styles_error: ' + error.message);
        }
      }

      return {
        used: contentVisibilityValues.length > 0,
        count: contentVisibilityValues.length,
        values: contentVisibilityValues,
        uniqueValues: getUniqueValues(contentVisibilityValues),
        debug: debugInfo
      };
    } catch (error) {
      // Return a safe fallback if the entire function fails
      return {
        used: false,
        count: 0,
        values: [],
        uniqueValues: [],
        debug: {
          ...debugInfo,
          errors: [...debugInfo.errors, 'main_error: ' + error.message]
        }
      };
    }
  }

  // Try to execute the metric, with ultimate fallback
  try {
    return contentVisibility();
  } catch (error) {
    // Ultimate fallback - if even the main function fails
    return {
      used: false,
      count: 0,
      values: [],
      uniqueValues: [],
      debug: {
        stylesheetsProcessed: 0,
        styleBlocksProcessed: 0,
        inlineStylesProcessed: 0,
        errors: ['ultimate_error: ' + error.message]
      }
    };
  }
})();
