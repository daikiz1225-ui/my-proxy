self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    if (url.host === location.host) return;
    const b64 = btoa(unescape(encodeURIComponent(event.request.url))).replace(/\//g, '_').replace(/\+/g, '-');
    event.respondWith(fetch('/api/proxy?url=' + b64));
});
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));
