self.addEventListener('fetch', (event) => {
    const url = event.request.url;
    if (url.includes(location.host) || !url.startsWith('http')) return;

    const b64 = btoa(unescape(encodeURIComponent(url))).replace(/\//g, '_').replace(/\+/g, '-');
    event.respondWith(fetch('/api/proxy?url=' + b64));
});
self.addEventListener('activate', e => e.waitUntil(clients.claim()));
