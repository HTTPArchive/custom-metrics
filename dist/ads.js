//[ads]

const SELLER_TYPES = ['publisher', 'intermediary', 'both'];

const isPresent = (response, endings) => response.ok && endings.some(ending => response.url.endsWith(ending));

const fetchAndParse = async (url, parser) => {
  const timeout = 5000;
  /*
  Google's sellers.json size is 120Mb as of May 2024 - too big for custom metrics.
  It's available at realtimebidding.google.com/sellers.json, so not part of crawled pages list.
  More details: https://support.google.com/authorizedbuyers/answer/9895942
  */
  const controller = new AbortController();
  const { signal } = controller;
  setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal });
    return parser(response);
  } catch (error) {
    return {
      status: -1,
      present: false,
      error: error.message
    };
  }
};

/**
 * @typedef {Object} AdsAccountTypeInfo
 * @property {string[]} domains - List of domains with advertising accounts of this type.
 * @property {number} account_count - Number of advertising accounts of this type.
 * @property {number} domain_count - Number of unique domains with advertising accounts of this type.
 */

/**
 * @typedef {Object} AdsAccountTypes
 * @property {AdsAccountTypeInfo} direct - Information about direct advertising accounts.
 * @property {AdsAccountTypeInfo} reseller - Information about reseller advertising accounts.
 */

/**
 * Ads.txt / App-ads.txt response data
 *
 * @typedef {Object} AdsTxtData
 * @property {boolean} present - Indicates if the ads.txt or app-ads.txt file is present.
 * @property {number} status - HTTP status code of the ads.txt file response.
 * @property {boolean} redirected - Indicates if the ads.txt file request was redirected.
 * @property {string|null} [redirected_to] - URL to which the ads.txt resource was redirected.
 * @property {number} [account_count] - Number of advertising accounts listed in the ads.txt file.
 * @property {AdsAccountTypes} [account_types] - Types of accounts (direct or reseller) listed in the ads.txt file.
 * @property {number} [line_count] - Total number of lines in the ads.txt file.
 * @property {string[]} [variables] - List of variables found in the ads.txt file.
 * @property {number} [variable_count] - Number of variables found in the ads.txt file.
 * @property {string} [error] - Error message if fetch or parse failed.
 */

// https://github.com/InteractiveAdvertisingBureau/Supply-Chain-Validation/blob/main/ads.txt%20v1.1.md
const parseAdsTxt = async (response) => {
  let content = await response.text();

  let result = {
    present: isPresent(response, ['/ads.txt', '/app-ads.txt']),
    status: response.status,
    redirected: response.redirected,
  };

  if (result.present && content) {
    result = {
      ...result,
      ...{
        redirected_to: response.redirected ? response.url : null,
        account_count: 0,
        account_types: {
          direct: {
            domains: new Set(),
            account_count: 0,
          },
          reseller: {
            domains: new Set(),
            account_count: 0,
          }
        },
        line_count: 0,
        variables: new Set(),
        variable_count: 0
      }
    };

    // Clean up file content
    content = content.replace(/#.*$/gm, '');
    content = content.replace(/\r/g, '');

    let lines = content.split('\n');
    result.line_count = lines.length;

    for (let line of lines) {
      // Variables
      let variables = line.split('=');
      if (variables.length == 2) {
        result.variables.add(variables[0].trim().toLowerCase());
        result.variable_count += 1;
        continue;
      }

      // Account records
      let relation_parts = line.split(',');
      if (relation_parts.length >= 3) {
        let type = relation_parts[2].trim().toLowerCase();
        if (['direct', 'reseller'].includes(type)) {
          result.account_types[type].domains.add(relation_parts[0].trim());
          result.account_types[type].account_count += 1;
        }
        result.account_count += 1;
      }
    }

    // Count unique and remove domain Sets for now
    for (let accountType of Object.values(result.account_types)) {
      accountType.domain_count = accountType.domains.size;
      accountType.domains = Array.from(accountType.domains); // delete accountType.domains
    }
    result.variables = Array.from(result.variables);
  }

  return result;

}


/**
 * @typedef {Object} SellerTypeInfo
 * @property {string[]} domains - List of domains associated with this seller type.
 * @property {number} seller_count - Number of sellers of this type.
 * @property {number} domain_count - Number of unique domains associated with this seller type.
 */

/**
 * @typedef {Object} SellerTypes
 * @property {SellerTypeInfo} publisher - Information about publisher sellers.
 * @property {SellerTypeInfo} intermediary - Information about intermediary sellers.
 * @property {SellerTypeInfo} both - Information about sellers who are both publishers and intermediaries.
 */

/**
 * Sellers.json response data
 *
 * @typedef {Object} SellersJsonData
 * @property {boolean} present - Indicates if the sellers.json file is present.
 * @property {number} status - HTTP status code of the sellers.json file response.
 * @property {boolean} redirected - Indicates if the sellers.json file request was redirected.
 * @property {string|null} [redirected_to] - URL to which the sellers.json resource was redirected.
 * @property {number} [seller_count] - Number of sellers listed in the sellers.json file.
 * @property {SellerTypes} [seller_types] - Types of sellers (publisher, intermediary, both) listed in the sellers.json file.
 * @property {number} [passthrough_count] - Number of passthrough sellers listed in the sellers.json file.
 * @property {number} [confidential_count] - Number of confidential sellers listed in the sellers.json file.
 * @property {string} [error] - Error message if fetch or parse failed.
 */

// https://github.com/InteractiveAdvertisingBureau/Supply-Chain-Validation/blob/main/sellers-json.md
const parseSellersJSON = async (response) => {
  let content;
  try {
    content = JSON.parse(await response.text());
  } catch {
    content = null;
  }
  let result = {
    present: isPresent(response, ['/sellers.json']),
    redirected: response.redirected,
    status: response.status,
  };

  if (result.present && content) {
    result = {
      ...result,
      ...{
        redirected_to: response.redirected ? response.url : null,
        seller_count: 0,
        seller_types: {
          publisher: {
            domains: new Set(),
            seller_count: 0,
          },
          intermediary: {
            domains: new Set(),
            seller_count: 0,
          },
          both: {
            domains: new Set(),
            seller_count: 0,
          }
        },
        passthrough_count: 0,
        confidential_count: 0
      }
    };

    // Clean up file content
    result.seller_count = content.sellers.length;

    for (let seller of content.sellers) {
      const stype = seller.seller_type.trim().toLowerCase();
      // Validating records
      if (!SELLER_TYPES.includes(stype) || !seller.seller_id) {
        continue;
      }

      // Passthrough
      if (seller.is_passthrough) {
        result.passthrough_count += 1;
      }

      // Confidential
      if (seller.is_confidential) {
        result.confidential_count += 1;
      }

      // Seller records
      if (seller.domain) {
        const domain = seller.domain.trim().toLowerCase();
        result.seller_types[stype].domains.add(domain);
        result.seller_types[stype].seller_count += 1;
      }
    }

    // Count unique and remove domain Sets for now
    for (let seller_type of Object.values(result.seller_types)) {
      seller_type.domain_count = seller_type.domains.size;
      seller_type.domains = Array.from(seller_type.domains); // delete seller_type.domains;
    }
  }

  return result;
}

/**
 * Ads Metrics
 *
 * @typedef {Object} AdsMetrics
 * @property {AdsTxtData} ads - Contains information about the ads.txt file. See [IAB Ads.txt Specification](https://github.com/InteractiveAdvertisingBureau/Supply-Chain-Validation/blob/main/ads.txt%20v1.1.md).
 * @property {AdsTxtData} app_ads - Contains information about the app-ads.txt file. See [IAB App-Ads.txt Specification](https://github.com/InteractiveAdvertisingBureau/Supply-Chain-Validation/blob/main/app-ads.txt.md).
 * @property {SellersJsonData} sellers - Contains information about the sellers.json file. See [IAB Sellers.json Specification](https://github.com/InteractiveAdvertisingBureau/Supply-Chain-Validation/blob/main/sellers-json.md).
 */

return Promise.all([
  fetchAndParse("/ads.txt", parseAdsTxt).catch(e => e),
  fetchAndParse("/app-ads.txt", parseAdsTxt).catch(e => e),
  fetchAndParse("/sellers.json", parseSellersJSON).catch(e => e),
]).then((all_data) => {
  return JSON.stringify({
    ads: all_data[0],
    app_ads: all_data[1],
    sellers: all_data[2]
  });
}).catch(error => {
  return JSON.stringify({
    error: error.message
  });
});
