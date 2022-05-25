//[robots_meta]
// Uncomment the previous line for testing on webpagetest.org

/*  Description: This file parses main frame raw, rendered, and headers for meta and x-robots-tag values for common bots and valid directives.  In addition, it aggregates iFrame raw and header robots directives.
    Created: 5.25.2022
*/

try {

  const response_bodies = $WPT_BODIES;

  // This block can be edited later without further code adjustments.
  const common_bots = ["bingbot", "msnbot", "google", "googlebot", "googlebot-news", "googleweblight", "robots", "otherbot"];
  const valid_types = ["noindex", "index", "follow", "none", "nofollow", "noarchive", "nosnippet", "unavailable_after", "max-snippet", "max-image-preview", "max-video-preview", "notranslate", "noimageindex", "nocache", "indexifembedded"];
  const noindex_types = ["noindex", "none"];
  const nofollow_types = ["noindex", "none", "nofollow"];
  // End block

  function getDocumentIframes() {
    return new Set(Array.from(document.querySelectorAll('iframe')).map(iframe=>iframe.src).filter(url=>url.length));
  }


  function getResponseHeaders(response_headers, name) {
    return response_headers[name]?.split("\n");
  }


  function getHTMLDocument(source) {
    let raw_document = document.implementation.createHTMLDocument("New Iframe Document");
    raw_document.documentElement.innerHTML = source;
    return raw_document;
  }


  function getResponseBodyEntriesForURLs(url_set) {
    return response_bodies.filter(har=>{
      return url_set.has(har.url);
    }).map(har=>{
      return [har.url, har.response_body, har.response_headers];
    });
  }


  function getHTMLRobotsMeta(doc) {
    let common_bots_set = new Set(common_bots);
    return Object.fromEntries(Array.from(doc.querySelectorAll('meta')).map(meta=>{
      let name = meta.getAttribute('name') || "";
      let content = meta.getAttribute('content') || meta.getAttribute('value') || "";
      return [name.trim().toLowerCase(), content.trim().toLowerCase()];
    }).filter(item=>common_bots_set.has(item[0])));
  }


  function getHeaderRobotsMeta(headers) {
    let common_bots_set = new Set(common_bots);
    let parsed_headers = getResponseHeaders(headers, "x-robots-tag") || [];
    return Object.fromEntries(Array.from(parsed_headers).map(robots=>{
      let parts = robots.trim().toLowerCase().split(":");
      return [parts.shift(), parts.join(":")];
    }).filter(item=>common_bots_set.has(item[0])));
  }


  function formatRobotsContent(content) {
    let valid_types_set = new Set(valid_types);
    let active = new Set(content.split(",").map(part=>part.split(":")[0].trim()).filter(item=>valid_types_set.has(item)));
    let base = Object.fromEntries(Array.from(valid_types).map(k=>[k, false]));
    let active_types = Object.fromEntries(Array.from(active).map(k=>[k, true]));
    return Object.assign(base, active_types);
  }


  function processRobotsHTML(doc) {
    let robots = getHTMLRobotsMeta(doc);
    return Object.fromEntries(Object.entries(robots).map(item=>[item[0], formatRobotsContent(item[1])]));
  }


  function processRobotsHeaders(headers) {
    let robots = getHeaderRobotsMeta(headers);
    return Object.fromEntries(Object.entries(robots).map(item=>[item[0], formatRobotsContent(item[1])]));
  }


  function processRobotsIframes(bodies) {
    let result_bodies = {};
    let result_headers = {};
    let base = Object.fromEntries(Array.from(valid_types).map(k=>[k, 0]));

    [...bodies].forEach(body=>{
      let doc = getHTMLDocument(body[1]);
      let headers = body[2];
      let robots_bodies = processRobotsHTML(doc);

      for (var bot in robots_bodies) {
        if (!result_bodies.hasOwnProperty(bot)) {
          result_bodies[bot] = Object.assign({}, base);
        }
        [...Object.entries(robots_bodies[bot])].forEach(item=>{
          result_bodies[bot][item[0]] += item[1] ? 1 : 0;
        }
      );

    }
      let robots_headers = processRobotsHeaders(headers);
      for (var bot in robots_headers) {
        if (!result_headers.hasOwnProperty(bot)) {
          result_headers[bot] = Object.assign({}, base);
        }
        [...Object.entries(robots_headers[bot])].forEach(item=>{
        result_headers[bot][item[0]] += item[1] ? 1 : 0;
        });
      }
    });

    return {
      'bodies': result_bodies,
      'headers': result_headers
    };
  }


  function formatCrawlData(processed){
    const nofollow_types_set = new Set(nofollow_types);
    const noindex_types_set = new Set(noindex_types);
    return Object.fromEntries(Object
                              .entries(processed)
                              .map(item => {
                                let name = item[0];
                                let values = item[1];
                                let indexable = Object.keys(values).filter(k => noindex_types_set.has(k) && values[k]).length === 0;
                                let followable = Object.keys(values).filter(k => nofollow_types_set.has(k) && values[k]).length === 0;
                                return [name, {'indexable': indexable, 'followable': followable}];
                              }));
  }


  function processCrawlData(main_frame_robots_rendered_processed,
                            main_frame_robots_raw_processed,
                            main_frame_robots_headers_processed){
    let data =  {'rendered': formatCrawlData(main_frame_robots_rendered_processed),
                'raw': formatCrawlData(main_frame_robots_raw_processed),
                'headers': formatCrawlData(main_frame_robots_headers_processed)
                };
    data.all = Object.assign(data.raw, data.rendered, data.headers);
    return data;
  }


  const iframe_bodies = getResponseBodyEntriesForURLs(getDocumentIframes());
  const processed_iframes = processRobotsIframes(iframe_bodies);
  const raw_html_document = getHTMLDocument(response_bodies[0].response_body);
  const rendered_html_document = document;
  const response_headers = response_bodies[0].response_headers;
  const main_frame_robots_rendered_processed = processRobotsHTML(rendered_html_document);
  const main_frame_robots_raw_processed = processRobotsHTML(raw_html_document);
  const main_frame_robots_headers_processed = processRobotsHeaders(response_headers);
  const main_frame_crawl_data_processed = processCrawlData(main_frame_robots_rendered_processed,
                                                          main_frame_robots_raw_processed,
                                                          main_frame_robots_headers_processed);

  return {
    main_frame_robots_rendered: main_frame_robots_rendered_processed,
    main_frame_robots_raw: main_frame_robots_raw_processed,
    main_frame_robots_headers: main_frame_robots_headers_processed,
    iframe_robots_raw: processed_iframes.bodies,
    iframe_robots_headers: processed_iframes.headers,
    main_frame_crawl_data: main_frame_crawl_data_processed
  };


} catch (err) {
  console.log(err);
  return {
    error: err.toString()
  };
}
