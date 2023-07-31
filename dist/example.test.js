// Example test file for custom metrics
const { runWPTTest } = require('../tests/wpt.js');
var path = require('path');

var test_suite_name = path.basename(__filename).replace('.test.js', '');

// Define a WPT test runs for each website you need the data for
beforeAll(async () => {
  example_com = await runWPTTest(
    "https://example.com/",
    {
      label: test_suite_name
    }
  );
}, 60000);

// Create test cases for any custom metric parameters you need to check
test('Check placeholder', () => {
  expect(example_com.metricName).toEqual('value');
});

test('Meta nodes present', () => {
  expect(Object.entries(example_com.meta_nodes).length).toBeGreaterThan(1);
});

test('No picture tags with images', () => {
  expect(example_com.has_picture_img).toBeDefined();
  expect(example_com.has_picture_img).toBeFalsy();
});
