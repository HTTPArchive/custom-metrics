'use strict';

const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

/**
 * Infers primitive data type from an AST node expression.
 */
function inferTypeFromNode(node) {
  if (!node) return null;

  if (node.type === 'BooleanLiteral') return 'boolean';
  if (node.type === 'NumericLiteral') {
    return Number.isInteger(node.value) ? 'integer' : 'number';
  }
  if (node.type === 'StringLiteral' || node.type === 'TemplateLiteral') return 'string';
  if (node.type === 'NullLiteral') return 'null';
  if (node.type === 'ArrayExpression') return 'array';
  if (node.type === 'ObjectExpression') return 'object';

  if (node.type === 'UnaryExpression') {
    if (node.operator === '!') return 'boolean';
    if (node.operator === '+' || node.operator === '-') return 'number';
    if (node.operator === 'typeof') return 'string';
  }

  if (node.type === 'BinaryExpression') {
    if (['===', '!==', '==', '!=', '<', '<=', '>', '>=', 'instanceof', 'in'].includes(node.operator)) {
      return 'boolean';
    }
    if (['+', '-', '*', '/', '%'].includes(node.operator)) {
      return 'number';
    }
  }

  if (node.type === 'MemberExpression' && node.property.type === 'Identifier') {
    const prop = node.property.name;
    if (['redirected', 'ok', 'bodyUsed'].includes(prop)) return 'boolean';
    if (['status', 'length', 'size', 'count'].includes(prop)) return 'integer';
    if (['url', 'statusText', 'name', 'message'].includes(prop)) return 'string';
  }

  if (node.type === 'CallExpression') {
    if (node.callee.type === 'Identifier') {
      const fn = node.callee.name;
      if (['isPresent', 'Boolean'].includes(fn)) return 'boolean';
      if (['parseInt', 'Math.floor', 'Math.round', 'Math.ceil'].includes(fn)) return 'integer';
      if (['Number', 'parseFloat'].includes(fn)) return 'number';
      if (['String'].includes(fn)) return 'string';
    } else if (node.callee.type === 'MemberExpression' && node.callee.property.type === 'Identifier') {
      const method = node.callee.property.name;
      if (['includes', 'some', 'every', 'startsWith', 'endsWith', 'has'].includes(method)) return 'boolean';
      if (['toLowerCase', 'toUpperCase', 'trim', 'trimStart', 'trimEnd', 'substring', 'substr'].includes(method)) return 'string';
      if (['split', 'slice', 'concat', 'filter', 'map'].includes(method)) return 'array';
      if (node.callee.object && node.callee.object.name === 'Array' && method === 'from') return 'array';
      if (node.callee.object && node.callee.object.name === 'JSON' && method === 'stringify') return 'string';
      if (node.callee.object && node.callee.object.name === 'JSON' && method === 'parse') return 'object';
    }
  }

  if (node.type === 'ConditionalExpression') {
    const consType = inferTypeFromNode(node.consequent);
    const altType = inferTypeFromNode(node.alternate);
    if (consType && altType && consType === altType) return consType;
    if (consType && altType) return `${consType}|${altType}`;
    return consType || altType || null;
  }

  return null;
}

/**
 * Extracts object property keys from an AST ObjectExpression node.
 * Handles spread elements if the referenced identifier is found in variable declarations.
 */
function extractObjectKeys(objNode, scopeBindings = {}, propertyTypes = {}) {
  const keys = new Set();

  for (const prop of objNode.properties) {
    if (prop.type === 'ObjectProperty') {
      let keyName = null;
      if (prop.key.type === 'Identifier') {
        keyName = prop.key.name;
      } else if (prop.key.type === 'StringLiteral') {
        keyName = prop.key.value;
      }

      if (keyName) {
        keys.add(keyName);
        const inferred = inferTypeFromNode(prop.value);
        if (inferred && !propertyTypes[keyName]) {
          propertyTypes[keyName] = inferred;
        }
      }
    } else if (prop.type === 'SpreadElement') {
      if (prop.argument.type === 'Identifier') {
        const idName = prop.argument.name;
        if (scopeBindings[idName]) {
          const spreadKeys = extractObjectKeys(scopeBindings[idName], scopeBindings, propertyTypes);
          for (const k of spreadKeys) keys.add(k);
        }
      } else if (prop.argument.type === 'ObjectExpression') {
        const spreadKeys = extractObjectKeys(prop.argument, scopeBindings, propertyTypes);
        for (const k of spreadKeys) keys.add(k);
      }
    }
  }

  return keys;
}

/**
 * Parses JavaScript code and extracts returned top-level keys, nested IIFE object properties,
 * and statically inferred property types.
 */
function extractReturnKeysAndNested(code) {
  const ast = parser.parse(code, {
    sourceType: 'script',
    allowReturnOutsideFunction: true,
    allowAwaitOutsideFunction: true,
    plugins: []
  });

  const scopeBindings = {};
  const returnedKeys = new Set();
  const nestedReturnKeys = {};
  const propertyTypes = {};

  function extractKeysFromNode(node) {
    const keys = new Set();
    if (!node) return keys;

    if (node.type === 'ObjectExpression') {
      const objKeys = extractObjectKeys(node, scopeBindings, propertyTypes);
      for (const k of objKeys) keys.add(k);
    } else if (node.type === 'CallExpression') {
      const callee = node.callee;
      if (callee.type === 'ArrowFunctionExpression' || callee.type === 'FunctionExpression') {
        traverse(callee, {
          noScope: true,
          ObjectExpression(path) {
            const objKeys = extractObjectKeys(path.node, scopeBindings, propertyTypes);
            for (const k of objKeys) keys.add(k);
          },
          AssignmentExpression(path) {
            const left = path.node.left;
            if (left.type === 'MemberExpression' && left.property.type === 'Identifier') {
              const keyName = left.property.name;
              keys.add(keyName);
              const inferred = inferTypeFromNode(path.node.right);
              if (inferred && !propertyTypes[keyName]) {
                propertyTypes[keyName] = inferred;
              }
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
        extractObjectKeys(p.node.init, scopeBindings, propertyTypes);

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
    AssignmentExpression(p) {
      if (p.node.left.type === 'MemberExpression' && p.node.left.property.type === 'Identifier') {
        const keyName = p.node.left.property.name;
        const inferred = inferTypeFromNode(p.node.right);
        if (inferred && !propertyTypes[keyName]) {
          propertyTypes[keyName] = inferred;
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
            const keys = extractObjectKeys(jsonArg, scopeBindings, propertyTypes);
            for (const k of keys) returnedKeys.add(k);
          } else if (jsonArg.type === 'Identifier' && scopeBindings[jsonArg.name]) {
            const keys = extractObjectKeys(scopeBindings[jsonArg.name], scopeBindings, propertyTypes);
            for (const k of keys) returnedKeys.add(k);
          }
        }
        // Pattern: Promise chains (.then, .catch, .finally)
        else if (
          expr.type === 'CallExpression' &&
          expr.callee.type === 'MemberExpression' &&
          ['then', 'catch', 'finally'].includes(expr.callee.property.name)
        ) {
          const methodName = expr.callee.property.name;

          // If .then(), extract return from primary success callback
          if (methodName === 'then' && expr.arguments.length > 0) {
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

          // Recursively traverse up the promise chain
          if (expr.callee.object) {
            extractFromExpression(expr.callee.object);
          }
        }
        // Direct ObjectExpression
        else if (expr.type === 'ObjectExpression') {
          const keys = extractObjectKeys(expr, scopeBindings, propertyTypes);
          for (const k of keys) returnedKeys.add(k);
        }
      }

      extractFromExpression(arg);
    }
  });

  return {
    returnedKeys: Array.from(returnedKeys),
    nestedReturnKeys,
    propertyTypes
  };
}

module.exports = {
  inferTypeFromNode,
  extractObjectKeys,
  extractReturnKeysAndNested
};
