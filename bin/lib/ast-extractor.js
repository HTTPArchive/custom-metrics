'use strict';

const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

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
 * Parses JavaScript code and extracts returned top-level keys and nested IIFE object properties.
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
          const keys = extractObjectKeys(expr, scopeBindings);
          for (const k of keys) returnedKeys.add(k);
        }
      }

      extractFromExpression(arg);
    }
  });

  return {
    returnedKeys: Array.from(returnedKeys),
    nestedReturnKeys
  };
}

module.exports = {
  extractObjectKeys,
  extractReturnKeysAndNested
};
