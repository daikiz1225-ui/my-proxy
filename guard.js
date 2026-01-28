(function() {
    const forceOnline = () => {
        Object.defineProperty(navigator, 'onLine', { get: () => true, configurable: true });
        window.dispatchEvent(new Event('online'));
    };
    // 0.05秒ごとに「オンラインだぞ」と念じ続ける
    forceOnline();
    setInterval(forceOnline, 50);
    console.log("Guard Active: Offline blocked.");
})();
