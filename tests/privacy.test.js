const { runWPTTest } = require('./wpt.js');
const path = require('path');
const options = {
  label: path.basename(__filename).replace('.test.js', '')
}

beforeAll(async () => {
  theverge = await runWPTTest("https://www.theverge.com/", options);
  rtl = await runWPTTest("https://www.rtl.de/", options);
  educations = await runWPTTest("https://www.educations.com/", options);
  pokellector = await runWPTTest("https://www.pokellector.com/", options);
}, 600000);

test('Privacy metrics present', () => {
  expect(theverge).toBeDefined()
});

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
  expect(theverge.iab_usp.present).toBeTruthy();
});

test.failing('Interest Cohort data present', () => {
  expect(pokellector.document_interestCohort).toBeTruthy();
});

test('DNT present', () => {
  expect(rtl.navigator_doNotTrack).toBeTruthy();
});

test('GPC present', () => {
  expect(theverge.navigator_globalPrivacyControl).toBeTruthy();
});
