// Used for WPT
//[valid-head]
// Use DOMParser to extract head elements so browser can't truncate the head
// Loop through each node and check against valid elements array
// Returns object with ARRAY and BOOL
try {
    var html = $WPT_BODIES[0].response_body;
    // create in interrupt element which prevents truncation.
    html = html.replace('</head>', "<interrupt />\n</head>");

    var doc = document.implementation.createHTMLDocument("New Document");
    var head = doc.createElement("div");
    head.innerHTML = html;

    [...head.getElementsByTagName("interrupt")].forEach(el => el.remove());
    var nodes = head.getElementsByTagName("*");

    let data = {
        "invalidElements":  [],
        "invalidHead": false
    }
    var valid_elements = ['title', 'meta', 'link', 'script', 'style', 'base', 'noscript', 'template']
    for (var i = 0; i < nodes.length; i++) {
        let tagname = nodes[i].tagName.toLowerCase()
        if (!valid_elements.includes(tagname)) {
            data.invalidElements.push(tagname);
            data.invalidHead = true;
        };
    }
    return data;
} catch (err) {
    return {error: err.toString()};
}
