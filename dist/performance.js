//[performance]

const response_bodies = $WPT_BODIES;

function getRawHtmlDocument() {
    let _rawHtml;
    if (_wptBodies.length > 0) {
        _rawHtml = _wptBodies[0].response_body;
    }

    rawHtmlDocument = document.implementation.createHTMLDocument("New Document");
    rawHtmlDocument.documentElement.innerHTML = html;

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
        let attributes = [];
        for (let index = 0; index < element.attributes.length; index++) {
            const ele = element.attributes.item(index);
            attributes[index] = { name: ele.name, value: ele.value };
        }

        return {
            startTime,
            nodeName: element.nodeName,
            url,
            size,
            loadTime,
            renderTime,
            attributes,
        };
    });
}

function getWebVitalsJS() {
    const webVitalsJSPattern = /(8999999999999[\s\S]+1e12[\s\S]+(largest-contentful-paint|first-input|layout-shift)|(largest-contentful-paint|first-input|layout-shift)[\s\S]+8999999999999[\s\S]+1e12)/m;
    return response_bodies.filter(har => {
        return webVitalsJSPattern.test(har.response_body);
    }).map(har => har.url);
}

return Promise.all([getLcpElement()]).then(lcp_elem_stats => {
    const rawDoc = getRawHtmlDocument();
    const isLcpDiscoverable = !!Array.from(rawDoc.querySelectorAll('img')).find(img => {
        return img.src == lcp_elem_stats.url;
    });
    const isLcpPreloaded = !!Array.from(rawDoc.querySelectorAll('head link')).find(link => {
        return link.rel == 'preload' && link.href == lcp_elem_stats.url;
    });

    return {
        lcp_elem_stats,
        is_lcp_discoverable: isLcpDiscoverable,
        is_lcp_preloaded: isLcpPreloaded,
        web_vitals_js: getWebVitalsJS()
    };
});
