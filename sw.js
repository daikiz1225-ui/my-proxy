self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 1. 自分のサイトのファイル（index.html, api等）はそのまま通す
    if (url.host === location.host) return;

    // 2. それ以外の「すべての通信」をBase64に包んでプロキシに投げる
    const b64 = btoa(unescape(encodeURIComponent(event.request.url)))
                .replace(/\//g, '_').replace(/\+/g, '-');
    
    event.respondWith(
        fetch('/api/proxy?url=' + b64, {
            method: event.request.method,
            headers: event.request.headers,
            credentials: 'include',
            mode: 'cors'
        }).catch(() => fetch(event.request))
    );
});

// 即時有効化
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));
