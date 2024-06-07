function getLocalStorageKeyValues() {
  return Object.keys(localStorage)
    .reduce((obj, key) => {
      const value = localStorage.getItem(key);
      obj[key] = value ? value.substring(0, 256) : value;
      return obj;
    }, {});
}

function getSessionStorageKeyValues() {
  return Object.keys(sessionStorage)
    .reduce((obj, key) => {
      const value = sessionStorage.getItem(key);
      obj[key] = value ? value.substring(0, 256) : value;
      return obj;
    }, {});
}

const storageData = {
  allLocalStorage: getLocalStorageKeyValues(),
  allSessionStorage: getSessionStorageKeyValues()
}

return storageData;