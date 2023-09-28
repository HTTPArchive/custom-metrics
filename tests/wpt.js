const WebPageTest = require('webpagetest');
const fs = require('fs');
const path = require('path');
const { argv } = require('node:process');

const is_direct_run = require.main === module;

const wptServer = 'www.webpagetest.org';
const wptApiKey = process.env.WPT_API_KEY;
const wpt = new WebPageTest(wptServer, wptApiKey);

/**
 * Retrieves the names of all JavaScript files in the 'dist/' directory.
 *
 * @returns {string[]} An array of the base names of the JavaScript files without the '.js' extension.
 */
function getCustomMetrics() {
  return fs.readdirSync('dist/', { withFileTypes: true })
    .filter((file) => path.extname(file.name) === '.js')
    .map((file) => path.basename(file.name, '.js'));
}

/**
 * Runs a WebPageTest (WPT) test for a given URL.
 *
 * @param {string} url - The URL to run the test on.
 * @returns {Promise<object>} A promise that resolves with an object containing the custom metrics.
 * @throws {Error} If the test run fails or the response status code is not 200.
 */
function runWPTTest(url, metrics_to_log = []) {
  const custom_metrics = getCustomMetrics();
  metrics_to_log = metrics_to_log.length > 0 ? metrics_to_log : custom_metrics;

  let options = { custom: '' };
  for (const metric_name of custom_metrics) {
    options.custom += `[_${metric_name}]\n` + fs.readFileSync(`./dist/${metric_name}.js`, 'utf-8') + `\n`;
  }

  console.log(`WPT test run for ${url} started`);
  return new Promise((resolve, reject) => {
    wpt.runTestAndWait(url, options, (error, response) => {
      if (error || response.statusCode !== 200) {
        console.error(`WPT test run for ${url} failed:`);
        console.error(error || response);
        reject(error || response);

      } else {
        console.log(`WPT test run for ${url} completed`);
        let wpt_custom_metrics = {}
        for (const metric_name of metrics_to_log) {
          wpt_custom_metric = response.data.runs['1'].firstView[`_${metric_name}`];
          try {
            wpt_custom_metrics[`_${metric_name}`] = JSON.parse(wpt_custom_metric);
          } catch (e) {
            wpt_custom_metrics[`_${metric_name}`] = wpt_custom_metric;
          }
        }

        fs.appendFileSync('test-results.md', '<details>\n' +
          `<summary><strong>Custom metrics for ${url}</strong></summary>\n\n` +
          `WPT test run results: ${response.data.summary}\n` +
          (is_direct_run ? `\`\`\`json\n${JSON.stringify(wpt_custom_metrics, null, 4)}\n\`\`\`\n` : '') +
          '</details>\n');

        resolve(wpt_custom_metrics);
      }
    });
  });
}

if (is_direct_run) {
  const url = argv[2];
  const metrics_to_log = argv[3].split('\n');
  runWPTTest(url, metrics_to_log);
}

module.exports = { runWPTTest };
