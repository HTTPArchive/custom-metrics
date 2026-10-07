'use strict';

const { parse: parseJSDoc } = require('comment-parser');

/**
 * Parses JSDoc blocks in code and extracts all @typedef structures and @property tags.
 */
function parseJSDocTypedefs(code) {
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

  return typedefs;
}

/**
 * Resolves the primary top-level typedef representing the metric entrypoint.
 */
function getPrimaryTypedef(metricName, typedefs) {
  const metricBase = metricName.toLowerCase().replace(/[^a-z0-9]/g, '');

  for (const [name, td] of typedefs) {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanName.includes(metricBase) && cleanName.includes('metric')) {
      return td;
    }
  }

  for (const td of typedefs.values()) {
    if (td.name.toLowerCase().endsWith('metrics')) {
      return td;
    }
  }

  return Array.from(typedefs.values())[0] || null;
}

/**
 * Recursively collects all documented property names for a typedef and its referenced subtypes.
 */
function getAllDocumentedKeysForTypedef(typeName, typedefs, visited = new Set()) {
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
          const childKeys = getAllDocumentedKeysForTypedef(childTypeName, typedefs, visited);
          for (const ck of childKeys) keys.add(ck);
        }
      }
    }
  }
  return keys;
}

module.exports = {
  parseJSDocTypedefs,
  getPrimaryTypedef,
  getAllDocumentedKeysForTypedef
};
