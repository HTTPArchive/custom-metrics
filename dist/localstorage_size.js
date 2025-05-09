function storageSize(storage) {
  var numkeys = numKeys(storage);
  var bytes = 0;
  for ( var i = 0; i < numkeys; i++ ) {
    var key = storage.key(i);
    var val = storage.getItem(key);
    bytes += key.length + val.length;
  }
  return bytes;
}

function numKeys(storage) {
  if ( "undefined" != typeof(storage.length) ) {
    return storage.length;
  }
  else {
    let len = 0;
    Object.keys(storage).forEach(() => {
      len++;
    });
    return len;
  }
}

return storageSize(localStorage);
