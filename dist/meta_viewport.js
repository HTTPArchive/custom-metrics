//[meta_viewport]

var viewport = undefined;
var metaTags = document.getElementsByTagName("meta");
for (var i = 0; i < metaTags.length; i++) {
    if ( "viewport" == metaTags[i].getAttribute("name") ) {
        viewport = metaTags[i].getAttribute("content");
        break;
    }
}
/* eslint-disable-next-line no-control-regex */
return JSON.stringify(viewport.replace(/[\x00-\x1F\x80-\xFF]/g, ""));
