// Used for WPT
// [valid-head]
// Use DOMParser to extract head elements so browser can't truncate the head
// Loop through each node and check against valid elements array
// Returns object with ARRAY and BOOL
try {
    var html = $WPT_BODIES[0].response_body;
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(html,"text/xml");

    // remove <parsererror> because HTML is not really XML
    let pe = xmlDoc.getElementsByTagName("parsererror")
    if (pe.length > 0) {
        pe[0].remove()
    }
    
    var head = xmlDoc.getElementsByTagName("head")[0]
    var nodes = head.getElementsByTagName("*")
    

    let data = {
        "invalidElements":  [],
        "invalidHead": false
    }
    var valid_elements = ['title', 'meta', 'link', 'script', 'style', 'base', 'noscript', 'template']
    for (var i=0; i<nodes.length;i++) {
        let tagname = nodes[i].tagName.toLowerCase()
        if (!valid_elements.includes(tagname)) {
            data.invalidElements.push(nodes[i].tagName);
            data.invalidHead = true
        };
    }
    return data
} catch (err) {
    console.log(err);
  return {
      error: err.toString()
  }
}