var aElems = document.getElementsByTagName("script");
var nSync = 0;
for ( var i = 0, len = aElems.length; i < len; i++ ) {
    var e = aElems[i];
    if ( e.src ) {
        if ( !e.async ) {
          nSync++;
        }
    }
}

return nSync;
