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
  nick = await runWPTTest("https://www.nick.com/", options);
  pokellector = await runWPTTest("https://www.pokellector.com/", options);
  gpc = await runWPTTest("https://global-privacy-control.glitch.me/", options);
}, 5*60*1000);

test('Privacy wording links present', () => {
  expect(theverge.privacy_wording_links[0]).toEqual(
    {
      keywords: ['PRIVACY'],
      text: "PRIVACY NOTICE"
    }
  );
});

test('TCFv1 consent function present', () => {
  expect(educations.iab_tcf_v1.present).toBeTruthy();
});

test('TCFv2 consent function present', () => {
  expect(rtl.iab_tcf_v2.present).toBeTruthy();
});

test('IAB US Privacy present', () => {
  expect(nick.iab_usp.present).toBeTruthy();
});

test('Interest Cohort data present', () => {
  expect(pokellector.document_interestCohort).toBeTruthy();
});

test('DNT present', () => {
  expect(theverge.navigator_doNotTrack).toBeTruthy();
});

test('GPC present', () => {
  expect(gpc.navigator_globalPrivacyControl).toBeTruthy();
});
