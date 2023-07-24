module.exports = {
  privacy_wording_links: {
    url: "https://www.theverge.com/",
    tests: (data) => {
      test('Privacy wording links present', () => {
        expect(data._privacy.privacy_wording_links[0]).toBeEqual(
          {
            keywords: ['PRIVACY'],
            text: "PRIVACY NOTICE"
          }
        );
      });
    }
  },
  iab_tcf_v1: {
    url: "https://www.example.com",
    tests: (data) => {
      test('TCFv1 consent data present', () => {
        expect(data._privacy.iab_tcf_v1.present).toBeTruthy();
      });
    }
  },
  iab_tcf_v2: {
    url: "https://www.rtl.de/",
    tests: (data) => {
      test('TCFv2 consent data present', () => {
        expect(data._privacy.iab_tcf_v2.present).toBeTruthy();
      });
    }
  },
  iab_usp: {
    url: "https://www.nfl.com/",
    tests: (data) => {
      test('TCFv2 consent data present', () => {
        expect(data._privacy.iab_usp.present).toBeTruthy();
      });
    }
  },
  document_interestCohort: {
    url: "https://www.pokellector.com/",
    tests: (data) => {
      test('Interest Cohort data present', () => {
        expect(data._privacy.document_interestCohort).toBeTruthy();
      });
    }
  },
  navigator_doNotTrack: {
    url: "https://www.theverge.com/",
    tests: (data) => {
      test('DNT present', () => {
        expect(data._privacy.navigator_doNotTrack).toBeTruthy();
      });
    }
  },
  navigator_globalPrivacyControl: {
    url: "https://global-privacy-control.glitch.me/",
    tests: (data) => {
      test('GPC present', () => {
        expect(data._privacy.navigator_globalPrivacyControl).toBeTruthy();
      });
    }
  }
};
