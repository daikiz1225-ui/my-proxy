self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));

self.addEventListener('fetch', (event) => {
    const url = event.request.url;
    if (url.includes(location.host) || !url.startsWith('http')) return;

    // 通信をBase64で包んで、i-FILTERの検閲をスルーさせる
    const b64 = btoa(unescape(encodeURIComponent(url))).replace(/\//g, '_').replace(/\+/g, '-');
    
    event.respondWith(
        fetch('/proxy/' + b64, {
            method: event.request.method,
            headers: event.request.headers,
            credentials: 'include' // これがオフライン対策に重要
        }).catch(() => fetch(event.request))
    );
});
