//[ads_txt]
// Extracts status, record count, and record counts respective to relationship.
// Standard Specification: https://iabtechlab.com/wp-content/uploads/2022/04/Ads.txt-1.1.pdf

function parseAdsTxt(response) {
  return response.text().then(file_content => {
    let result = {
      present: response.ok && (response.url.endsWith('/ads.txt') || response.url.endsWith('/app-ads.txt')),
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
  })
}

function fetchAndParse(url) {
  const controller = new AbortController();
  const { signal } = controller;
  setTimeout(() => controller.abort(), 5000);

  return fetch(url, { signal })
    .then(response => {
      return parseAdsTxt(response);
    })
    .catch(error => {
      console.log('Fetch Error: ', error.message);
      return {
        status: -1,
        present: false,
        error: error
      };
    });
}

return Promise.all([
  fetchAndParse("/ads.txt").catch(e => e),
  fetchAndParse("/app-ads.txt").catch(e => e),
]).then((all_data) => {
  return JSON.stringify({
    ads: all_data[0],
    app_ads: all_data[1]
  });
}).catch(error => {
  return JSON.stringify({
    status: -1,
    present: false,
    error: error
  })
});
