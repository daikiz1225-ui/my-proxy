(function() {
    // 日本語環境を強制
    Object.defineProperty(navigator, 'language', { get: () => 'ja-JP' });
    Object.defineProperty(navigator, 'languages', { get: () => ['ja-JP', 'ja'] });

    // 「無効な反応」の原因になる一部の追跡通信をブロックして、エラーを出させない
    const blacklisted = ['/log_event', '/stats/', '/ptracking/'];
    
    const originalFetch = window.fetch;
    window.fetch = function(input, init) {
        const url = typeof input === 'string' ? input : input.url;
        if (blacklisted.some(path => url.includes(path))) {
            return Promise.resolve(new Response('', { status: 204 }));
        }
        return originalFetch.apply(this, arguments);
    };

    console.log("Japanese Bypass Active");
})();
