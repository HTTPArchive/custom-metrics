const intersectRect = function (r1, r2) {
    return !(r2.left > r1.right || 
              r2.right < r1.left || 
              r2.top > r1.bottom ||
              r2.bottom < r1.top);
};
const viewport = {
    left: 0,
    top: 0,
    right: (window.innerWidth || document.documentElement.clientWidth),
    bottom: (window.innerHeight || document.documentElement.clientHeight)
};
const getBoundingClientRect = function(element) { 
    const rect = element.getBoundingClientRect()
    return {
        top: parseInt(rect.top),
        right: parseInt(rect.right),
        bottom: parseInt(rect.bottom),
        left: parseInt(rect.left),
        width: parseInt(rect.width),
        height: parseInt(rect.height),
        x: parseInt(rect.x),
        y: parseInt(rect.y)
      };
};
const sameOrigin = function(uri1, uri2){
    uri1 = new URL(uri1);
    uri2 = new URL(uri2);
    if(uri1.host !== uri2.host) return false;
    if(uri1.port !== uri2.port) return false;
    if(uri1.protocol !== uri2.protocol) return false;
    return true;
}
let links = {};
const elementTypes = ['img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
const documentOrigin = window.location.href;
for (let eType of elementTypes) {
    let elements = document.querySelectorAll(eType);
    for (let e of elements) {
        const rect = getBoundingClientRect(e);
        if (rect.width > 1 && rect.height > 1 && intersectRect(rect, viewport)) {
            let link = e.querySelector('a[href]') || e.closest('a[href]');
            if (link && sameOrigin(link.href, documentOrigin)) {
                let entry = {
                    href: link.href,
                    rect: rect,
                    size: rect.width * rect.height
                };
                const title = link.getAttribute('title');
                if (title) {
                    entry['title'] = title;
                }
                const innerText = e.innerText;
                if (innerText) {
                    entry['text'] = innerText;
                }
                if (links[eType] === undefined) {
                    links[eType] = [];
                }
                links[eType].push(entry);
            }
        }
    }
    if (links[eType] !== undefined) {
        links[eType].sort((a, b) => a.size <= b.size ? 1 : -1);
    }
}
if (Object.keys(links).length > 0) {
    links["viewport"] = viewport;
}
return links;
