// guard.js
(function() {
    const ironCladOnline = () => {
        Object.defineProperty(navigator, 'onLine', { get: () => true, configurable: true });
        window.dispatchEvent(new Event('online'));
    };
    ironCladOnline();
    setInterval(ironCladOnline, 100); // 0.1秒ごとにオンラインを強制

    // YouTube用の言語設定を焼き付ける
    document.cookie = "PREF=hl=ja&gl=JP; domain=.youtube.com; path=/";
    console.log("Specialist: Guard active.");
})();
