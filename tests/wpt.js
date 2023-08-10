const WebPageTest = require('webpagetest');
const fs = require('fs');

const wptServer = 'www.webpagetest.org';
const wptApiKey = process.env.WPT_API_KEY;
const wpt = new WebPageTest(wptServer, wptApiKey);

function runWPTTest(url, options = {}) {
  const customMetricsFileName = `./dist/${options.label}.js`;

  // check that custom metrics file exists
  if (!fs.existsSync(customMetricsFileName)) {
    console.error(`Custom metrics file ${customMetricsFileName} does not exist`);
    process.exit(2);
  }

  options.custom = options.custom || `[_${options.label}]\n` + fs.readFileSync(`./dist/${options.label}.js`, 'utf-8');
  console.log(`Running ${options.label} tests on ${url}`);

  return new Promise((resolve, reject) => {
    wpt.runTestAndWait(url, options, (error, response) => {
      if (error || response.statusCode !== 200) {
        console.error(`Test on ${url} failed: ${error || response}`);
        console.error(error || response);
        reject(error || response);
      } else {
        const custom_metrics = JSON.parse(response.data.runs[1].firstView[`_${options.label}`])

        console.log(`Test results available: ${response.data.summary}\n\n${options.label} custom metrics for ${url}:\n${JSON.stringify(custom_metrics, null, 4)}`);
        fs.appendFileSync('test-results.txt', `<details>\n<summary><strong>${options.label} custom metrics for ${url}</strong></summary>\n\n\`\`\`json\n${JSON.stringify(custom_metrics, null, 4)}\n\`\`\`\n</details>\n`);

        resolve(custom_metrics);
      }
    });
  });
}

module.exports = { runWPTTest };
