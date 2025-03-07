//[well-known]
// Uncomment the previous line for testing on webpagetest.org

// README! Instructions for adding a new custom metric for the Web Almanac.
//
// 1. Refer for instructions for adding a custom metric in almanac.js.
// 2. This file has a special case where a custom metric uses 'fetch' and in that case we need to return a promise that resolves to JSON
// 3. Test your change by following the instructions at https://github.com/HTTPArchive/almanac.httparchive.org/issues/33#issuecomment-502288773.
// 4. Submit a PR to update this file.

import psl from 'psl'; // Import the psl library for Public Suffix List parsing.

function fetchWithTimeout(url) {
  var controller = new AbortController();
  setTimeout(() => {controller.abort()}, 5000);
  return fetch(url, {signal: controller.signal});
}

function parseResponse(url, parser) {
  return fetchWithTimeout(url)
  .then(request => {
    let resultObj = {};
    if(!request.redirected && request.status === 200) {
      resultObj['found'] = true;
      if(parser) {
        let promise = parser(request);
        if (promise) {
          return promise
          .then(data => {
            resultObj['data'] = data;
            return [url, resultObj];
          })
          .catch(error => {
            return [url, {'error': error.message}];
          });
        } else {
          resultObj['error'] = 'parser did not return a promise';
          return [url, resultObj];
        }
      } else {
        return [url, resultObj];
      }
    } else {
      resultObj['found'] = false;
      return [url, resultObj];
    }
  })
  .catch(error => {
    return [url, {'error': error.message}];
  });
}

function parseResponseWithRedirects(url, parser) {
  return fetchWithTimeout(url)
    .then(request => {
      let resultObj = {
        found: request.status === 200
      };

      if (parser) {
        let promise = parser(request);
        if (promise) {
          return promise
            .then(data => {
              resultObj['data'] = data;
              return [url, resultObj];
            })
            .catch(error => {
              return [url, { 'error': error.message }];
            });
        } else {
          resultObj['error'] = 'parser did not return a promise';
          return [url, resultObj];
        }
      } else {
        return [url, resultObj];
      }
    })
    .catch(error => {
      return [url, { 'error': error.message }];
    });
}

function getRootDomain(hostname) {
  const parsed = psl.parse(hostname);
  if (parsed.error){
     return hostname;
  }
  return parsed.domain || hostname; // Use parsed.domain, fallback to hostname if null
}

return Promise.all([
  // ecommerce
  parseResponse('/.well-known/assetlinks.json', r => {
    return r.json().then(data => {
      let hasDeepLinking = false;
      let hasCredentialSharing = false;
      data.forEach(statement => {
        if (statement.relation.includes('delegate_permission/common.handle_all_urls')) {
          hasDeepLinking = true;
        }
        if (statement.relation.includes('delegate_permission/common.get_login_creds')) {
          hasCredentialSharing = true;
        }
      });
      return {
        deep_linking: hasDeepLinking,
        credential_sharing: hasCredentialSharing
      };
    });
  }),
  // Apple App Site Association
  parseResponse('/.well-known/apple-app-site-association', r => {
    return r.json().then(data => {
      let hasAppLinks = false;
      let hasWebCredentials = false;
      if (data.applinks) {
        hasAppLinks = true;
      }
      if (data.webcredentials) {
        hasWebCredentials = true;
      }
      return {
        app_links: hasAppLinks,
        web_credentials: hasWebCredentials
      };
    });
  }),
  // Privacy Sandbox
  parseResponse('/.well-known/related-website-set.json', r => {
    return r.text()  // Get the response as text first.
        .then(text => {
            try {
                const data = JSON.parse(text);
                return {
                    primary: data.primary || null,
                    associatedSites: data.associatedSites || null
                };
            } catch (error) {
                // If JSON parsing fails, try the root domain.
                const domain = getRootDomain(window.location.hostname);
                const retryUrl = `https://${domain}/.well-known/related-website-set.json`;
                return fetchWithTimeout(retryUrl) // Use fetchWithTimeout for the retry.
                    .then(retryResponse => {
                        if (!retryResponse.ok) {
                            return null; // Return null if the retry fails.
                        }
                        return retryResponse.text();
                    })
                    .then(retryText => {
                        if (!retryText) {
                            return null;
                        }
                        try {
                            const retryData = JSON.parse(retryText);
                            return {
                                 primary: retryData.primary || null,
                                associatedSites: retryData.associatedSites || null
                            };
                        } catch (retryError) {
                            return null; // Return null if parsing the retry response fails
                        }
                    }).catch(e => {
                        return null;
                    });
            }
        }).catch(err => {
           return null;
        });
  }),
  parseResponse('/.well-known/privacy-sandbox-attestations.json'), //Attestation File
  // privacy
  parseResponse('/.well-known/gpc.json', r => {
    return r.text().then(text => {
      let data = {
        'gpc': null
      };
      let gpc_data = JSON.parse(text);
      if (typeof gpc_data.gpc == 'boolean') {
        data.gpc = gpc_data.gpc;
      }
      return data;
    });
  }),
  // FedCM
  parseResponse('/.well-known/web-identity', r => {
    return r.text().then(text => {
        let result = {
            provider_urls: [],
            accounts_endpoint: null,
            login_url: null
        };
        try {
            let data = JSON.parse(text);
            result.provider_urls = Array.isArray(data.provider_urls) && data.provider_urls.length > 0 ? data.provider_urls : [];
            result.accounts_endpoint = data.accounts_endpoint || null;
            result.login_url = data.login_url || null;
        } catch (e) {
            // Failed to parse JSON
        }
        return result;
    });
  }),
  // Passkey
  parseResponse('/.well-known/passkey-endpoints', r => {
    return r.text().then(text => {
        let result = {
            enroll: null,
            manage: null
        };
        try {
            let data = JSON.parse(text);
            result.enroll = data.enroll || null;
            result.manage = data.manage || null;
        } catch (e) {
            // Failed to parse JSON
        }
        return result;
    });
  }),
  // Related Origin Requests
  parseResponse('/.well-known/webauthn', r => {
    return r.text().then(text => {
        let result = {
            origins: []
        };
        try {
            let data = JSON.parse(text);
            result.origins = Array.isArray(data.origins) && data.origins.length > 0 ? data.origins : [];
        } catch (e) {
            // Failed to parse JSON
        }
        return result;
    });
  }),
  // security
  parseResponse('/robots.txt', r => {
    return r.text().then(text => {
      let data = {'matched_disallows': {}};
      let keywords = [
        'login',
        'log-in',
        'signin',
        'sign-in',
        'admin',
        'auth',
        'sso',
        'account'
      ]
      let currUserAgent = null;
      for(let line of text.split('\n')) {
        if (line.toLowerCase().startsWith('user-agent: ')) {
          currUserAgent = line.substring(12);
        } else if (line.toLowerCase().startsWith('disallow: ')) {
          let path = line.substring(10);
          if (keywords.some(s => path.includes(s))) {
            if (data['matched_disallows'][currUserAgent] === undefined) {
              data['matched_disallows'][currUserAgent] = [];
            }
            data['matched_disallows'][currUserAgent].push(path);
          }
        }
      }
      return data;
    });
  }),
  parseResponseWithRedirects('/.well-known/security.txt', r => {
    let data = {
      status: r.status,
      redirected: r.redirected,
      url: r.url,
      content_type: r.headers.get("content-type")
    };

    return r.text().then(text => {
      // Abort if final status is not okay (e.g., 404 or 500)
      if (!r.ok) {
        return data;
      }
      data['signed'] = false;
      if (text.startsWith('-----BEGIN PGP SIGNED MESSAGE-----')) {
        data['signed'] = true;
      }
      data['contact'] = [];
      data['expires'] = [];
      data['encryption'] = [];
      data['acknowledgments'] = [];
      data['preferred_languages'] = [];
      data['canonical'] = [];
      data['policy'] = [];
      data['hiring'] = [];
      data['csaf'] = [];
      data['other'] = []; // [(name, value)]
      for (let line of text.split('\n')) {
        if (line.startsWith('Contact: ')) {
          data['contact'].push(line.substring(9).trim());
        } else if (line.startsWith('Expires: ')) {
          data['expires'].push(line.substring(9).trim());
        } else if (line.startsWith('Encryption: ')) {
          data['encryption'].push(line.substring(12).trim());
        } else if (line.startsWith('Acknowledgments: ')) {
          data['acknowledgments'].push(line.substring(17).trim());
        } else if (line.startsWith('Preferred-Languages: ')) {
          data['preferred_languages'].push(line.substring(21).trim());
        } else if (line.startsWith('Canonical: ')) {
          data['canonical'].push(line.substring(11).trim());
        } else if (line.startsWith('Policy: ')) {
          data['policy'].push(line.substring(8).trim());
        } else if (line.startsWith('Hiring: ')) {
          data['hiring'].push(line.substring(8).trim());
        } else if (line.startsWith('CSAF: ')) {
          data['csaf'].push(line.substring(6).trim());
        } else {
          if (!line.startsWith('#')) {
            let [name, value] = line.split(': ');
            if (name && value) {
              data['other'].push([name.trim(), value.trim()]);
            }
          }
        }
      }
      // Required fields exist
      data['all_required_exist'] = (data['contact'].length && data['expires'].length) > 0;
      // Fields that are only allowed once do not occur twice
      data['only_one_requirement_broken'] = false;
      for (let field of ['expires', 'preferred_languages']) {
        if (data[field].length > 1) {
          data['only_one_requirement_broken'] = true;
        }
      }
      // Valid: Required fields exist and only one requirement is not broken. Does not check value content at the moment (e.g., if expires is a valid ISO 8601 date).
      data['valid'] = data['all_required_exist'] && (!data['only_one_requirement_broken'])
      // Delete empty fields for storage optimization
      for (let key in data) {
        if (Array.isArray(data[key]) && data[key].length === 0) {
          delete data[key];
        }
      }
      return data;
    });
  }),
  parseResponseWithRedirects('/.well-known/change-password', r => {
    return Promise.resolve({
      status: r.status,
      redirected: r.redirected,
      url: r.url
    });
  }),
  parseResponseWithRedirects('/.well-known/resource-that-should-not-exist-whose-status-code-should-not-be-200/', r => {
    return Promise.resolve({
      status: r.status,
      redirected: r.redirected,
      url: r.url
    });
  })
]).then((all_data) => {
  return JSON.stringify(Object.fromEntries(all_data));
}).catch(error => {
  return JSON.stringify({message: error.message, error: error});
});
