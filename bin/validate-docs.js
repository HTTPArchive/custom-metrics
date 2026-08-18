#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const { parse: parseJSDoc } = require('comment-parser');

/**
 * Extracts object property keys from an AST ObjectExpression node.
 * Handles spread elements if the referenced identifier is found in variable declarations.
 */
function extractObjectKeys(objNode, scopeBindings = {}) {
  const keys = new Set();

  for (const prop of objNode.properties) {
    if (prop.type === 'ObjectProperty') {
      if (prop.key.type === 'Identifier') {
        keys.add(prop.key.name);
      } else if (prop.key.type === 'StringLiteral') {
        keys.add(prop.key.value);
      }
    } else if (prop.type === 'SpreadElement') {
      if (prop.argument.type === 'Identifier') {
        const idName = prop.argument.name;
        if (scopeBindings[idName]) {
          const spreadKeys = extractObjectKeys(scopeBindings[idName], scopeBindings);
          for (const k of spreadKeys) keys.add(k);
        }
      } else if (prop.argument.type === 'ObjectExpression') {
        const spreadKeys = extractObjectKeys(prop.argument, scopeBindings);
        for (const k of spreadKeys) keys.add(k);
      }
    }
  }

  return keys;
}

/**
 * Parses a custom metric file and extracts code-returned keys and JSDoc typedefs.
 */
function analyzeMetricFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');

  // 1. Parse JSDoc Comments
  const parsedComments = parseJSDoc(code, { spacing: 'preserve' });
  const typedefs = new Map();

  for (const block of parsedComments) {
    const typedefTag = block.tags.find(t => t.tag === 'typedef');
    if (!typedefTag) continue;

    const typeName = typedefTag.name;
    const typeDesc = block.description || typedefTag.description || '';
    const properties = [];

    for (const tag of block.tags) {
      if (tag.tag === 'property' || tag.tag === 'prop') {
        properties.push({
          name: tag.name,
          type: tag.type,
          description: tag.description.trim(),
          optional: tag.optional
        });
      }
    }

    typedefs.set(typeName, {
      name: typeName,
      description: typeDesc.trim(),
      properties
    });
  }

  // 2. Parse JS AST
  const ast = parser.parse(code, {
    sourceType: 'script',
    allowReturnOutsideFunction: true,
    allowAwaitOutsideFunction: true,
    plugins: []
  });

  const scopeBindings = {};
  const returnedKeys = new Set();
  const nestedReturnKeys = {};

  function extractKeysFromNode(node) {
    const keys = new Set();
    if (!node) return keys;

    if (node.type === 'ObjectExpression') {
      const objKeys = extractObjectKeys(node, scopeBindings);
      for (const k of objKeys) keys.add(k);
    } else if (node.type === 'CallExpression') {
      const callee = node.callee;
      if (callee.type === 'ArrowFunctionExpression' || callee.type === 'FunctionExpression') {
        traverse(callee, {
          noScope: true,
          ObjectExpression(path) {
            const objKeys = extractObjectKeys(path.node, scopeBindings);
            for (const k of objKeys) keys.add(k);
          },
          AssignmentExpression(path) {
            const left = path.node.left;
            if (left.type === 'MemberExpression' && left.property.type === 'Identifier') {
              keys.add(left.property.name);
            }
          }
        });
      }
    }
    return keys;
  }

  traverse(ast, {
    VariableDeclarator(p) {
      if (p.node.id.type === 'Identifier' && p.node.init && p.node.init.type === 'ObjectExpression') {
        scopeBindings[p.node.id.name] = p.node.init;

        // Extract nested keys for each object property
        for (const prop of p.node.init.properties) {
          if (prop.type === 'ObjectProperty' && prop.key.name) {
            const innerKeys = extractKeysFromNode(prop.value);
            if (innerKeys.size > 0) {
              nestedReturnKeys[prop.key.name] = Array.from(innerKeys);
            }
          }
        }
      }
    },
    ReturnStatement(p) {
      // Only process top-level return statements in the WPT script
      if (p.parent.type !== 'Program') return;

      const arg = p.node.argument;
      if (!arg) return;

      function extractFromExpression(expr) {
        if (!expr) return;

        // Pattern: JSON.stringify(OBJ)
        if (
          expr.type === 'CallExpression' &&
          expr.callee.type === 'MemberExpression' &&
          expr.callee.object.name === 'JSON' &&
          expr.callee.property.name === 'stringify' &&
          expr.arguments.length > 0
        ) {
          const jsonArg = expr.arguments[0];
          if (jsonArg.type === 'ObjectExpression') {
            const keys = extractObjectKeys(jsonArg, scopeBindings);
            for (const k of keys) returnedKeys.add(k);
          } else if (jsonArg.type === 'Identifier' && scopeBindings[jsonArg.name]) {
            const keys = extractObjectKeys(scopeBindings[jsonArg.name], scopeBindings);
            for (const k of keys) returnedKeys.add(k);
          }
        }
        // Pattern: Promise.all(...).then(...) -> look for inner return
        else if (
          expr.type === 'CallExpression' &&
          expr.callee.type === 'MemberExpression' &&
          expr.callee.property.name === 'then'
        ) {
          const thenCallback = expr.arguments[0];
          if (thenCallback && (thenCallback.type === 'ArrowFunctionExpression' || thenCallback.type === 'FunctionExpression')) {
            if (thenCallback.body.type === 'BlockStatement') {
              for (const stmt of thenCallback.body.body) {
                if (stmt.type === 'ReturnStatement') {
                  extractFromExpression(stmt.argument);
                }
              }
            } else {
              extractFromExpression(thenCallback.body);
            }
          }
        }
        // Direct ObjectExpression
        else if (expr.type === 'ObjectExpression') {
          const keys = extractObjectKeys(expr, scopeBindings);
          for (const k of keys) returnedKeys.add(k);
        }
      }

      extractFromExpression(arg);
    }
  });

  return {
    code,
    typedefs,
    returnedKeys: Array.from(returnedKeys),
    nestedReturnKeys
  };
}

/**
 * Validates JSDoc parity against code.
 */
function validateMetric(filePath) {
  const fileName = path.basename(filePath);
  const { typedefs, returnedKeys, nestedReturnKeys } = analyzeMetricFile(filePath);
  const errors = [];

  if (typedefs.size === 0) {
    errors.push(`No JSDoc @typedef found in ${fileName}. Please document the metric with @typedef and @property.`);
    return { valid: false, errors };
  }

  // Find the primary typedef (named *Metrics, or having highest overlap with returned keys)
  const metricBase = fileName.replace(/\.js$/, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  let primaryTypedef = null;

  for (const [name, td] of typedefs) {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanName.includes(metricBase) && cleanName.includes('metric')) {
      primaryTypedef = td;
      break;
    }
  }

  if (!primaryTypedef) {
    for (const td of typedefs.values()) {
      if (td.name.toLowerCase().endsWith('metrics')) {
        primaryTypedef = td;
        break;
      }
    }
  }

  if (!primaryTypedef) {
    primaryTypedef = Array.from(typedefs.values())[0];
  }

  const documentedPropertyMap = new Map(primaryTypedef.properties.map(p => [p.name, p]));

  // Check 1: All returned keys from code must be documented
  for (const key of returnedKeys) {
    if (!documentedPropertyMap.has(key)) {
      errors.push(`Missing JSDoc documentation for returned property: "${key}"`);
    }
  }

  // Check 2: No extraneous properties documented in JSDoc that aren't returned
  if (returnedKeys.length > 0) {
    for (const [propName] of documentedPropertyMap) {
      if (!returnedKeys.includes(propName)) {
        errors.push(`Stale JSDoc property: "${propName}" is documented in @typedef ${primaryTypedef.name} but not returned in code.`);
      }
    }
  }

  // Check 3: Check property completeness and recursive type validity down to basic types
  const BASIC_TYPES = new Set(['string', 'number', 'integer', 'boolean', 'object', 'any', 'unknown', 'null', 'undefined']);

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
    }
  }

  function getAllDocumentedKeysForTypedef(typeName, visited = new Set()) {
    const keys = new Set();
    if (!typedefs.has(typeName) || visited.has(typeName)) return keys;
    visited.add(typeName);

    const td = typedefs.get(typeName);
    for (const prop of td.properties) {
      keys.add(prop.name);
      if (prop.type) {
        const clean = prop.type.replace(/^{|}$/g, '');
        const parts = clean.split('|').map(p => p.trim());
        for (const part of parts) {
          const childTypeName = part.replace(/^Array<(.+)>$/i, '$1').replace(/\[\]$/, '').trim();
          if (typedefs.has(childTypeName)) {
            const childKeys = getAllDocumentedKeysForTypedef(childTypeName, visited);
            for (const ck of childKeys) keys.add(ck);
          }
        }
      }
    }
    return keys;
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
        const allDocKeys = getAllDocumentedKeysForTypedef(customTypeName);

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
    returnedKeys
  };
}

// Whitelist of metric files required to have JSDoc documentation.
// Set to null or ['*'] to require JSDoc for all files in dist/.
const REQUIRED_METRICS = [
  'privacy.js'
];

/**
 * Validates that all required metrics in dist/ have JSDoc metric documentation.
 */
function validateMetricCoverage(requiredList = REQUIRED_METRICS) {
  const distDir = path.join(__dirname, '../dist');
  const allFiles = fs.readdirSync(distDir).filter(f => f.endsWith('.js') && f !== '00_reset.js');
  const requiredFiles = (requiredList === null || requiredList.includes('*'))
    ? allFiles
    : requiredList;

  const errors = [];
  const metricsTypedefRegex = /@typedef\s+\{[^}]+\}\s+\w+Metrics/i;

  for (const fileName of requiredFiles) {
    const filePath = path.join(distDir, fileName);
    if (!fs.existsSync(filePath)) {
      errors.push(`Required metric file does not exist: dist/${fileName}`);
      continue;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    if (!metricsTypedefRegex.test(content)) {
      errors.push(`dist/${fileName} is missing top-level JSDoc @typedef {Object} <Name>Metrics documentation.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    targetFiles: requiredFiles.map(f => path.join(distDir, f))
  };
}

function getAnnotatedMetricFiles() {
  const distDir = path.join(__dirname, '../dist');
  const files = fs.readdirSync(distDir).filter(f => f.endsWith('.js'));
  const annotated = [];
  const metricsTypedefRegex = /@typedef\s+\{[^}]+\}\s+\w+Metrics/i;

  for (const f of files) {
    const fullPath = path.join(distDir, f);
    const content = fs.readFileSync(fullPath, 'utf8');
    if (metricsTypedefRegex.test(content)) {
      annotated.push(fullPath);
    }
  }
  return annotated;
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
  analyzeMetricFile,
  validateMetric,
  validateMetricCoverage
};
