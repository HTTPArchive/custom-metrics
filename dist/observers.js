//[observers]
// Reads the global httparchive_observers from the injected script.
// See https://github.com/HTTPArchive/custom-metrics/tree/main/inject-dist

return Object.fromEntries(Object.entries(httparchive_observers).filter(([_, value]) => value));
