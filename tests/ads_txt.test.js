const { runWPTTest } = require('./wpt.js');
var path = require('path');

var test_suite_name = path.basename(__filename).replace('.test.js', '');

beforeAll(async () => {
  msn_com = await runWPTTest(
    "https://msn.com/",
    {
      label: test_suite_name
    }
  );
}, 300000);

test('ads parsing done', () => {
  expect(msn_com.ads).toBeDefined();
});

test('ads.txt status code 200', () => {
  expect(msn_com.ads.status).toBe(200);
});

test('count for accounts', () => {
  expect(msn_com.ads.account_count).toBeGreaterThan(100);
});

test('count for variables', () => {
  expect(msn_com.ads.variable_count).toBeGreaterThan(2);
});

test('account counts verification', () => {
  expect(msn_com.ads.account_count = msn_com.ads.account_types.direct.account_count + msn_com.ads.account_types.reseller.account_count).toBeTruthy();
});

test('line counts verification', () => {
  expect(msn_com.ads.account_count + msn_com.ads.variable_count <= msn_com.ads.line_count).toBeTruthy();
});
