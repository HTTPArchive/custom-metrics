//[javascript]
// Uncomment the previous line for testing on webpagetest.org

// Please, refer to instructions for adding a custom metric in almanac.js.

function fetchWithTimeout(url) {
    var controller = new AbortController();
    setTimeout(() => {controller.abort()}, 5000);
    return fetch(url, {signal: controller.signal});
  }

const requests = $WPT_REQUESTS;

let getSourceMaps = (async () => {
  const $$ = (s) => [...document.querySelectorAll(s)];
  const sourcemapRegex = /\/\/[#@] sourceMappingURL=(.+?)$/;

  // filter Script requests from $WPT_BODIES
  let scripts = $WPT_BODIES
    .filter((request) => request.type == "Script")
    .map((file) => {
      return { url: file.url, body: file.response_body };
    });

  // search for inline scripts
  scripts.push(
    ...$$("script")
      .filter((n) => !n.src)
      .map((s) => {
        return {
          url: location,
          body: s.textContent,
        };
      })
  );

  let sourcemapURLs = scripts
    .map((n) => {
      if (n) {
        let url = n.body.match(sourcemapRegex)?.[1];

        if (url) {
          // Source map URL is relative to stylesheet URL
          return new URL(url, n.url);
        }
      }
    })
    .filter((url) => !!url);

  const results = {
    count: sourcemapURLs.length,
    ext: {},
  };

  if (sourcemapURLs.length === 0) {
    return results;
  }

  // fetch JavaScript source files
  let js = await Promise.all(
    sourcemapURLs.map(async (n) => {
      try {
        var response = await fetchWithTimeout(n);
        var json = await response.json();
      } catch (e) {
        return;
      }

      let sources = json.sources;
      let base = json.sourceRoot ? new URL(json.sourceRoot, n) : n;
      let js = 0;
      let ts = 0;
      let babel = 0;

      sources = sources.map((s) => {
        let url = new URL(s, base);

        let ext = url.pathname.match(/\.(\w+)$/)?.[1];
        if (ext) {
          results.ext[ext] = (results.ext[ext] || 0) + 1;

          if (ext === "js" || ext === "jsx") {
            js++;
          }

          if (ext === "ts" || ext === "tsx") {
            ts++;
          }
        }

        if (url.pathname.match(/@babel/)) {
            babel++;
        }

        return url;
      });
      if(babel > 0) {
        results.babel = true;
      }

      if (js + ts > 0) {
        if (json.sourcesContent) {
          // Source is already here, no more requests needed, yay!
          return json.sourcesContent;
        }

        let code = await Promise.all(
          sources.map(async (s) => {
            try {
              let response = await fetchWithTimeout(s);
              let text = response.ok ? await response.text() : "";

              return text;
            } catch (e) {
              return "";
            }
          })
        );

        return code.join("\n");
      }
    })
  );

  js = js.filter((n) => !!n).join("\n");

  results.js = {
    size: js.length,
    stats: {},
  };

  return results;
})();

return Promise.all([getSourceMaps]).then(([sourceMaps]) =>
  JSON.stringify({
    ajax_requests: (() => {
      // Returns the number of ajax requests per page.
      var ajax_apis = ["xmlhttprequest", "fetch", "beacon"];
      return window.performance
        .getEntriesByType("resource")
        .filter((r) => ajax_apis.includes(r.initiatorType))
        .reduce((obj, r) => {
          obj.total++;
          obj[r.initiatorType]++;
          return obj;
        }, Object.fromEntries([...ajax_apis, "total"].map((api) => [api, 0])));
    })(),

    // Returns the number of ajax requests using beacon.
    beacon_ajax_usage: window.performance
      .getEntriesByType("resource")
      .filter((r) => r.initiatorType === "beacon").length,

    // Returns the number of iframes per page.
    iframe: document.getElementsByTagName("iframe").length,

    requests_protocol: (() => {
      // Returns the percentage of http 2 protocol used.
      try {
        var ajaxs = window.performance
          .getEntriesByType("resource")
          .filter((r) =>
            ["xmlhttprequest", "fetch", "beacon"].includes(r.initiatorType)
          );
        var resources = window.performance
          .getEntriesByType("resource")
          .filter(
            (r) =>
              r.initiatorType !== "xmlhttprequest" &&
              r.initiatorType !== "fetch" &&
              r.initiatorType !== "beacon"
          );
        let request_data = {
          ajax_h1: ajaxs.filter((r) =>
            ["http/1.1", "http/1"].includes(r.nextHopProtocol)
          ).length,
          resources_h1: resources.filter((r) =>
            ["http/1.1", "http/1"].includes(r.nextHopProtocol)
          ).length,
          ajax_h2: ajaxs.filter((r) =>
            ["h2", "http/2", "http2"].includes(r.nextHopProtocol)
          ).length,
          resources_h2: resources.filter((r) =>
            ["h2", "http/2", "http2"].includes(r.nextHopProtocol)
          ).length,
          ajax_h3: ajaxs.filter((r) =>
            ["h3", "http/3", "h3-29"].includes(r.nextHopProtocol)
          ).length,
          resources_h3: resources.filter((r) =>
            ["h3", "http/3", "h3-29"].includes(r.nextHopProtocol)
          ).length,
        };
        return request_data;
      } catch (e) {
        return null;
      }
    })(),

    web_component_specs: (() => {
      var getNodeName = (el) => el.nodeName.toLowerCase();
      var elements_with_hyphen = Array.from(
        document.getElementsByTagName("*")
      ).filter((e) => e.nodeName.includes("-"));
      var unique_elements_with_hyphen = [
        ...new Set(elements_with_hyphen.map((e) => e.nodeName)),
      ].map((element) => {
        return elements_with_hyphen.find((e) => e.nodeName === element);
      });
      var web_components = unique_elements_with_hyphen.filter((e) =>
        customElements.get(e.nodeName.toLowerCase())
      );

      // Checking which web comp spec is used by found web_components (template, shadow_dom, custom_elements)
      var shadow_roots = web_components.filter((e) => e.shadowRoot);
      var template = web_components.filter((e) =>
        Array.from(e.children).some(
          (r) => r.nodeName.toLowerCase() === "template"
        )
      );
      var web_component_specs = {
        custom_elements: web_components.map(getNodeName),
        shadow_roots: shadow_roots.map(getNodeName),
        template: template.map(getNodeName),
      };
      return web_component_specs;
    })(),

    script_tags: (() => {
      let script_tags = Array.from(document.querySelectorAll("script"));

      let script_data = {
        total: script_tags.length,
        async: script_tags.filter((tag) => tag.async).length,
        defer: script_tags.filter((tag) => tag.defer).length,
        crossorigin: script_tags.filter((tag) => tag.crossorigin).length,
        integrity: script_tags.filter((tag) => tag.integrity).length,
        nomodule: script_tags.filter((tag) => tag.nomodule).length,
        nonce: script_tags.filter((tag) => tag.nonce).length,
        referrerpolicy: script_tags.filter((tag) => tag.referrerpolicy).length,
        src: script_tags.filter((tag) => tag.src).length,
        inline: script_tags.filter((tag) => !tag.src).length,
        type_module: script_tags.filter((tag) => tag.type == "module").length,
        async_and_defer: script_tags.filter((tag) => tag.async && tag.defer)
          .length,
        defer_without_src: script_tags.filter((tag) => tag.defer && !tag.src)
          .length,
        //deprecated attribute adoption
        charset: script_tags.filter((tag) => tag.charset).length,
        language: script_tags.filter((tag) => tag.hasAttribute("language"))
          .length,
      };

      return script_data;
    })(),

    noscript_tags: (() => {
      let noscript_data = {
        total: document.querySelectorAll("noscript").length,
      };

      return noscript_data;
    })(),

    sourceMaps,

    bundler: (() => {
        const bundler = {
            webpack: !(typeof webpackJsonp === "undefined" && typeof webpackChunk === "undefined"),
            parcel: !(typeof parcelRequire === "undefined")
        }

        return Object.entries(bundler).filter(n => n[1]).map(n => n[0]);
    })()
  })
);
