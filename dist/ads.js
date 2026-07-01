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

// https://iabtechlab.com/wp-content/uploads/2022/04/Ads.txt-1.1.pdf
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


// https://iabtechlab.com/wp-content/uploads/2019/07/Sellers.json_Final.pdf
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


// https://github.com/InteractiveAdvertisingBureau/Data-Subject-Rights/blob/main/Data%20Deletion%20Request%20Framework.md
const parseDSRDeleteJSON = async (response) => {
  let content;
  try {
    content = JSON.parse(await response.text());
  } catch {
    content = null;
  }
  let result = {
    present: isPresent(response, ['/dsrdelete.json']),
    status: response.status,
    redirected: response.redirected,
  };

  if (result.present && content) {
    if (response.redirected) result.redirected_to = response.url;
    if (content.endpoint) result.endpoint = content.endpoint;
    if (content.pollFrequency) result.pollFrequency = content.pollFrequency;
    if (content.identifiers) result.identifiers = content.identifiers.map(({ type, format }) => ({ type, format }));
    if (typeof content.vendorScriptRequirement === 'boolean') result.vendorScriptRequirement = content.vendorScriptRequirement;
    if (typeof content.vendorScript === 'string') result.vendorScript = true;
    if (content.dsrdeleteJsonUri) result.dsrdeleteJsonUri = content.dsrdeleteJsonUri;
  }

  return result;
}

return Promise.all([
  fetchAndParse("/ads.txt", parseAdsTxt).catch(e => e),
  fetchAndParse("/app-ads.txt", parseAdsTxt).catch(e => e),
  fetchAndParse("/sellers.json", parseSellersJSON).catch(e => e),
  fetchAndParse("/dsrdelete.json", parseDSRDeleteJSON).catch(e => e),
]).then((all_data) => {
  return JSON.stringify({
    ads: all_data[0],
    app_ads: all_data[1],
    sellers: all_data[2],
    dsrdelete: all_data[3]
  });
}).catch(error => {
  return JSON.stringify({
    error: error.message
  });
});
