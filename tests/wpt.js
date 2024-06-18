const WebPageTest = require('webpagetest');
const fs = require('fs');
const path = require('path');
const { argv } = require('node:process');
const { execSync } = require('child_process');

const is_direct_run = require.main === module;

const wptServer = process.env.WPT_SERVER;
const wptApiKey = process.env.WPT_API_KEY;
const wpt = new WebPageTest(wptServer, wptApiKey);


/**
 * Retrieves the names of all JavaScript files in the 'dist/' directory.
 *
 * @returns {string[]} An array of the base names of the JavaScript files without the '.js' extension.
 */
function getCustomMetrics() {
  return fs.readdirSync('dist/', { withFileTypes: true })
    .filter(file => path.extname(file.name) === '.js')
    .map(file => path.basename(file.name, '.js'));
}


/**
 * Retrieves the names of all JavaScript files in the 'dist/' directory that have changed in the current branch.
 *
 * @returns {string[]} An array of the base names of the JavaScript files without the '.js' extension.
 */
function getChangedCustomMetrics() {
  const stdout = execSync('git diff --name-only --diff-filter=ACMRT origin/main', { encoding: 'utf-8' })

  metricsList = stdout.split('\n')
    .filter(file => RegExp('^dist\/.*\.js$', 'g').test(file))
    .map(file => path.basename(file, '.js'))

  metricsList = Array.from(new Set(metricsList)).sort()

  return metricsList;
}


/**
 * Runs a WebPageTest (WPT) test for a given URL.
 *
 * @param {string} url - The URL to run the test on.
 * @returns {Promise<object>} A promise that resolves with an object containing the custom metrics.
 * @throws {Error} If the test run fails or the response status code is not 200.
 */
function runWPTTest(url) {
  const custom_metrics = getCustomMetrics()
  const metrics_to_log = getChangedCustomMetrics()

  let options = { key: wptApiKey, custom: '' };
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
        let wpt_custom_metrics_to_log = {}

        for (const metric_name of custom_metrics) {
          let wpt_custom_metric = response.data.runs['1'].firstView[`_${metric_name}`];
          try {
            // Try to parse strings into JSON to allow them to be pretty printed
            // Not all custom metrics are JSON strings so this might fail
            if (typeof wpt_custom_metric === 'string') {
              wpt_custom_metric = JSON.parse(wpt_custom_metric);
            }
          } catch (e) {
            // If it fails, that's OK as we'll just stick with the exact output
          }
          wpt_custom_metrics[`_${metric_name}`] = wpt_custom_metric;
          if (metrics_to_log.includes(metric_name)) {
            wpt_custom_metrics_to_log[`_${metric_name}`] = wpt_custom_metric;
          }
        }

        fs.appendFileSync('test-results.md', `<details>
<summary><strong>Custom metrics for ${url}</strong></summary>

WPT test run results: ${response.data.summary}
Changed custom metrics values:
\`\`\`json
${JSON.stringify(wpt_custom_metrics_to_log, null, 4)}
\`\`\`
</details>\n\n`);

        resolve(wpt_custom_metrics);
      }
    });
  });
}


if (is_direct_run) {
  const url = argv[2];

  runWPTTest(url);
}

module.exports = { runWPTTest };
