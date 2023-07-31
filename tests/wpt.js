const WebPageTest = require('webpagetest');
const fs = require('fs');

const wptServer = 'www.webpagetest.org';
let wptApiKey = process.env.WPT_API_KEY;
let wpt = new WebPageTest(wptServer, wptApiKey);

function runWPTTest(url, options = {}) {
  options.f = 'json';
  let customMetricsFile = './dist/' + options.label + '.js';

  // check that file exists
  if (!fs.existsSync(customMetricsFile)) {
    console.error(`Custom metrics file ${customMetricsFile} does not exist`);
    process.exit(2);
  // check file size (max URL length is 8204 bytes)
  } else if (fs.statSync(customMetricsFile).size > 8000) {
    console.error(`Custom metrics file ${customMetricsFile} is too big`);
    process.exit(2);
  } else {
    options.custom = '[_' + options.label + ']\n' + fs.readFileSync('./dist/' + options.label + '.js', 'utf-8');
  }

  return new Promise((resolve, reject) => {
    wpt.runTestAndWait(url, options, (error, response) => {
      console.log(`Running ${options.label} tests for ${url}`);
      if (error || response.statusCode !== 200) {
        console.error(`Test for ${url} failed`);
        console.error(error || response);
        reject(error || response);
      } else {
        console.log(`Test for ${url} succeeded`);
        console.log(response);
        console.log(`Custom metrics data:`);
        console.log(response.data.runs[1].firstView["_" + options.label]);
        resolve(JSON.parse(response.data.runs[1].firstView["_" + options.label]));
      }
    });
  });
}

module.exports = { runWPTTest };
