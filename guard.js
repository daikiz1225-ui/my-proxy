(function() {
    const force = () => { Object.defineProperty(navigator, 'onLine', { get: () => true, configurable: true }); };
    force(); setInterval(force, 500);
})();
