const response_bodies = $WPT_BODIES;
const storagePattern = /\b(localStorage|sessionStorage)\b/g;

return Object.fromEntries(response_bodies.filter(har => {
  return storagePattern.test(har.response_body);
}).map(har => {
  const matches = Array.from(har.response_body.matchAll(storagePattern));
  const counts = matches.reduce((acc, match) => {
    const key = match[0];
    if (!acc[key]) {
      acc[key] = 0;
    }
    acc[key]++;
    return acc;
  }, { numLocalStorage: 0, numSessionStorage: 0 });

  return [har.url, { numLocalStorage: counts.localStorage || 0, numSessionStorage: counts.sessionStorage || 0 }];
}));