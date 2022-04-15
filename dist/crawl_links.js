/*
Collects same-origin in-viewport links from img, h[1-6] tags,
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
    uri1 = new URL(uri1);
    uri2 = new URL(uri2);
    if(uri1.host !== uri2.host) return false;
    if(uri1.port !== uri2.port) return false;
    if(uri1.protocol !== uri2.protocol) return false;
    return true;
}
const viewport = {
    left: 0,
    top: 0,
    right: (window.innerWidth || document.documentElement.clientWidth),
    bottom: (window.innerHeight || document.documentElement.clientHeight)
};
let links = {};
const documentOrigin = window.location.href;
const elements = document.querySelectorAll('img, h1, h2, h3, h4, h5, h6');
for (let e of elements) {
    const rect = e.getBoundingClientRect();
    if (rect.width > 1 && rect.height > 1 && intersectRect(rect, viewport)) {
        let link = e.querySelector('a[href]') || e.closest('a[href]');
        if (link && sameOrigin(link.href, documentOrigin)) {
            let size = rect.width * rect.height;
            if (links[link.href] === undefined) {
                links[link.href] = size;
            } else {
                links[link.href] += size;
            }
        }
    }
}
crawl_urls = Object.keys(links);
crawl_urls.sort((a, b) => links[a] <= links[b] ? 1 : -1);
return crawl_urls;
