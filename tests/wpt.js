const WebPageTest = require('webpagetest');
const fs = require('fs');

const wptServer = 'www.webpagetest.org';
const wptApiKey = process.env.WPT_API_KEY;
const wpt = new WebPageTest(wptServer, wptApiKey);

function runWPTTest(url, options = {}) {
  options.f = 'json';
  const customMetricsFile = `./dist/${options.label}.js`;

  // check that custom metrics file exists
  if (!fs.existsSync(customMetricsFile)) {
    console.error(`Custom metrics file ${customMetricsFile} does not exist`);
    process.exit(2);
  } else {
    options.custom = options.custom || '[_' + options.label + ']\n' + fs.readFileSync('./dist/' + options.label + '.js', 'utf-8');
  }

  return new Promise((resolve, reject) => {
    wpt.runTestAndWait(url, options, (error, response) => {
      console.log(`Running ${options.label} tests for ${url}`);
      if (error || response.statusCode !== 200) {
        console.error(`Test for ${url} failed:`);
        console.error(error || response);
        reject(error || response);
      } else {
        console.log(`Test for ${url} succeeded. View full test results:`);
        console.log(response.data.summary);
        console.log(`Custom metrics data:`);
        console.log(response.data.runs[1].firstView["_" + options.label]);
        resolve(JSON.parse(response.data.runs[1].firstView["_" + options.label]));
      }
    });
  });
}

module.exports = { runWPTTest };
