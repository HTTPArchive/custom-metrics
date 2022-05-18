// Used for WPT
// [valid-head]
// Use DOMParser to extract head elements so browser can't truncate the head
// Loop through each node and check against valid elements array
// Returns object with ARRAY and BOOL
var html = $WPT_BODIES[0].response_body;
var parser = new DOMParser();
var xmlDoc = parser.parseFromString(html,"text/xml");
var head = xmlDoc.getElementsByTagName("head")[0]
var nodes = head.getElementsByTagName("*")

let data = {
    "invalidElements":  [],
    "invalidHead": false
}
var valid_elements = ['title', 'meta', 'link', 'script', 'style', 'base', 'noscript', 'template']
for (var i=0; i<nodes.length;i++) {
    if (!valid_elements.includes(nodes[i].tagName)) {
        data.invalidElements.push(nodes[i].tagName);
        data.invalidHead = true
    };
}
return data
