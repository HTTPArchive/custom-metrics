//[performance]

const response_bodies = $WPT_BODIES;
const script_response_bodies = $WPT_BODIES.filter(body => body.type === 'Script');

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
        const cover90viewport = doesElementCoverPercentageOfViewport(element, 90);
        const attributes = getAttributes(element);
        const styles = getAllStyles(element, ['background-image', 'pointer-events', 'position', 'width', 'height']);
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
            styles,
            cover90viewport
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

function getInlineStyles (element, properties) {
    if (!element) {
        return null;
    }

    const styles = element.style;
    return Object.fromEntries(properties.map(prop => ([prop, styles.getPropertyValue(prop)])));
}

// Merge Inline styles with Computed styles.
// Inline has higher specificty, unless '!important' exists in computed styles.
function getAllStyles(element, properties) {
    const inlineStyles = getInlineStyles(element, properties);
    const computedStyles = getComputedStyles(element, properties);
    const allStyles = {};
    for (const styleName in inlineStyles) {
        if (!inlineStyles[styleName].includes('!important') && computedStyles.hasOwnProperty(styleName) && computedStyles[styleName].includes('!important')) {
            allStyles[styleName] = computedStyles[styleName];
        } else {
            allStyles[styleName] = inlineStyles[styleName];
        }
    }
    return allStyles;
}

function summarizeElement(element) {
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

function testPropertyStringInResponseBodies(regex) {
    try {
        return script_response_bodies.some(body => {
            if (!body.response_body) {
                return false;
            }
            return regex.test(body.response_body);
        });
    } catch (error) {
        return false;
    }
}

function getGamingMetrics(rawDoc, lcp_elem_stats) {
    let returnObj = {};
    const regexForCheckChromeLH = new RegExp(/.{1}userAgent.{1,100}(?:Chrome-Lighthouse|Google Lighthouse).{2}/)
    const regexForCheckGTmetrix = new RegExp(/.{1}userAgent.{1,100}(?:GTmetrix|gtmetrix.com).{2}/)
    const regexForCheckPageSpeed = new RegExp(/.{1}userAgent.{1,100}(?:PageSpeed).{2}/)

    //inline scripts check
    Array.from(rawDoc.querySelectorAll('script:not([src])')).forEach(script => {
        let scriptTagCode = script.innerHTML;
        if (regexForCheckChromeLH.test(scriptTagCode)){
            returnObj['detectUA-ChromeLH'] = true;
        }
        if(regexForCheckGTmetrix.test(scriptTagCode)){
            returnObj['detectUA-GTmetrix'] = true;
        }
        if(regexForCheckPageSpeed.test(scriptTagCode)){
            returnObj['detectUA-PageSpeed'] = true;
        }
    });

    //check external scripts response bodies
    if (testPropertyStringInResponseBodies(regexForCheckChromeLH)) {
        returnObj['detectUA-ChromeLH'] = true;
    }

    if (testPropertyStringInResponseBodies(regexForCheckGTmetrix)) {
        returnObj['detectUA-GTmetrix'] = true;
    }

    if (testPropertyStringInResponseBodies(regexForCheckPageSpeed)) {
        returnObj['detectUA-PageSpeed'] = true;
    }

    //https://www.debugbear.com/blog/optimizing-web-vitals-without-improving-performance
    //Catch image animation & overlay hack (used for LCP and CLS)
    const regexForCheckfadeInAnimation = new RegExp(/this.style.animation.{1,10}.fadein.{1,20}.forwards/)
    Array.from(rawDoc.querySelectorAll('img')).forEach(el => {
        let onloadVal = el.getAttribute('onload');
        if (onloadVal !== null) {
            if(regexForCheckfadeInAnimation.test(onloadVal)) {
                returnObj['imgAnimationStrict'] = true;
            }

            const computedStyles = getAllStyles(el, ['opacity']);
            if(computedStyles['opacity'] === '0') {
                returnObj['imgAnimationSoft'] = true;
            }
        }
    });

    //FID iframe hack
    Array.from(document.getElementsByTagName('iframe')).forEach(iframeElement => {
        let iframeTransparencyVal = iframeElement.getAttribute('allowtransparency');
        if (iframeTransparencyVal) {
            const allStyles = getAllStyles(iframeElement, ['position','top','z-index','left']);
            if (allStyles['position'] == 'absolute' &&
                allStyles['top'] == '0px' &&
                allStyles['left'] == '0px' &&
                allStyles['z-index'] == '999') {
                returnObj['fidIframeOverlayStrict'] = true;
            }
        }

        returnObj['fidIframeOverlaySoft'] = doesElementCoverPercentageOfViewport(iframeElement, 90);

    });

    // Detect LCP Overlay Hack
    const styles = lcp_elem_stats.styles;
    if (styles['pointer-events'] == 'none' &&
        styles['position'] == 'absolute' &&
        styles['width'] == '99vw' &&
        styles['height'] == '99vh') {
            returnObj['lcpOverlayStrict'] = true;
    }
    if (lcp_elem_stats.cover90viewport && styles['pointer-events'] == 'none') {
        returnObj['lcpOverlaySoft'] = true;
    }

    return returnObj;
}

// Source: https://stackoverflow.com/questions/57786082/determine-how-much-of-the-viewport-is-covered-by-element-intersectionobserver
// percentage is a whole number (ex: 90, not .9)
function doesElementCoverPercentageOfViewport(element, percentage) {
        const elementBCR = element.getBoundingClientRect();
        const percentOfViewport = ((elementBCR.width * elementBCR.height) * calcOcclusion(elementBCR)) / ((window.innerWidth * window.innerHeight) / 100);

        if (percentOfViewport > percentage) {
            return true;
        }
        return false;
}

// Calculate Element : Viewport Intersection ratio without Intersection Observer
// Source: https://stackoverflow.com/questions/54540602/match-if-visible-on-70-with-getboundingclientrect-js
function clipRect(rect){
    return {
        left: Math.max(0, rect.left),
        top: Math.max(0, rect.top),
        right: Math.min(window.innerWidth, rect.right),
        bottom: Math.min(window.innerHeight, rect.bottom)
    }
}

function calcArea(rect){
    return (rect.right-rect.left) * (rect.bottom-rect.top)
}

function calcOcclusion(rect){
    const clipped_rect = clipRect(rect)
    return Math.max(0, calcArea(clipped_rect)/calcArea(rect))
}

function splitSrcSet(srcset) {
    // "img.jpg 100w, img2.jpg 300w"
    return srcset.split(',').map(srcDesc => {
        // "img.jpg 100w", " img2.jpg 300w"
        const src = srcDesc.trim().split(/\s+/)[0];
        return new URL(src, location.href).href;
    });
}

function parseLinkHeader(link) {
    if (!link) {
        return {};
    }

    const srcPattern = /<([^>]+)>/;
    const paramPattern = /([^=]+)=['"]?([^'"]+)['"]?/;
    return Object.fromEntries(link.split(/[,\n]/).map(l => {
        let [src, ...params] = l.split(';');

        if (!srcPattern.test(src)) {
            return [];
        }
        src = src.match(srcPattern)[1];
        src = new URL(src, location.href).href;

        params = params.map(p => {
            p = p.trim().toLowerCase();
            if (!paramPattern.test(p)) {
                return;
            }
            const [_, key, value] = p.match(paramPattern);
            return {key, value};
        });
        return [src, params];
    }));
}

function getLcpPreloadInfo(rawDoc, lcpUrl) {
    const lcpPreload = {};

    const preloadTag = Array.from(rawDoc.querySelectorAll('link')).find(link => {
        if (link.rel != 'preload') {
            return false;
        }

        let src = link.href;
        if (link.hasAttribute('imagesrcset')) {
            src = splitSrcSet(link.imagesrcset).find(src => src == lcpUrl);
        }

        return src == lcpUrl;
    });

    if (preloadTag) {
        lcpPreload.tag = summarizeElement(preloadTag);
    }

    const linkHeaderString = response_bodies[0].response_headers.link;
    if (!linkHeaderString) {
        return lcpPreload;
    }

    const directives = parseLinkHeader(linkHeaderString);
    if (!(lcpUrl in directives)) {
        return lcpPreload;
    }

    const isLcpPreloadedInLinkHeader = directives[lcpUrl].some(param => {
        return param.key == 'rel' && param.value == 'preload';
    });

    if (isLcpPreloadedInLinkHeader) {
        lcpPreload.header_directives = Object.fromEntries(directives[lcpUrl].map(d => {
            return [d.key, d.value];
        }));
    }

    return lcpPreload;
}

function getRawLcpElement(rawDoc, lcpUrl) {
    const rawLcpElement = Array.from(rawDoc.querySelectorAll('picture source, img')).find(i => {
        let src = i.src;
        if (i.hasAttribute('srcset')) {
            src = splitSrcSet(i.srcset).find(src => src == lcpUrl);
        }

        return src == lcpUrl;
    });

    // lcp_elem_stats will match the img, not the source.
    return summarizeElement(rawLcpElement);
}

function getLcpResponseObject(lcpUrl) {
    const responseObject = response_bodies.find(r => {
        return r.url == lcpUrl;
    });
    if (responseObject) {
        // Don't write the response body to custom metrics.
        responseObject.response_body = undefined;
    }
    return responseObject;
}

return Promise.all([getLcpElement()]).then(([lcp_elem_stats]) => {
    const lcpUrl = lcp_elem_stats.url;
    const rawDoc = getRawHtmlDocument();
    // Start out with true, only if LCP element is an external resource will we eval & potentially set to false.
    // Let's make sure we're not artificially deflating this metric with LCP elements that aren't external.
    let isLcpStaticallyDiscoverable = true;
    let isLcpPreloaded = null;
    let rawLcpElement = null;
    let lcpPreload = null;
    let responseObject = null;
    let gamingMetrics = getGamingMetrics(rawDoc, lcp_elem_stats);
    const isLcpExternalResource = lcpUrl != '';

    if (isLcpExternalResource) {
        // Check if LCP resource reference is in the raw HTML (as opposed to being injected later by JS)
        rawLcpElement = getRawLcpElement(rawDoc, lcpUrl);
        lcpPreload = getLcpPreloadInfo(rawDoc, lcpUrl);
        responseObject = getLcpResponseObject(lcpUrl);

        isLcpPreloaded = 'header_directives' in lcpPreload || 'tag' in lcpPreload;
        isLcpStaticallyDiscoverable = !!rawLcpElement || isLcpPreloaded;
    }

    return {
        lcp_elem_stats,
        raw_lcp_element: rawLcpElement,
        lcp_resource: responseObject,
        is_lcp_statically_discoverable: isLcpStaticallyDiscoverable,
        is_lcp_preloaded: isLcpPreloaded,
        lcp_preload: lcpPreload,
        web_vitals_js: getWebVitalsJS(),
        gaming_metrics: gamingMetrics,
    };
}).catch(error => {
    return {error};
});
