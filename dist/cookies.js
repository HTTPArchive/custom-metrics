// [cookies]

function getCookieStore() {
  return cookieStore.getAll();
}

function getHTTPOnlyCookies() {
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

      const url = new URL(request.url);
      let expires = new Date(directives.expires)?.getTime();
      if (directives['Max-Age']) {
        // Max-Age takes precedence over Expires, per MDN.
        expires = Date.now() + directives['Max-Age'] * 1000;
      }

      return {
        name: cookie_name,
        value: cookie_value,
        domain: url.hostname,
        expires,
        path: directives.Path,
        sameSite: directives.SameSite,
        httpOnly: 'HttpOnly' in directives,
        secure: 'Secure' in directives,
        partitioned: 'Partitioned' in directives,
      };
    });
  }).filter(cookie => {
    return cookie.httpOnly
  });
}

return Promise.all([
  getCookieStore(),
]).then(([
  cookieStore
]) => {
  const httpOnlyCookies = getHTTPOnlyCookies();

  return [
    ...cookieStore,
    ...httpOnlyCookies
  ];
});
