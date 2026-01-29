//[robots_txt]

// Extracts status, size, overall record count, and record counts respective to user-agents.

/*
Example Output:
{
  "redirected": false,
  "status": 200,
  "size": 2279,
  "size_kib": 2.2255859375,
  "over_google_limit": false,
  "comment_count": 19,
  "record_counts": {
    "by_type": {
      "sitemap": 0,
      "user_agent": 1,
      "allow": 32,
      "disallow": 36,
      "crawl_delay": 1,
      "noindex": 0,
      "other": 0
    },
    "by_useragent": {
      "*": {
        "allow": 32,
        "disallow": 36,
        "crawl_delay": 1,
        "noindex": 0,
        "other": 0
      }
    }
  }
}
*/

const fetchWithTimeout = (url) => {
  var controller = new AbortController();
  setTimeout(() => {controller.abort()}, 5000);
  return fetch(url, {signal: controller.signal});
}

const NON_USERAGENT_TYPES = {
    'sitemap': 'sitemap'
};

const parseRecords = (text)=>{

    const cleanLines = (r)=>r.replace(/(\s+|^\s*)#.*$/gm, '').trim().toLowerCase();
    const splitOnLines = (r)=>r.split(/[\r\n]+/g).filter((e)=>e.length > 0);
    const lines = splitOnLines(cleanLines(text));

    // Match any valid token followed by a colon. While rule key-value pairs
    // don't have a pattern definition in RFC9309, based on common rules in
    // robots.txt files, we can assume the rule keys follow the pattern of the
    // product token ("user-agent"), which is [a-z0-9_-].
    // https://www.rfc-editor.org/rfc/rfc9309.html#name-formal-syntax
    const regex = /^([a-z0-9_-]+)\s*:\s*(.*)$/;

    const records = lines.map(line => {
        let rec_match = line.match(regex);

        if (rec_match) {
            return {
                record_type: rec_match[1].trim(),
                record_value: rec_match[2].trim()
            };
        }

        return {
            record_type: 'other',
            record_value: line
        };
    });

    return records;
}

return fetchWithTimeout('/robots.txt')
  .then(r => {
    let result = {};
    result.redirected = !!r.redirected;
    result.status = r.status;
    return r.text().then(t => {

      // Overall Metrics
      result.size = t.length;
      result.size_kib = t.length / 1024;
      result.over_google_limit = result.size_kib > 500;
      result.comment_count = t.match(/(\s+|^\s*)#.*$/gm)?.length ?? 0;
      result.record_counts = {};

      // Parse Records to clean objects
      const records = parseRecords(t);

      // Record counts by type of record
      result.record_counts.by_type = {};

      // Count all types found
      for (let record of records) {
          let rawType = record.record_type;
          let outputKey = rawType.replace(/-/g, '_');
          result.record_counts.by_type[outputKey] = (result.record_counts.by_type[outputKey] ?? 0) + 1;
      }

      // Record counts by user-agent
      let counts_by_useragent = {};
      var applies_to_useragent = [];
      var last = null;

      for (let record of records) {

          if (record.record_type == 'user-agent') {

              // If empty build
              if (!(record.record_value in counts_by_useragent)) {
                  counts_by_useragent[record.record_value] = {};
              }

              // If prior record UA, append to list, else create list of 1.
              if (last == 'user-agent') {
                  applies_to_useragent.push(record.record_value);
              } else {
                  applies_to_useragent = [record.record_value];
              }

          } else {
              // Ignore global records such as 'sitemap' because they're not
              // associated with a user-agent.
              if (!(record.record_type in NON_USERAGENT_TYPES)) {
                  let outputKey = record.record_type.replace(/-/g, '_');

                  for (let ua of applies_to_useragent) {
                      counts_by_useragent[ua][outputKey] = (counts_by_useragent[ua][outputKey] ?? 0) + 1
                  }
              }
          }

          last = record.record_type;

      }

      result.record_counts.by_useragent = counts_by_useragent;

      return JSON.stringify(result);
    });
  })
  .catch(error => {
    return JSON.stringify({message: error.message, error: error});
  });
