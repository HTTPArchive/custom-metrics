const fs = require('fs');

const WebPageTest = require('webpagetest');
const wptServer = 'https://webpagetest.httparchive.org';
let wptApiKey = process.env.WPT_API_KEY;
let wpt = new WebPageTest(wptServer, wptApiKey);

let testFile = process.argv[2];
let tests = require('./' + testFile + '.test.js');

for (let testName in tests) {
  let test = tests[testName];

  test.options = test.options || {};
  test.options.custom = '[' + testFile + ']\n' + fs.readFileSync('./dist/' + testFile + '.js', 'utf-8');
  test.options.location = test.options.location || 'Dulles:Chrome.Native';
  test.options.mobile = test.options.mobile || true;

  wpt.runTestAndWait(test.url, test.options, (error, data) => {
    console.log(`Running test case ${testName} for ${test.url}`);
    if (error) {
      console.error(`Test for ${test.url} failed`);
      console.error(error);
    } else {
      console.log(`Test for ${test.url} succeeded`);
      console.log(`Results: ${data.jsonUrl}`);
      test.tests(data);
    }
  });
}
