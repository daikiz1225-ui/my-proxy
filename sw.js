self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));

self.addEventListener('fetch', (event) => {
    const url = event.request.url;
    if (url.includes(location.host) || !url.startsWith('http')) return;

    const b64 = btoa(unescape(encodeURIComponent(url))).replace(/\//g, '_').replace(/\+/g, '-');
    
    event.respondWith(
        fetch('/proxy/' + b64, {
            headers: event.request.headers,
            credentials: 'include'
        }).then(res => {
            // CSSが巨大化しないよう、Content-Typeを正しく維持する
            return res;
        }).catch(() => fetch(event.request))
    );
});
