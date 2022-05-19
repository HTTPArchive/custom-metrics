const httparchive_observers = {};

const httparchive_init = {navigator: {userAgent: navigator.userAgent}};

Object.defineProperty(navigator, 'userAgent', {
    get: () => {
        httparchive_observers.userAgent = (httparchive_observers.userAgent || 0) + 1;
        return httparchive_init.navigator.userAgent;
    }
})
