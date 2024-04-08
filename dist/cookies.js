// [cookies]

async function getCookieStore() {
  return await cookieStore.getAll();
}

return {
  cookie_store: getCookieStore(),
};
