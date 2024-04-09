// [cookies]

function getCookieStore() {
  return cookieStore.getAll();
}

function getHTTPCookies() {
  const requests = $WPT_REQUESTS;
  return requests.filter(r => {
    return r.response_headers['set-cookie']
  }).map(r => ({
    url: r.url,
    response_header: r.response_headers['set-cookie'],
    directives: Object.fromEntries(r.response_headers['set-cookie'].split(/;\s*/).map(directive => {
      return directive.split('=');
    }))
  }));
}

return Promise.all([
  getCookieStore(),
]).then(([
  cookie_store
]) => {
  const response_headers = getHTTPCookies();

  return {
    cookie_store,
    response_headers
  };
});
