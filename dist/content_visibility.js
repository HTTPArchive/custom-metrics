//[content_visibility]
// Uncomment the previous line for testing on webpagetest.org

function extractContentVisibilityFromAST(ast) {
  const contentVisibilityValues = [];

  if (!ast || !Array.isArray(ast)) {
    return contentVisibilityValues;
  }

  const rulesToProcess = [...ast];

  while (rulesToProcess.length > 0) {
    const rule = rulesToProcess.shift();

    if (rule.type === 'rule' && rule.declarations) {
      // Process regular CSS rules
      for (const declaration of rule.declarations) {
        if (declaration.type === 'declaration' &&
            declaration.property &&
            declaration.property.toLowerCase() === 'content-visibility' &&
            declaration.value) {
          contentVisibilityValues.push(declaration.value.trim());
        }
      }
    } else if (rule.type === 'media' && rule.rules) {
      rulesToProcess.push(...rule.rules);
    } else if (rule.type === 'supports' && rule.rules) {
      rulesToProcess.push(...rule.rules);
    } else if (rule.type === 'keyframes' && rule.keyframes) {
      for (const keyframe of rule.keyframes) {
        if (keyframe.declarations) {
          for (const declaration of keyframe.declarations) {
            if (declaration.type === 'declaration' &&
                declaration.property &&
                declaration.property.toLowerCase() === 'content-visibility' &&
                declaration.value) {
              contentVisibilityValues.push(declaration.value.trim());
            }
          }
        }
      }
    }
  }

  return contentVisibilityValues;
}

function getUniqueValues(values) {
  const unique = [];
  const seen = {};
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    if (!seen[value]) {
      seen[value] = true;
      unique.push(value);
    }
  }
  return unique;
}

const contentVisibilityValues = [];

if (typeof parsed_css !== 'undefined' && Array.isArray(parsed_css)) {
  for (const cssData of parsed_css) {
    if (cssData && cssData.ast) {
      const values = extractContentVisibilityFromAST(cssData.ast);
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
