// Note: Using prefixed variable to avoid naming collisions in the global scope.
// This name must exactly match the one referenced in custom metrics.
const httparchive_observers = {
  call_stacks: {},
  function_values: {}
};
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
  'Object.prototype.*',
  'CSSStyleDeclaration.prototype.*',
  'document.featurePolicy',
  'document.write',
  'queueMicrotask',
  'requestIdleCallback',
  'scheduler.postTask',
  'window.matchMedia'
];

const PROPERTIES_TO_TRACE = new Set([
  'navigator.userAgent'
]);

// for each observer: custom function to determine which part of the argument should be captured
const FUNCTION_CALL_ARGUMENTS_TO_CAPTURE = {
  "window.matchMedia": function (arg) {
    const m = arg.match(/\(([^:)]+)[:)]/);
    if (m) {
      return m[1];
    }
    return null;
  }
}


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
  let toReturn;

  try {
    original = parentObj[prop];
    toReturn = original;
  } catch (e) {
    // The property is not accessible.
    return;
  }

  try {
    Object.defineProperty(parentObj, prop, {
      configurable: true,
      get: () => {
        if (!httparchive_enable_observations) {
          return toReturn;
        }

        if (PROPERTIES_TO_TRACE.has(pathname)) {
          // Construct a stack trace.
          let stack;
          try {
            throw new Error();
          } catch (e) {
            stack = e.stack;
          }
          let stackCounter = httparchive_observers.call_stacks[pathname];
          if (!stackCounter[stack]) {
            stackCounter[stack] = 0;
          }
          stackCounter[stack]++;
        }

        if (pathname in FUNCTION_CALL_ARGUMENTS_TO_CAPTURE) {
          toReturn = function () {
            const function_value = FUNCTION_CALL_ARGUMENTS_TO_CAPTURE[pathname].apply(this, arguments);
            if (!httparchive_observers.function_values[pathname][function_value]) {
              httparchive_observers.function_values[pathname][function_value] = 0;
            }
            httparchive_observers.function_values[pathname][function_value]++;
            return original.apply(this, arguments);
          }
        }

        // Increment the feature counter.
        httparchive_observers[pathname]++;

        // Return the original feature.
        return toReturn;
      }
    });
  } catch (e) {
    // The property is not observable.
    return;
  }

  if (PROPERTIES_TO_TRACE.has(pathname)) {
    httparchive_observers.call_stacks[pathname] = {};
  }

  if (pathname in FUNCTION_CALL_ARGUMENTS_TO_CAPTURE) {
    httparchive_observers.function_values[pathname] = {};
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
