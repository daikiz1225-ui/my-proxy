self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((names) => {
            for (let name of names) caches.delete(name);
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // 自分のサイト以外へのリクエストは全てBase64プロキシへ
    if (!event.request.url.includes(location.host)) {
        const b64 = btoa(unescape(encodeURIComponent(event.request.url))).replace(/\//g, '_').replace(/\+/g, '-');
        event.respondWith(fetch('/proxy/' + b64));
    }
});
