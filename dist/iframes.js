var getIframes = function (win) {
  var iframes = [];
  if (win) {
    var doc = win.document;
    var elements = doc.getElementsByTagName("iframe");
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      var url = el.currentSrc || el.src;

      iframes.push({
        url: url,
        width: el.width,
        height: el.height,
        naturalWidth: el.naturalWidth,
        naturalHeight: el.naturalHeight,
        inViewport:
          el.getBoundingClientRect().bottom >= 0 &&
          el.getBoundingClientRect().right >= 0 &&
          el.getBoundingClientRect().top <= window.innerHeight &&
          el.getBoundingClientRect().left <= window.innerWidth,
      });
      if (iframes.length > 10000) break;
    }
  }
  return iframes;
};

return JSON.stringify(getIframes(window));
