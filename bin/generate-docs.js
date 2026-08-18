#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { validateMetric } = require('./validate-docs.js');

/**
 * Normalizes JSDoc type strings to Starlight / har.fyi standard types.
 */
function normalizeType(typeStr) {
  if (!typeStr) return 'unknown';

  let clean = typeStr.trim();
  if (clean.startsWith('{') && clean.endsWith('}')) {
    clean = clean.slice(1, -1).trim();
  }

  // Handle unions with null / undefined first
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

function cleanDescription(desc) {
  if (!desc) return '';
  return desc.replace(/^-\s*/, '').trim();
}

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

  return Array.from(typedefs.values())[0];
}

function getCustomTypeName(rawType, typedefs) {
  if (!rawType) return null;
  const parts = rawType.replace(/^{|}$/g, '').split('|').map(p => p.trim()).filter(p => p !== 'null' && p !== 'undefined');
  for (const part of parts) {
    const unwrapped = part.replace(/^Array<(.+)>$/i, '$1').replace(/\[\]$/, '').trim();
    if (typedefs.has(unwrapped)) {
      return unwrapped;
    }
  }
  return null;
}

/**
 * Recursively renders properties down to basic types.
 */
function renderProperties(properties, prefix, headingLevel, typedefs, visited = new Set()) {
  let mdx = '';
  const hashes = '#'.repeat(headingLevel);

  for (const prop of properties) {
    const rawType = prop.type || 'unknown';
    const customTypeName = getCustomTypeName(rawType, typedefs);
    const isArray = rawType.includes('[]') || /Array</i.test(rawType);
    const normalizedType = normalizeType(rawType);

    const displayType = customTypeName
      ? (isArray ? 'array<object>' : 'object')
      : normalizedType;

    const fullPath = prefix ? `${prefix}.${prop.name}` : prop.name;

    mdx += `${hashes} \`${fullPath}\`\n\n`;
    mdx += `Type: \`${displayType}\`\n\n`;
    mdx += `${cleanDescription(prop.description)}\n\n`;

    if (customTypeName && typedefs.has(customTypeName) && !visited.has(customTypeName)) {
      const nestedTypedef = typedefs.get(customTypeName);
      const nextPrefix = isArray ? `${fullPath}[i]` : fullPath;
      const nextVisited = new Set(visited).add(customTypeName);
      mdx += renderProperties(nestedTypedef.properties, nextPrefix, headingLevel + 1, typedefs, nextVisited);
    }
  }

  return mdx;
}

/**
 * Generates MDX content from parsed JSDoc typedefs.
 */
function generateMDX(metricName, typedefs) {
  const primaryTypedef = getPrimaryTypedef(metricName, typedefs);
  const capitalizedName = metricName.charAt(0).toUpperCase() + metricName.slice(1);

  let mdx = `---
title: ${capitalizedName} custom metric
description: Reference docs for the ${metricName} custom metric
---

_Appears in: [\`custom_metrics\`](/reference/structs/custom-metrics/) struct_\\
_As: [\`${metricName}\`](/reference/structs/custom-metrics/#${metricName})_

## Schema

`;

  mdx += renderProperties(primaryTypedef.properties, '', 3, typedefs);

  return mdx;
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
  let outDir = path.join(__dirname, '../../har.fyi/src/content/docs/reference/custom-metrics');
  let explicitFiles = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--out' && args[i + 1]) {
      outDir = path.resolve(args[i + 1]);
      i++;
    } else if (!args[i].startsWith('--')) {
      explicitFiles.push(path.resolve(args[i]));
    }
  }

  const targetFiles = explicitFiles.length > 0 ? explicitFiles : getAnnotatedMetricFiles();

  fs.mkdirSync(outDir, { recursive: true });

  for (const file of targetFiles) {
    const metricName = path.basename(file, '.js');
    console.log(`Generating docs for ${metricName}...`);

    const validation = validateMetric(file);
    if (!validation.valid) {
      console.error(`❌ Validation failed for ${file}. Docs generation aborted:`);
      for (const err of validation.errors) {
        console.error(`   - ${err}`);
      }
      process.exit(1);
    }

    const mdxContent = generateMDX(metricName, validation.typedefs);
    const outFile = path.join(outDir, `${metricName}.mdx`);
    fs.writeFileSync(outFile, mdxContent, 'utf8');
    console.log(`✅ Generated ${outFile}\n`);
  }
}

module.exports = {
  generateMDX
};
