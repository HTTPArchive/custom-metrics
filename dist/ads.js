//[ads]

const ACCOUNT_TYPES = ['direct', 'reseller'];
const SELLER_TYPES = ['publisher', 'intermediary', 'both'];

const isPresent = (response, endings) => response.ok && endings.find(ending => response.url.endsWith(ending));

const fetchAndParse = async (url, parser) => {
  const controller = new AbortController();
  const { signal } = controller;
  setTimeout(() => controller.abort(), 5000);

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

// Extracts status, record count, and record counts respective to relationship.
// Standard Specification: https://iabtechlab.com/wp-content/uploads/2022/04/Ads.txt-1.1.pdf
const parseAdsTxt = async (response) => {
  const content = await response.text();

  let result = {
    present: isPresent(response, ['/ads.txt', '/app-ads.txt']),
    redirected: response.redirected,
    status: response.status,
  };

  if (result.present) {
    result = {
      ...result, ...{
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
        variable_count: 0,
      }
    };

    // Clen up file content
    file_content = file_content.replace(/#.*$/gm, '');
    file_content = file_content.replace(/\r/g, '');

    let lines = file_content.split('\n');
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
    };

    // Convert Sets to Arrays
    for (let accountType of Object.values(result.account_types)) {
      accountType.domain_count = accountType.domains.size;
      delete accountType.domains // Keeping a list of domains may be valuable for further research, e.g. accountType.domains = [...accountType.domains];
    }
    result.variables = [...result.variables];
  }

  return result;

}


//Extracts seller record mertrics.
//Standard Specification: https://iabtechlab.com/wp-content/uploads/2019/07/Sellers.json_Final.pdf
const parseSellersJSON = async (response) => {
  let content;
  try {
    content = JSON.parse(await response.text());
  } catch {
    content = null;
  }
  let result = {
    present: isPresent(response, ['/ads.txt', '/app-ads.txt']),
    redirected: response.redirected,
    status: response.status,
  };

  if (result.present) {
    result = {
      ...result, ...{
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
        passthrough_count: 0
      }
    };

    // Clean up file content
    file_content_json = JSON.parse(file_content);
    file_content_json.seller_count = file_content_json.sellers.length;

    for (let seller of file_content_json.sellers) {
      // Seller records
      let type = seller.seller_type.trim().toLowerCase(),
        domain = seller.domain.trim();
      if (Object.keys(result.seller_types).includes(type)) {
        result.seller_types[type].domains.add(domain);
        result.seller_types[type].seller_count += 1;
      }
      result.seller_count += 1;

      // Passthrough
      if (seller.is_passthrough) {
        result.passthrough_count += 1;
      }
    }
  };

  // Count unique and remove domain Sets for now
  for (let seller_type of Object.values(result.seller_types)) {
    seller_type.domain_count = seller_type.domains.size;
    delete seller_type.domains //seller_type.domains = [...seller_type.domains];
  }

  return result;
}

return Promise.all([
  fetchAndParse("/ads.txt", parseAdsTxt),
  fetchAndParse("/app-ads.txt", parseAdsTxt),
  fetchAndParse("/sellers.json", parseSellersJSON),
]).then((all_data) => {
  return JSON.stringify({
    ads: all_data[0],
    app_ads: all_data[1],
    sellers: all_data[2]
  });
}).catch(error => {
  return JSON.stringify({
    error: error
  });
});
