self.addEventListener('fetch', (event) => {
    const url = event.request.url;
    if (url.includes(location.host) || !url.startsWith('http')) return;

    // リンク移動、画像、API通信、すべてを個別のプロキシに振り分ける
    const b64 = btoa(unescape(encodeURIComponent(url))).replace(/\//g, '_').replace(/\+/g, '-');
    
    let proxyPath = '/api/proxy';
    if (url.includes('youtube.com')) proxyPath = '/api/youtube';
    if (url.includes('poki.com')) proxyPath = '/api/poki';

    event.respondWith(
        fetch(`${proxyPath}?url=${b64}`, {
            headers: event.request.headers,
            credentials: 'include'
        }).catch(() => fetch(event.request))
    );
});
