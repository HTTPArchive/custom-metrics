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

  traverse(ast, {
    VariableDeclarator(p) {
      if (p.node.id.type === 'Identifier' && p.node.init && p.node.init.type === 'ObjectExpression') {
        scopeBindings[p.node.id.name] = p.node.init;
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
    returnedKeys: Array.from(returnedKeys)
  };
}

/**
 * Validates JSDoc parity against code.
 */
function validateMetric(filePath) {
  const fileName = path.basename(filePath);
  const { typedefs, returnedKeys } = analyzeMetricFile(filePath);
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

  // Check 3: Check property completeness (type & description)
  for (const [typeName, typedef] of typedefs) {
    for (const prop of typedef.properties) {
      if (!prop.type) {
        errors.push(`Property "${prop.name}" in @typedef ${typeName} is missing a type definition.`);
      }
      if (!prop.description || prop.description.trim() === '') {
        errors.push(`Property "${prop.name}" in @typedef ${typeName} is missing a description.`);
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
  const targetFiles = args.length > 0 
    ? args.map(f => path.resolve(f))
    : getAnnotatedMetricFiles();

  let totalErrors = 0;

  for (const file of targetFiles) {
    const relPath = path.relative(process.cwd(), file);
    console.log(`Validating ${relPath}...`);
    const result = validateMetric(file);

    if (result.valid) {
      console.log(`✅ ${relPath} passed validation (${result.returnedKeys.length} keys documented).\n`);
    } else {
      console.error(`❌ ${relPath} failed validation:`);
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
  analyzeMetricFile,
  validateMetric
};
