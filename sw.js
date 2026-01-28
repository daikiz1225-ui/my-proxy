self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    // 自分のサーバーへのリクエスト（apiやjsファイル）はそのまま通す
    if (url.host === location.host) return;

    // それ以外の通信をすべてプロキシ経由に変換
    const b64 = btoa(unescape(encodeURIComponent(event.request.url)))
                .replace(/\//g, '_').replace(/\+/g, '-');
    
    event.respondWith(
        fetch('/api/proxy?url=' + b64, {
            method: event.request.method,
            headers: event.request.headers,
            credentials: 'include'
        }).catch(() => fetch(event.request))
    );
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));
