const fs = require('fs');

const WebPageTest = require('webpagetest');
const wptServer = 'https://webpagetest.httparchive.org';
let wptApiKey = process.env.WPT_API_KEY;
let wpt = new WebPageTest(wptServer, wptApiKey);

let testFile = process.argv[2];
let tests = require('./' + testFile + '.test.js');

for (let test in tests) {
  let options = {
    custom: '[' + testFile + ']\n' + fs.readFileSync('../dist/' + testFile + '.js', 'utf-8'),
    location: test.options.location || 'Dulles:Chrome.Native',
    mobile: test.options.mobile || true
  };

  wpt.runTestAndWait(test.url, options, (error, data) => {
    if (err) {
      console.error(`Test for ${test.url} failed`);
      console.error(error);
      process.exit(1);
    } else {
      console.log(`Test for ${test.url} succeeded`);
      console.log(`Results: ${data.jsonUrl}`);
      test.tests(data);
    }
  });
}
