const { runWPTTest } = require('./wpt.js');
const path = require('path');
const test_suite_name = path.basename(__filename).replace('.test.js', '');

beforeAll(async () => {
  msn_com = await runWPTTest(
    "https://msn.com/",
    {
      label: test_suite_name
    }
  );
  criteo = await runWPTTest(
    "https://criteo.com/",
    {
      label: test_suite_name
    }
  );
}, 300000);

describe('ads.txt', () => {
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
});

describe('sellers.json', () => {
  test('crawling successfull', () => {
    expect(criteo.sellers.present).toBeTruthy();
  });

  test('seleer count', () => {
    expect(criteo.sellers.seller_count).toBeGreaterThan(100);
  });

  test('seller counts verification', () => {
    expect(criteo.sellers.seller_count = criteo.seller_types.publisher.seller_count + criteo.seller_types.intermediary.seller_count + criteo.seller_types.both.seller_count).toBeTruthy();
  });

  test('domain count verification', () => {
    expect(criteo.sellers.seller_types.publisher.seller_count >= criteo.seller_types.publisher.domain_count).toBeTruthy();
    expect(criteo.sellers.seller_types.publisher.domain_count * 0.9 < criteo.seller_types.publisher.domain_count).toBeTruthy();
  });
});
