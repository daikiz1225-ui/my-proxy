(function() {
    // 1. ブラウザの接続判定を常に「オンライン」にする
    Object.defineProperty(navigator, 'onLine', { get: () => true });

    // 2. 言語を日本語に固定
    document.cookie = "PREF=hl=ja&gl=JP; domain=.youtube.com; path=/";

    // 3. YouTubeの特定の通信を監視して、エラーが出そうならダミーの成功を返す
    const orgFetch = window.fetch;
    window.fetch = function(...args) {
        if (args[0] && typeof args[0] === 'string' && args[0].includes('generate_204')) {
            return Promise.resolve(new Response('', { status: 204 }));
        }
        return orgFetch.apply(this, args);
    };
    console.log("Offline prevention active.");
})();
