self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // すでにプロキシを通っているものや内部ファイルは無視
    if (url.pathname.includes('/api/proxy') || url.host.includes(location.host)) return;

    // 通信をBase64に包む際、不完全なURLにならないよう調整
    const b64 = btoa(unescape(encodeURIComponent(event.request.url))).replace(/\//g, '_').replace(/\+/g, '-');
    event.respondWith(fetch('/api/proxy?url=' + b64));
});
