// Note: Using prefixed variables to avoid naming collisions in the global scope.
// Map of features to the number of times they are accessed by the page.
const httparchive_observers = {};
// Preserve the initial state of any features whose getter methods will be overwritten.
const httparchive_init = {
  navigator: {
    userAgent: navigator.userAgent
  }
};

// Define a getter method for the navigator.userAgent property.
Object.defineProperty(navigator, 'userAgent', {
    get: () => {
        // Increment the feature counter.
        httparchive_observers.userAgent = (httparchive_observers.userAgent || 0) + 1;
        // Return the original feature.
        return httparchive_init.navigator.userAgent;
    }
});
