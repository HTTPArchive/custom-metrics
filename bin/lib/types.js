'use strict';

const BASIC_TYPES = new Set([
  'string',
  'number',
  'integer',
  'boolean',
  'object',
  'any',
  'unknown',
  'null',
  'undefined'
]);

const TOP_LEVEL_METRICS = new Set([
  'a11y',
  'cms',
  'cookies',
  'css_variables',
  'ecommerce',
  'element_count',
  'javascript',
  'markup',
  'media',
  'origin_trials',
  'performance',
  'privacy',
  'responsive_images',
  'robots_txt',
  'security',
  'structured_data',
  'third_parties',
  'well_known',
  'wpt_bodies',
  'other'
]);

/**
 * Normalizes JSDoc type strings to Starlight / har.fyi standard types.
 */
function normalizeType(typeStr) {
  if (!typeStr) return 'unknown';

  let clean = typeStr.trim();
  if (clean.startsWith('{') && clean.endsWith('}')) {
    clean = clean.slice(1, -1).trim();
  }

  // Unwrap union types with null / undefined first
  const parts = clean.split('|').map(p => p.trim()).filter(p => p !== 'null' && p !== 'undefined');
  if (parts.length === 1) {
    clean = parts[0];
  }

  // Handle Object.<key, val> / Record<key, val>
  if (/^Object\.<[^>]+>$/i.test(clean) || /^Record<[^>]+>$/i.test(clean)) {
    return 'object';
  }

  // Handle Array<T> or T[]
  if (clean.endsWith('[]')) {
    const inner = clean.slice(0, -2);
    return `array<${normalizeType(inner)}>`;
  }
  if (/^Array<(.+)>$/i.test(clean)) {
    const match = clean.match(/^Array<(.+)>$/i);
    return `array<${normalizeType(match[1])}>`;
  }

  const lower = clean.toLowerCase();
  if (['string', 'boolean', 'number', 'integer', 'object'].includes(lower)) {
    return lower;
  }

  return clean;
}

/**
 * Extracts the custom typedef name from a raw type string if present in typedefs map.
 */
function extractCustomTypeName(rawType, typedefs) {
  if (!rawType) return null;
  const parts = rawType.replace(/^{|}$/g, '').split('|').map(p => p.trim()).filter(p => p !== 'null' && p !== 'undefined');
  for (const part of parts) {
    const unwrapped = part.replace(/^Array<(.+)>$/i, '$1').replace(/\[\]$/, '').trim();
    if (typedefs && typedefs.has(unwrapped)) {
      return unwrapped;
    }
  }
  return null;
}

/**
 * Checks whether an inferred AST type is compatible with the documented JSDoc type.
 */
function isTypeCompatible(inferredType, docType) {
  if (!inferredType || !docType) return true;

  const cleanDoc = docType.replace(/^{|}$/g, '').trim();
  const docParts = cleanDoc.split('|').map(p => p.trim().toLowerCase());
  const inferredParts = inferredType.split('|').map(p => p.trim().toLowerCase());

  return inferredParts.every(inf => {
    if (inf === 'null') return docParts.includes('null') || docParts.includes('undefined');
    if (inf === 'boolean') return docParts.includes('boolean');
    if (inf === 'integer') return docParts.includes('integer') || docParts.includes('number');
    if (inf === 'number') return docParts.includes('number') || docParts.includes('integer') || docParts.includes('float');
    if (inf === 'string') return docParts.includes('string');
    if (inf === 'array') return docParts.some(p => p.startsWith('array') || p.endsWith('[]'));
    if (inf === 'object') return docParts.some(p => p === 'object' || !BASIC_TYPES.has(p));
    return true;
  });
}

function cleanDescription(desc) {
  if (!desc) return '';
  return desc.replace(/^-\s*/, '').trim();
}

module.exports = {
  BASIC_TYPES,
  TOP_LEVEL_METRICS,
  normalizeType,
  extractCustomTypeName,
  isTypeCompatible,
  cleanDescription
};
