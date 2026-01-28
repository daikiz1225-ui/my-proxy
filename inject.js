(function() {
    // 禁じ手1：YouTubeの「オンライン・オフライン判定」を完全に破壊
    Object.defineProperty(navigator, 'onLine', { get: () => true });

    // 禁じ手2：通信の「根っこ（XMLHttpRequest）」を偽装
    const originalXHR = window.XMLHttpRequest;
    function newXHR() {
        const xhr = new originalXHR();
        const originalOpen = xhr.open;
        xhr.open = function(method, url) {
            if (typeof url === 'string' && url.startsWith('http') && !url.includes(location.host)) {
                // 通信先をこっそりBase64プロキシに差し替える
                const b64 = btoa(unescape(encodeURIComponent(url))).replace(/\//g, '_').replace(/\+/g, '-');
                url = window.location.origin + '/proxy/' + b64;
            }
            return originalOpen.apply(this, arguments);
        };
        return xhr;
    }
    window.XMLHttpRequest = newXHR;

    // 禁じ手3：Fetch APIも同様に乗っ取る
    const originalFetch = window.fetch;
    window.fetch = function(input, init) {
        if (typeof input === 'string' && input.startsWith('http') && !input.includes(location.host)) {
            const b64 = btoa(unescape(encodeURIComponent(input))).replace(/\//g, '_').replace(/\+/g, '-');
            input = window.location.origin + '/proxy/' + b64;
        }
        return originalFetch(input, init);
    };

    console.log("YouTube Engine Hacked.");
})();
