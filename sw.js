self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // 自分のサーバーへのリクエスト以外をすべて捕まえる
    if (!url.host.includes(location.host)) {
        const b64 = btoa(unescape(encodeURIComponent(event.request.url))).replace(/\//g, '_').replace(/\+/g, '-');
        event.respondWith(fetch('/proxy/' + b64));
    }
});
