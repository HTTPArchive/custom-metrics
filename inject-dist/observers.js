// Note: Using prefixed variables to avoid naming collisions in the global scope.
// Map of features to the number of times they are accessed by the page.
const httparchive_observers = {};
// Preserve the initial state of any features whose getter methods will be overwritten.
const httparchive_init = {
  navigator: {
    userAgent: navigator.userAgent,
    globalPrivacyControl: navigator.globalPrivacyControl,
    doNotTrack: navigator.doNotTrack,
  },
  document: {
    featurePolicy: document.featurePolicy
  },
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

// Define a getter method for the navigator.globalPrivacyControl property.
Object.defineProperty(navigator, 'globalPrivacyControl', {
  get: () => {
    // Increment the feature counter.
    httparchive_observers.globalPrivacyControl = (httparchive_observers.globalPrivacyControl || 0) + 1;
    // Return the original feature.
    return httparchive_init.navigator.globalPrivacyControl;
  }
});

// Define a getter method for the navigator.doNotTrack property.
Object.defineProperty(navigator, 'doNotTrack', {
  get: () => {
    // Increment the feature counter.
    httparchive_observers.doNotTrack = (httparchive_observers.doNotTrack || 0) + 1;
    // Return the original feature.
    return httparchive_init.navigator.doNotTrack;
  }
});

// Define a getter method for the document.featurePolicy property.
Object.defineProperty(document, 'featurePolicy', {
  get: () => {
    // Increment the feature counter.
    httparchive_observers.featurePolicy = (httparchive_observers.featurePolicy || 0) + 1;
    // Return the original feature.
    return httparchive_init.document.featurePolicy;
  }
});
