observers = {};

init = {navigator: {userAgent: navigator.userAgent}};

Object.defineProperty(navigator, 'userAgent', {
    get: () => {
        observers.userAgent = (observers.userAgent || 0) + 1;
        return init.navigator.userAgent;
    }
})
