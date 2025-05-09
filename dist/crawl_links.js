/*
Collects up to 20 same-origin in-viewport links from img, h[1-6] tags,
sorted by size from largest to smallest.
This is the seed for generating a list of URLs to crawl from the given page.
*/
const intersectRect = function (r1, r2) {
    return !(r2.left > r1.right ||
              r2.right < r1.left ||
              r2.top > r1.bottom ||
              r2.bottom < r1.top);
};
const sameOrigin = function(uri1, uri2){
    try {
        uri1 = new URL(uri1);
        uri2 = new URL(uri2);
        return uri1.origin == uri2.origin;
    } catch(e) {
      // continue regardless of error
    }
    return false;
}
const viewport = {
    left: 0,
    top: 0,
    right: (window.innerWidth || document.documentElement.clientWidth),
    bottom: (window.innerHeight || document.documentElement.clientHeight)
};
const getLinks = function(visibleOnly){
    let links = {};
    const testUrl = $WPT_TEST_URL;
    const currentUrl = document.location.href.split('#')[0];
    // Only crawl links for pages that did not do a crossorigin redirect
    if (sameOrigin(currentUrl, testUrl)) {
        const elements = document.links;
        for (let e of elements) {
            try {
                const rect = e.getBoundingClientRect();
                const style = window.getComputedStyle(e);
                const is_visible = e.offsetParent !== null &&
                                    style.visibility !== 'hidden' &&
                                    style.display !== 'none' &&
                                    intersectRect(rect, viewport);
                // Link is user-visible.
                if (rect.width > 1 && rect.height > 1 && (is_visible || !visibleOnly) && e) {
                    const url = e.href.split('#')[0];
                    // Link is not the current page.
                    if (url != testUrl && url != currentUrl) {
                        // Link is to the same origin as the current page.
                        if (sameOrigin(url, currentUrl)) {
                            let size = rect.width * rect.height;
                            if (links[url] === undefined) {
                                links[url] = size;
                            } else {
                                links[url] += size;
                            }
                        }
                    }
                }
            } catch (e) {
              // continue regardless of error
            }
        }
    }
    let sortedLinks = Object.keys(links);
    sortedLinks.sort((a, b) => links[a] <= links[b] ? 1 : -1);
    return sortedLinks;
}
let sortedLinks = getLinks(true);
if (sortedLinks.length < 20) {
    let hiddenLinks = getLinks(false);
    for (let link of hiddenLinks) {
        if (!sortedLinks.includes(link)) {
            sortedLinks.push(link);
        }
    }
}
return sortedLinks.slice(0, 20);
