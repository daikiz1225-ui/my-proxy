(function() {
    // YouTubeに「常にオンラインだ」と思い込ませる
    Object.defineProperty(navigator, 'onLine', { get: () => true });
    
    // ページ内のすべてのリンクをプロキシ経由に書き換え続ける
    setInterval(() => {
        document.querySelectorAll('a, img, iframe').forEach(el => {
            const src = el.href || el.src;
            if (src && src.startsWith('http') && !src.includes(location.host)) {
                const b64 = btoa(unescape(encodeURIComponent(src))).replace(/\//g, '_').replace(/\+/g, '-');
                if (el.href) el.href = window.location.origin + '/proxy/' + b64;
                if (el.src) el.src = window.location.origin + '/proxy/' + b64;
            }
        });
    }, 2000);
})();
