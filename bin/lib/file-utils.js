'use strict';

const fs = require('fs');
const path = require('path');

// Whitelist of metric files required to have JSDoc documentation.
// Set to null or ['*'] to require JSDoc for all files in dist/.
const REQUIRED_METRICS = [
  'privacy.js',
  'ads.js'
];

/**
 * Returns all metric JS files in dist/ that contain JSDoc *Metrics typedefs.
 */
function getAnnotatedMetricFiles(distDir = path.join(__dirname, '../../dist')) {
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

/**
 * Validates that all required metrics in dist/ have JSDoc metric documentation.
 */
function validateMetricCoverage(distDir = path.join(__dirname, '../../dist'), requiredList = REQUIRED_METRICS) {
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

module.exports = {
  REQUIRED_METRICS,
  getAnnotatedMetricFiles,
  validateMetricCoverage
};
