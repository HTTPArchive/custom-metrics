// [cookies]

function getCookieStore() {
  return cookieStore.getAll();
}

function getHTTPCookies() {
  const requests = $WPT_REQUESTS;
  return requests.filter(request => {
    return 'set-cookie' in (request.response_headers ?? {})
  }).flatMap(request => {
    const values = request.response_headers['set-cookie'];
    // There may be multiple Set-Cookie headers delimited by newlines.
    return values.split('\n').map(value => {
      let cookie_name = null;
      let cookie_value = null;
      // Directives are delimited by semicolons.
      const directives =  Object.fromEntries(value.split(/;\s*/).map((directive, i) => {
        // Key/value pairs are delimited by equals signs.
        const [key, value] = directive.split('=');
        if (i == 0) {
          // The first directive is the cookie name and value.
          [cookie_name, cookie_value] = [key, value ?? null];
        }
        // Use nullish coalescing to ensure that boolean directives are not omitted from the directive object.
        // Examples: HttpOnly, Secure, and Partitioned.
        return [key, value ?? null];
      }));

      return {
        request_id: request.id,
        request_url: request.url,
        cookie_name,
        cookie_value,
        response_header: value,
        directives,
        http_only: 'HttpOnly' in directives,
        secure: 'Secure' in directives,
        partitioned: 'Partitioned' in directives,
      };
    });
  });
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
