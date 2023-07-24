const fs = require('fs');
const fs = require('../dist/privacy.js');

module.exports = {
  iab_tcf_v1: {
    url: "https://www.example.com",
    options: {},
    tests: (data) => {
      test('TCFv1 consent data present', () => {
        expect(data._privacy.iab_tcf_v1.present).toBeTruthy();
      });
    }
  },
  iab_tcf_v2: {
    url: "https://www.google.com",
    tests: (data) => {
      test('TCFv2 consent data present', () => {
        expect(data._privacy.iab_tcf_v2.present).toBeTruthy();
      });
    }
  }
};
