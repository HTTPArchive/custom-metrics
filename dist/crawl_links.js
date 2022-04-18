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
let links = {};
const documentOrigin = window.location.href;
const elements = document.links;
for (let e of elements) {
    try {
        const rect = e.getBoundingClientRect();
        const style = window.getComputedStyle(e);
        if (rect.width > 1 && rect.height > 1 &&
                e.offsetParent !== null &&
                style.visibility !== 'hidden' &&
                style.display !== 'none' &&
                intersectRect(rect, viewport)) {
            if (e && e.href != documentOrigin && sameOrigin(e.href, documentOrigin)) {
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
return sortedLinks.slice(0, 20);
