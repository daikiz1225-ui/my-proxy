(function() {
    // 1. ブラウザの接続判定を「常にオンライン」に固定
    Object.defineProperty(navigator, 'onLine', { get: () => true });

    // 2. YouTube専用のオンライン判定APIを「成功」で上書き
    const originalFetch = window.fetch;
    window.fetch = function() {
        if (arguments[0] && arguments[0].includes && arguments[0].includes('generate_204')) {
            return Promise.resolve(new Response('', { status: 204 }));
        }
        return originalFetch.apply(this, arguments);
    };

    // 3. ネットワーク状態が変わったという通知をすべてブロック
    window.addEventListener('offline', (e) => {
        e.stopImmediatePropagation();
        console.log("Offline event blocked.");
    }, true);

    // 4. 日本語化の徹底
    document.cookie = "PREF=hl=ja&gl=JP; domain=.youtube.com; path=/";
    
    console.log("YouTube Bypass Engine: ONLINE FORCE ACTIVE");
})();
