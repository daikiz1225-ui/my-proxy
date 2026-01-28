(function() {
    const forceOnline = () => {
        Object.defineProperty(navigator, 'onLine', { get: () => true, configurable: true });
        window.dispatchEvent(new Event('online'));
    };
    forceOnline();
    setInterval(forceOnline, 500); // 0.5秒ごとにチェック
    console.log("Specialist: Guard active.");
})();
