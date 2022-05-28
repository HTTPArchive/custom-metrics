//[performance]

const response_bodies = $WPT_BODIES;

function getRawHtmlDocument() {
  let rawHtml;
  if (response_bodies.length > 0) {
      rawHtml = response_bodies[0].response_body;
  }

  rawHtmlDocument = document.implementation.createHTMLDocument("New Document");
  rawHtmlDocument.documentElement.innerHTML = rawHtml;

  return rawHtmlDocument;
}

function getLcpElement() {
  return new Promise((resolve) => {
      new PerformanceObserver((entryList) => {
          const lcpCandidates = entryList.getEntries();
          const naiveLcpEntry = lcpCandidates[lcpCandidates.length - 1];

          resolve(naiveLcpEntry);
      }).observe({ type: "largest-contentful-paint", buffered: true });
  }).then(({ startTime, element, url, size, loadTime, renderTime }) => {
      const attributes = getAttributes(element);
      const styles = getComputedStyles(element, ['background-image']);
      return {
          startTime,
          nodeName: element?.nodeName,
          url,
          size,
          loadTime,
          renderTime,
          attributes,
          boundingClientRect: element?.getBoundingClientRect().toJSON(),
          naturalWidth: element?.naturalWidth,
          naturalHeight: element?.naturalHeight,
          styles
      };
  });
}

function getAttributes(element) {
  if (!element) {
      return null;
  }

  return Array.from(element.attributes).map(attr => {
      return {
          name: attr.name,
          value: attr.value
      };
  });
}

function getComputedStyles(element, properties) {
  if (!element) {
      return null;
  }

  const styles = getComputedStyle(element);
  return Object.fromEntries(properties.map(prop => ([prop, styles.getPropertyValue(prop)])));
}

function summarizeLcpElement(element) {
  if (!element) {
      return null;
  }

  const nodeName = element.nodeName;
  const attributes = getAttributes(element);

  return {
      nodeName,
      attributes
  }
}

function getWebVitalsJS() {
  const webVitalsJSPattern = /(8999999999999[\s\S]+1e12[\s\S]+(largest-contentful-paint|first-input|layout-shift)|(largest-contentful-paint|first-input|layout-shift)[\s\S]+8999999999999[\s\S]+1e12)/m;
  return response_bodies.filter(har => {
      return webVitalsJSPattern.test(har.response_body);
  }).map(har => har.url);
}

function getGamingMetrics(rawDoc) {
  let returnObj = {};
  const regexForCheckChromeLH = new RegExp(/.{1}userAgent.{1,100}(?:Chrome-Lighthouse|Google Lighthouse).{2}/)
  const regexForCheckGTmetrix = new RegExp(/.{1}userAgent.{1,100}(?:GTmetrix|gtmetrix.com).{2}/)
  const regexForCheckPageSpeed = new RegExp(/.{1}userAgent.{1,100}(?:PageSpeed).{2}/)
   let scripts =rawDoc.getElementsByTagName("script");
      for (let i = 0; i < scripts.length; i++) {
      if (!scripts[i].src) {
          let scriptTagCode = scripts[i].innerHTML;
              if(regexForCheckChromeLH.test(scriptTagCode)){
                  returnObj['detectUA-ChromeLH'] = true;
              }
              if(regexForCheckGTmetrix.test(scriptTagCode)){
                  returnObj['detectUA-GTmetrix'] = true;
              }
              if(regexForCheckPageSpeed.test(scriptTagCode)){
                  returnObj['detectUA-PageSpeed'] = true;
              }
      }
   }
   //https://www.debugbear.com/blog/optimizing-web-vitals-without-improving-performance
  //https://cdpn.io/pen/debug/oNEwJNw?authentication_hash=LQMExNggGWOk
  //catch lcp animation / cls animation & overlay hack
  const regexForCheckfadeInAnimation = new RegExp(/this.style.animation.{1,10}.fadein.{1,20}.forwards/)
  let elements = rawDoc.getElementsByTagName("IMG");
      for (let i = 0; i < elements.length; i++)
       {
          let el = elements[i];
         if( el.onload !== null)
         {
             let onloadVal = el.onload;
              if(regexForCheckfadeInAnimation.test(onloadVal) )
                  {
                      returnObj['lcpAnimation'] = "true";
                  }
         }
         let styleObj = el.style;
         if(styleObj['pointer-events'] == "none" && styleObj['position'] == "absolute" &&  styleObj['width'] == "99vw" && styleObj['height'] == "99vh")
         {
            returnObj['lcpOverlay'] = "true"
         }
      }
 
  //add logic for svg & body overlay
  //https://cdpn.io/pen/debug/XWZzgoo?authentication_hash=NQAzYoKKXPyr
  let svgTags  =rawDoc.getElementsByTagName("svg");
  for (let i = 0; i < svgTags.length; i++)
  {
      const svg = svgTags[i];
      if(svg.clientHeight == 99999 && svg.clientWidth == 99999 &&  svg.clientLeft == 0 && svg.clientTop == 0)
      {
          //additional check required
          returnObj['lcpSvgOverlay'] = "true"
      }
  }
   //fid iframe hack
    
  return returnObj
}

return Promise.all([getLcpElement()]).then(([lcp_elem_stats]) => {
  const lcpUrl = lcp_elem_stats.url;
  const rawDoc = getRawHtmlDocument();
  let isLcpStaticallyDiscoverable = null;
  let isLcpPreloaded = null;
  let responseObject = null;
  let rawLcpElement = null;
  const isLcpExternalResource = lcpUrl != '';
  if (isLcpExternalResource) {
      // Check if LCP resource reference is in the raw HTML (as opposed to being injected later by JS)
      rawLcpElement = Array.from(rawDoc.querySelectorAll('picture source, img')).find(i => {
          let src = i.src;
          if (i.nodeName == 'SOURCE') {
              src = new URL(i.srcset, location.href).href;
          }

          return src == lcpUrl;
      });
      isLcpStaticallyDiscoverable = !!rawLcpElement;
      isLcpPreloaded = !!Array.from(rawDoc.querySelectorAll('link')).find(link => {
          return link.rel == 'preload' && link.href == lcpUrl;
      });
      responseObject = response_bodies.find(r => {
          return r.url == lcpUrl;
      });
      if (responseObject) {
          // Don't write the response body to custom metrics.
          responseObject.response_body = undefined;
      }
  }

  return {
      lcp_elem_stats,
      raw_lcp_element: summarizeLcpElement(rawLcpElement),
      lcp_resource: responseObject,
      is_lcp_statically_discoverable: isLcpStaticallyDiscoverable,
      is_lcp_preloaded: isLcpPreloaded,
      web_vitals_js: getWebVitalsJS(),
      gamingMetrics: getGamingMetrics(rawDoc)
  };
}).catch(error => {
  return {error};
});
