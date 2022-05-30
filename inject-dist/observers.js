// Note: Using prefixed variable to avoid naming collisions in the global scope.
// This name must exactly match the one referenced in custom metrics.
const httparchive_observers = {
  call_stacks: {},
  function_values: {}
};
let httparchive_enable_observations = false;

// Local scope.
(() => {

// Additional logging.
const DEBUG_MODE = false;

// Add the pathnames of any functions/properties you want to observe.
const OBSERVERS = [
  'navigator.__proto__.*',
  'performance.__proto__.*',
  'performance.timing.__proto__.*',
  'Math.*',
  'Array.prototype.*',
  'String.prototype.*',
  'Object.prototype.*',
  'CSSStyleDeclaration.prototype.*',
  'document.featurePolicy',
  'document.write',
  'queueMicrotask',
  'requestIdleCallback',
  'scheduler.postTask',
  'matchMedia',
  'navigator.scheduling.isInputPending',
  'OfflineAudioContext',
  'OfflineAudioContext.prototype.createOscillator',
  'OfflineAudioContext.prototype.createDynamicsCompressor',
  'HTMLCanvasElement.prototype.getContext',
  'CanvasRenderingContext2D.prototype.rect',
  'CanvasRenderingContext2D.prototype.fillRect',
  'CanvasRenderingContext2D.prototype.fillText',
  'CanvasRenderingContext2D.prototype.beginPath',
  'CanvasRenderingContext2D.prototype.arc',
  'CanvasRenderingContext2D.prototype.fill',
  'HTMLCanvasElement.prototype.toDataURL',
  'screen.colorDepth',
  'indexedDB',
  'openDatabase',
  'Intl.DateTimeFormat.prototype.resolvedOptions',
  'eval',
  'Worker'
];

const PROPERTIES_TO_TRACE = new Set([
  'navigator.userAgent',
  'navigator.vendor',
  'OfflineAudioContext',
  'OfflineAudioContext.prototype.createOscillator',
  'OfflineAudioContext.prototype.createDynamicsCompressor',
  'HTMLCanvasElement.prototype.getContext',
  'HTMLCanvasElement.prototype.toDataURL',
]);

// for each observer: custom function to determine which part of the argument should be captured
const FUNCTION_CALL_ARGUMENTS_TO_CAPTURE = {
  'matchMedia': function (mediaQueryString) {
    const match = mediaQueryString.match(/\(([^:)]+)[:)]/);
    if (match) {
      return match[1];
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

  try {
    return Object.getOwnPropertyNames(parentObj).flatMap(prop => {
      return getAllProperties(`${parentPathname}.${prop}`, depth - 1);
    });
  } catch (e) {
    if (DEBUG_MODE) {
      console.debug(`Cannot get property names of ${parentPathname}, parent object: ${parentObj}, error: ${e}`);
    }
    return pathname;
  }
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

  let parentObj = window;
  if (parentPathname) {
    pathname = `${parentPathname}.${prop}`;
    parentObj = resolveObject(parentPathname);
  }

  try {
    original = parentObj[prop];
  } catch (e) {
    // The property is not accessible.
    if (DEBUG_MODE) {
      console.debug(`${pathname} is not accessible: ${e}`);
    }
    return;
  }

  try {
    Object.defineProperty(parentObj, prop, {
      configurable: true,
      get: () => {
        if (!httparchive_enable_observations) {
          return original;
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
        // Increment the feature counter.
        httparchive_observers[pathname]++;
        if (pathname in FUNCTION_CALL_ARGUMENTS_TO_CAPTURE) {
          return function () {
            const function_value = FUNCTION_CALL_ARGUMENTS_TO_CAPTURE[pathname].apply(this, arguments);
            if (!httparchive_observers.function_values[pathname][function_value]) {
              httparchive_observers.function_values[pathname][function_value] = 0;
            }
            httparchive_observers.function_values[pathname][function_value]++;
            return original.apply(this, arguments);
          }
        }

        // Return the original feature.
        return original;
      }
    });
  } catch (e) {
    // The property is not observable.
    if (DEBUG_MODE) {
      console.debug(`${pathname} is not observable: ${e}`);
    }
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
