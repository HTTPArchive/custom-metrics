const { runWPTTest } = require('./wpt.js');
const assert = require('assert');

let wpt_data;
beforeAll(async () => {
  wpt_data = await runWPTTest("https://almanac.httparchive.org/en/2022/");
}, 400000);

test('_ads parsing', () => {
  assert.ok(wpt_data["_ads"].ads);
  assert.ok(wpt_data["_ads"].app_ads);
  assert.ok(wpt_data["_ads"].sellers);
});

test('_privacy parsing', () => {
  assert.ok(wpt_data["_privacy"]);
});
