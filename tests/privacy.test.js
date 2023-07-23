const fs = require('fs');
const fs = require('../dist/privacy.js');

module.exports = {
  iab_tcf_v1: {
    url: "https://www.example.com",
    options: {},
    tests: (data) => {
      test('TCFv1 consent data present', () => {
        expect(data.consentData.present).toBeTruthy();
      });
    }
  },
  iab_tcf_v2: {
    url: "https://www.google.com",
    tests: (data) => {
      test('TCFv2 consent data present', () => {
        expect(data.tcData.present).toBeTruthy();
      });
    }
  }
};
