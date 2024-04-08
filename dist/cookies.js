// [cookies]

function getCookieStore() {
  return cookieStore.getAll();
}

return Promise.all([
  getCookieStore(),
]).then(([
  cookie_store
]) => {
  return {
    cookie_store,
  };
});
