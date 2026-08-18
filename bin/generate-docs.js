#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const {
  TOP_LEVEL_METRICS,
  normalizeType,
  extractCustomTypeName,
  cleanDescription
} = require('./lib/types.js');
const {
  getPrimaryTypedef
} = require('./lib/jsdoc-parser.js');
const {
  getAnnotatedMetricFiles
} = require('./lib/file-utils.js');
const { validateMetric } = require('./validate-docs.js');

/**
 * Recursively renders schema properties down to basic types in markdown format.
 */
function renderProperties(properties, prefix = '', headingLevel = 3, typedefs = new Map(), visited = new Set()) {
  let mdx = '';
  const hashes = '#'.repeat(headingLevel);

  for (const prop of properties) {
    const rawType = prop.type || 'unknown';
    const customTypeName = extractCustomTypeName(rawType, typedefs);
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
 * Generates Starlight-compliant MDX content from parsed JSDoc typedefs.
 */
function generateMDX(metricName, typedefs) {
  const primaryTypedef = getPrimaryTypedef(metricName, typedefs);
  const capitalizedName = metricName.charAt(0).toUpperCase() + metricName.slice(1);
  const isTopLevel = TOP_LEVEL_METRICS.has(metricName);

  const parentLink = isTopLevel
    ? `_Appears in: [\`custom_metrics\`](/reference/structs/custom-metrics/) struct_\\\n_As: [\`${metricName}\`](/reference/structs/custom-metrics/#${metricName})_`
    : `_Appears in: [\`custom_metrics.other\`](/reference/custom-metrics/other/) struct_\\\n_As: [\`${metricName}\`](/reference/custom-metrics/other/#${metricName})_`;

  let mdx = `---
title: ${capitalizedName} custom metric
description: Reference docs for the ${metricName} custom metric
---

${parentLink}

## Schema

`;

  mdx += renderProperties(primaryTypedef.properties, '', 3, typedefs);

  return mdx;
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

    const isTopLevel = TOP_LEVEL_METRICS.has(metricName);
    const targetDir = isTopLevel ? outDir : path.join(outDir, 'other');
    fs.mkdirSync(targetDir, { recursive: true });

    const mdxContent = generateMDX(metricName, validation.typedefs);
    const outFile = path.join(targetDir, `${metricName}.mdx`);
    fs.writeFileSync(outFile, mdxContent, 'utf8');
    console.log(`✅ Generated ${outFile}\n`);
  }
}

module.exports = {
  generateMDX,
  renderProperties
};
