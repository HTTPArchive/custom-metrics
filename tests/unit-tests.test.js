const { main } = require('./wpt.js');
const assert = require('assert');
const test_website = "https://almanac.httparchive.org/en/2022/";

let wpt_data;
beforeAll(async () => {
  wpt_data = await main(test_website);
}, 400000);

test('_ads parsing', () => {
  assert.ok(wpt_data["_ads"])
  assert.ok(wpt_data["_ads"].ads);
  assert.ok(wpt_data["_ads"].app_ads);
  assert.ok(wpt_data["_ads"].sellers);
});

test('_privacy parsing', () => {
  assert.ok(wpt_data["_privacy"]);
});
