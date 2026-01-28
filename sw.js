self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));

self.addEventListener('fetch', (event) => {
    const url = event.request.url;
    if (url.includes(location.host) || !url.startsWith('http')) return;

    // YouTubeが「ネットに繋がってるか」を確認する特定のURLを狙い撃ち
    if (url.includes('/generate_204')) {
        event.respondWith(new Response('', { status: 204, statusText: 'No Content' }));
        return;
    }

    const b64 = btoa(unescape(encodeURIComponent(url))).replace(/\//g, '_').replace(/\+/g, '-');
    
    event.respondWith(
        fetch('/proxy/' + b64, {
            method: event.request.method,
            headers: event.request.headers,
            credentials: 'include'
        }).catch(() => fetch(event.request))
    );
});
