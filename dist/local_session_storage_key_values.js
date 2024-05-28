function getLocalStorageKeyValues() {
  return { ...localStorage };
}

function getSessionStorageKeyValues() {
  return { ...sessionStorage };
}

const storageData = {
  allLocalStorage: getLocalStorageKeyValues(),
  allSessionStorage: getSessionStorageKeyValues()
}

return storageData;