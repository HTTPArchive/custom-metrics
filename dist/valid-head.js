var valid_elements = ['TITLE', 'META', 'LINK', 'SCRIPT', 'STYLE', 'BASE', 'NOSCRIPT', 'TEMPLATE']
var elems = document.head.getElementsByTagName("*");
for (var i=0; i<elems.length;i++) {
    if (!valid_elements.includes(elems[i].tagName)) {
        return true;
    };
}
return false
