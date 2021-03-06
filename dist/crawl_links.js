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
    const documentOrigin = $WPT_TEST_URL;
    const elements = document.links;
    for (let e of elements) {
        try {
            const rect = e.getBoundingClientRect();
            const style = window.getComputedStyle(e);
            const is_visible = e.offsetParent !== null &&
                                style.visibility !== 'hidden' &&
                                style.display !== 'none' &&
                                intersectRect(rect, viewport);
            if (rect.width > 1 && rect.height > 1 && (is_visible || !visibleOnly) ) {
                if (e && e.href.split('#')[0] != documentOrigin && sameOrigin(e.href, documentOrigin)) {
                    let size = rect.width * rect.height;
                    if (links[e.href] === undefined) {
                        links[e.href] = size;
                    } else {
                        links[e.href] += size;
                    }
                }
            }
        } catch (e) {
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
