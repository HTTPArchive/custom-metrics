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

  // Handle unions with null / undefined
  const parts = clean.split('|').map(p => p.trim()).filter(p => p !== 'null' && p !== 'undefined');
  if (parts.length === 1) {
    clean = parts[0];
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

  for (const prop of primaryTypedef.properties) {
    const rawType = prop.type || 'unknown';
    const normalizedType = normalizeType(rawType);
    const isCustomType = typedefs.has(rawType.replace(/\[\]$/, '').replace(/^Array<(.+)>$/i, '$1'));
    const displayType = isCustomType
      ? (rawType.endsWith('[]') || /^Array</i.test(rawType) ? 'array<object>' : 'object')
      : normalizedType;

    mdx += `### \`${prop.name}\`\n\n`;
    mdx += `Type: \`${displayType}\`\n\n`;
    mdx += `${cleanDescription(prop.description)}\n\n`;

    // Check if property references a custom typedef
    const customTypeName = rawType.replace(/^Array<(.+)>$/i, '$1').replace(/\[\]$/, '').replace(/^{|}$/g, '').split('|')[0].trim();
    if (typedefs.has(customTypeName)) {
      const nestedTypedef = typedefs.get(customTypeName);
      const isArray = rawType.endsWith('[]') || /^Array</i.test(rawType);
      const prefix = isArray ? `${prop.name}[i]` : prop.name;

      for (const subProp of nestedTypedef.properties) {
        const subDisplayType = normalizeType(subProp.type);
        mdx += `#### \`${prefix}.${subProp.name}\`\n\n`;
        mdx += `Type: \`${subDisplayType}\`\n\n`;
        mdx += `${cleanDescription(subProp.description)}\n\n`;
      }
    }
  }

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
