// Note: Using prefixed variable to avoid naming collisions in the global scope.
// This name must exactly match the one referenced in custom metrics.
const httparchive_observers = {};
let httparchive_enable_observations = false;

// Local scope.
(() => {

// Add the pathnames of any functions/properties you want to observe.
const OBSERVERS = [
  'navigator.__proto__.*',
  'performance.__proto__.*',
  'performance.timing.__proto__.*',
  'Array.prototype.*',
  'String.prototype.*',
  'Object.prototype.*'
];


function resolveObject(pathname) {
  let obj = window;
  let props = pathname.split('.');

  while (props.length) {
    if (!obj) {
      return null;
    }

    const prop = props.shift();
    obj = obj[prop];
  }

  return obj || null;
}

function getAllProperties(pathname, depth=1) {
  if (!depth) {
    return pathname;
  }

  const props = pathname.split('.');
  const parentPathname = props.slice(0, -1).join('.');
  const parentObj = resolveObject(parentPathname);

  return Object.getOwnPropertyNames(parentObj).flatMap(prop => {
    return getAllProperties(`${parentPathname}.${prop}`, depth - 1);
  });
}

function initializeObserver(pathname) {
  const props = pathname.split('.');
  const prop = props.at(-1);
  let parentPathname;
  let original;
  
  if (props.at(-2) == '__proto__') {
    // Omit __proto__ for observation purposes.
    parentPathname = props.slice(0, -2).join('.');
  } else {
    parentPathname = props.slice(0, -1).join('.');
  }

  pathname = `${parentPathname}.${prop}`;
  const parentObj = resolveObject(parentPathname);

  try {
    original = parentObj[prop];
  } catch (e) {
    // The property is not accessible.
    return;
  }

  try {
    Object.defineProperty(parentObj, prop, {
      configurable: true,
      get: () => {
        if (httparchive_enable_observations) {
          // Increment the feature counter.
          httparchive_observers[pathname]++;
        }

        // Return the original feature.
        return original;
      }
    });
  } catch (e) {
    // The property is not observable.
    return;
  }

  httparchive_observers[pathname] = 0;
}

OBSERVERS.forEach(pathname => {
  if (pathname.split('.').at(-1) == '**') {
    getAllProperties(pathname, 3).forEach(initializeObserver);
    return;
  }

  if (pathname.split('.').at(-1) == '*') {
    getAllProperties(pathname).forEach(initializeObserver);
    return;
  }

  initializeObserver(pathname);
});

httparchive_enable_observations = true;

})();