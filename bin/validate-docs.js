#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { BASIC_TYPES, isTypeCompatible } = require('./lib/types.js');
const {
  parseJSDocTypedefs,
  getPrimaryTypedef,
  getAllDocumentedKeysForTypedef
} = require('./lib/jsdoc-parser.js');
const { extractReturnKeysAndNested } = require('./lib/ast-extractor.js');
const {
  REQUIRED_METRICS,
  getAnnotatedMetricFiles,
  validateMetricCoverage
} = require('./lib/file-utils.js');

/**
 * Validates bidirectional parity between JavaScript code and JSDoc annotations.
 */
function validateMetric(filePath) {
  const fileName = path.basename(filePath);
  const metricName = path.basename(filePath, '.js');
  const code = fs.readFileSync(filePath, 'utf8');

  const typedefs = parseJSDocTypedefs(code);
  const { returnedKeys, nestedReturnKeys, propertyTypes } = extractReturnKeysAndNested(code);
  const errors = [];

  if (typedefs.size === 0) {
    errors.push(`No JSDoc @typedef found in ${fileName}. Please document the metric with @typedef and @property.`);
    return { valid: false, errors, typedefs, returnedKeys, nestedReturnKeys };
  }

  const primaryTypedef = getPrimaryTypedef(metricName, typedefs);
  if (!primaryTypedef) {
    errors.push(`Could not determine primary @typedef for ${metricName} in ${fileName}.`);
    return { valid: false, errors, typedefs, returnedKeys, nestedReturnKeys };
  }

  const documentedPropertyMap = new Map(primaryTypedef.properties.map(p => [p.name, p]));

  // Check 1: All returned keys from code must be documented in primary typedef
  for (const key of returnedKeys) {
    if (!documentedPropertyMap.has(key)) {
      errors.push(`Missing JSDoc documentation for returned property: "${key}"`);
    }
  }

  // Check 2: No stale properties documented in primary typedef that aren't returned
  if (returnedKeys.length > 0) {
    for (const [propName] of documentedPropertyMap) {
      if (!returnedKeys.includes(propName)) {
        errors.push(`Stale JSDoc property: "${propName}" is documented in @typedef ${primaryTypedef.name} but not returned in code.`);
      }
    }
  }

  // Check 3: Property completeness, recursive type validity, and AST static type compatibility
  for (const [typeName, typedef] of typedefs) {
    for (const prop of typedef.properties) {
      if (!prop.type) {
        errors.push(`Property "${prop.name}" in @typedef ${typeName} is missing a type definition.`);
        continue;
      }
      if (!prop.description || prop.description.trim() === '') {
        errors.push(`Property "${prop.name}" in @typedef ${typeName} is missing a description.`);
      }

      // Check referenced types in unions / arrays
      const cleanType = prop.type.replace(/^{|}$/g, '');
      const typeParts = cleanType.split('|').map(p => p.trim());

      for (const part of typeParts) {
        if (/^Object\.<[^>]+>$/i.test(part) || /^Record<[^>]+>$/i.test(part)) continue;
        const unwrapArray = part.replace(/^Array<(.+)>$/i, '$1').replace(/\[\]$/, '').trim();
        const lower = unwrapArray.toLowerCase();

        if (!BASIC_TYPES.has(lower) && !typedefs.has(unwrapArray)) {
          errors.push(
            `Property "${prop.name}" in @typedef ${typeName} references custom type "${unwrapArray}", but no @typedef for "${unwrapArray}" is defined in the file.`
          );
        }
      }

      // Check AST static type compatibility if inferred from code
      const inferred = propertyTypes[prop.name];
      if (inferred && !isTypeCompatible(inferred, prop.type)) {
        errors.push(
          `Type mismatch for property "${prop.name}" in @typedef ${typeName}: code assigns ${inferred}, but JSDoc documents ${prop.type}.`
        );
      }
    }
  }

  // Check 4: Nested object parity (validate IIFE/object returned keys against referenced sub-typedefs)
  for (const [propName, subKeys] of Object.entries(nestedReturnKeys)) {
    const parentProp = documentedPropertyMap.get(propName);
    if (!parentProp || !parentProp.type) continue;

    const cleanType = parentProp.type.replace(/^{|}$/g, '');
    const parts = cleanType.split('|').map(p => p.trim()).filter(p => p !== 'null' && p !== 'undefined');

    for (const part of parts) {
      const customTypeName = part.replace(/^Array<(.+)>$/i, '$1').replace(/\[\]$/, '').trim();
      if (typedefs.has(customTypeName)) {
        const allDocKeys = getAllDocumentedKeysForTypedef(customTypeName, typedefs);

        // Check each returned key in code is in sub-typedef tree
        for (const subKey of subKeys) {
          if (!allDocKeys.has(subKey)) {
            errors.push(`Missing JSDoc documentation in @typedef ${customTypeName} (or child typedefs) for nested property "${propName}.${subKey}".`);
          }
        }

        // Check each documented key in sub-typedef tree is returned in code
        for (const docSubKey of allDocKeys) {
          if (!subKeys.includes(docSubKey)) {
            errors.push(`Stale JSDoc property "${docSubKey}" in @typedef ${customTypeName} is not returned by "${propName}" in code.`);
          }
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    typedefs,
    returnedKeys,
    nestedReturnKeys
  };
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  let totalErrors = 0;

  // Step 1: Check JSDoc Coverage if running general validation
  if (args.length === 0) {
    console.log('Checking JSDoc coverage for required metrics...');
    const coverage = validateMetricCoverage();
    if (!coverage.valid) {
      console.error('❌ JSDoc coverage check failed:');
      for (const err of coverage.errors) {
        console.error(`   - ${err}`);
      }
      console.error('');
      totalErrors += coverage.errors.length;
    } else {
      console.log(`✅ All required metrics covered by JSDoc (${coverage.targetFiles.length} file(s)).\n`);
    }
  }

  // Step 2: Validate JSDoc Parity vs Code AST
  const targetFiles = args.length > 0
    ? args.map(f => path.resolve(f))
    : getAnnotatedMetricFiles();

  for (const file of targetFiles) {
    const relPath = path.relative(process.cwd(), file);
    console.log(`Validating JSDoc parity for ${relPath}...`);
    const result = validateMetric(file);

    if (result.valid) {
      console.log(`✅ ${relPath} passed parity validation (${result.returnedKeys.length} keys documented).\n`);
    } else {
      console.error(`❌ ${relPath} failed parity validation:`);
      for (const err of result.errors) {
        console.error(`   - ${err}`);
      }
      console.error('');
      totalErrors += result.errors.length;
    }
  }

  process.exit(totalErrors === 0 ? 0 : 1);
}

module.exports = {
  REQUIRED_METRICS,
  validateMetric,
  validateMetricCoverage
};
