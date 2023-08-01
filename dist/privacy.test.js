const { runWPTTest } = require('../tests/wpt.js');
var path = require('path');
const fs = require('fs');
var test_case_name = path.basename(__filename).replace('.test.js', '');

let options = {
  label: test_case_name,
}

beforeAll(async () => {
  theverge = await runWPTTest("https://www.theverge.com/", options);
  rtl = await runWPTTest("https://www.rtl.de/", options);
  educations = await runWPTTest("https://www.educations.com/", options);
  pokellector = await runWPTTest("https://www.pokellector.com/", options);
}, 5 * 60 * 1000);

test('Privacy wording links present', () => {
  expect(rtl.privacy_wording_links).toEqual(
    [{ "keywords": ["Datenschutz"], "text": "Datenschutz" }]
  );
});

test('TCFv1 consent function present', () => {
  expect(educations.iab_tcf_v1.present).toBeTruthy();
});

test('TCFv2 consent function present', () => {
  expect(rtl.iab_tcf_v2.present).toBeTruthy();

});

test('IAB US Privacy present', () => {
  expect(verge.iab_usp.present).toBeTruthy();
});

test.failing('Interest Cohort data present', () => {
  expect(pokellector.document_interestCohort).toBeTruthy();
});

test('DNT present', () => {
  expect(rtl.navigator_doNotTrack).toBeTruthy();
});

test('GPC present', () => {
  expect(verge.navigator_globalPrivacyControl).toBeTruthy();
});
